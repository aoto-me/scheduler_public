import { API_ENDPOINTS, ICONS } from '@/configs';
import { useErrorContext } from '@/contexts';
import { useHttpRequest, useSaveFile } from '@/hooks';
import {
  addGalleryItem,
  updateDiary,
  updateDiaryThumbnail,
  updateGalleryCardThumbnail,
  updateGalleryCardUpdated,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { theme } from '@/theme';
import type { GalleryCard, ImageItem } from '@/types';
import { splitFileName, uploadFileValidator } from '@/utils';
import { Box } from '@mui/material';
import { format } from 'date-fns';
import { type Dispatch, memo, type SetStateAction, useCallback, useMemo } from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';
import { useParams } from 'react-router-dom';
import { Icon } from '../ui';

const baseStyle = {
  alignItems: 'center',
  aspectRatio: '1 / 1',
  border: `2px dashed`,
  borderColor: theme.palette.secondary.light,
  borderRadius: '4px',
  color: theme.palette.secondary.main,
  cursor: 'pointer',
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  outline: 'none',
  width: '100%',
};

const focusedStyle = {
  borderColor: theme.palette.secondary.dark,
};

const dragStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
  borderColor: theme.palette.secondary.dark,
  color: theme.palette.text.primary,
};

interface ImageUploaderProps {
  cardId?: number;
  date?: string; // diaryのみ
  decodedPath: string;
  items: number[];
  setCardMap?: React.Dispatch<React.SetStateAction<Map<number, GalleryCard> | null>>;
  setIsUploading: Dispatch<SetStateAction<boolean>>;
  setItemMap?: React.Dispatch<React.SetStateAction<Map<number, ImageItem> | null>>;
  setItems?: React.Dispatch<React.SetStateAction<number[]>>;
  setThumbnailMap?: Dispatch<SetStateAction<Map<number, string> | null>>;
  uploadUrl: string;
}

export const ImageUploader = memo(
  ({
    cardId,
    date,
    decodedPath,
    items,
    setCardMap,
    setIsUploading,
    setItemMap,
    setItems,
    setThumbnailMap,
    uploadUrl,
  }: ImageUploaderProps) => {
    const { setErrors } = useErrorContext();
    const { uploadFile } = useSaveFile();
    const { postRequest } = useHttpRequest();
    const dispatch = useAppDispatch();
    const { postId } = useParams();

    const numericPostId = postId !== undefined && postId !== 'diary' ? Number(postId) : undefined;

    const currentCardThumbnail = useAppSelector(state => {
      if (numericPostId === undefined || !cardId) return;
      return state.gallery.data[numericPostId]?.cardContent?.thumbnail[cardId];
    });

    const handleSaveItem = useCallback(
      (uploadedFiles: string[]) => {
        const updated = format(new Date(), 'yyyy-MM-dd');
        const apiUrl =
          postId === 'diary'
            ? `${API_ENDPOINTS.diary}item/${String(cardId)}/`
            : `${API_ENDPOINTS.gallery}item/${postId ?? ''}/`;
        const sortStart = items.length + 1;
        postRequest<number[]>({
          apiUrl,
          data: {
            cardId,
            files: uploadedFiles,
            sort: sortStart,
            updated,
          },
        })
          .then(response => {
            if (!response) return;
            const addItems: ImageItem[] = [];
            for (const [index, fileName] of uploadedFiles.entries()) {
              const { extension, name } = splitFileName(fileName);
              addItems.push({
                cardId: cardId ?? null,
                extension,
                id: response[index],
                name,
                sort: sortStart + index,
                url: `${uploadUrl}${fileName}`,
              });
            }
            setItems?.(prev => {
              return [...prev, ...response];
            });
            setItemMap?.(prev => {
              const newMap = new Map(prev);
              for (const item of addItems) {
                newMap.set(item.id, item);
              }
              return newMap;
            });
            // imgの場合
            if (numericPostId !== undefined && !cardId) {
              for (const item of addItems) {
                dispatch(addGalleryItem({ galleryId: numericPostId, item }));
              }
            }
            if (setThumbnailMap && cardId && setCardMap) {
              setThumbnailMap(prev => {
                if (!prev) return null;
                const newMap = new Map(prev);
                const file = newMap.get(cardId);
                if (file && file !== '') return prev; // 既にサムネイルがあれば、そのまま
                newMap.set(cardId, uploadedFiles[0]);
                return newMap;
              });
              setCardMap(prev => {
                if (!prev) return prev;
                const newMap = new Map(prev);
                // 更新日の更新
                newMap.set(cardId, { ...newMap.get(cardId)!, updated });
                return newMap;
              });
            }
            // cardの場合
            if (numericPostId !== undefined && cardId) {
              if (!currentCardThumbnail) {
                dispatch(updateGalleryCardThumbnail({ cardId, file: uploadedFiles[0], galleryId: numericPostId }));
              }
              dispatch(updateGalleryCardUpdated({ cardId, galleryId: numericPostId, updated }));
            }
            if (postId === 'diary' && cardId && date) {
              // サムネイルが空だったら、サムネイルにセット
              dispatch(
                updateDiaryThumbnail({
                  id: cardId,
                  newFile: uploadedFiles[0],
                  oldFile: '',
                })
              );
              // 更新日の更新
              dispatch(
                updateDiary({
                  date,
                  id: cardId,
                  target: 'updated',
                  updated,
                })
              );
            }
          })
          .catch(() => {
            console.error('ギャラリーアイテムの新規保存に失敗しました');
          })
          .finally(() => {
            setIsUploading(false);
          });
      },
      [
        date,
        dispatch,
        items,
        postId,
        cardId,
        uploadUrl,
        postRequest,
        setIsUploading,
        setItems,
        setItemMap,
        setThumbnailMap,
        setCardMap,
        numericPostId,
        currentCardThumbnail,
      ]
    );

    const handleSubmit = useCallback(
      (files: File[]) => {
        if (files.length === 0) return;

        // 合計サイズ（バイト単位）を計算
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        const maxSize = 500 * 1024 * 1024; // 500MB
        // 上限超えなら中断
        if (totalSize > maxSize) {
          const errorMessage = 'ファイルの合計サイズが500MBを超えています';
          setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
          return;
        }

        setIsUploading(true);

        uploadFile({ files, path: decodedPath })
          .then(response => {
            if (!response) return;
            const { failedFiles, uploadedFiles } = response;
            handleSaveItem(uploadedFiles);
            // アップロードに失敗したファイル
            for (const file of failedFiles) {
              const errorMessage = `【${file.name}】${file.error}`;
              setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
            }
          })
          .catch(() => {
            console.error('ファイルのアップロードに失敗しました');
          });
      },
      [decodedPath, setErrors, uploadFile, setIsUploading, handleSaveItem]
    );

    const onDropAccepted = useCallback(
      (files: File[]) => {
        if (files.length <= 10) {
          handleSubmit(files);
        } else {
          const errorMessage = '10ファイルを超えているため、これ以上はアップロードできません';
          setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
        }
      },
      [setErrors, handleSubmit]
    );

    const onDropRejected = useCallback(
      (fileRejections: FileRejection[]) => {
        const errorMessage = new Set<string>();

        for (const rej of fileRejections) {
          for (const error of rej.errors) {
            if (error.code === 'too-many-files') {
              errorMessage.add('1度にアップロードできるのは10ファイルまでです');
            } else if (error.code === 'file-invalid-type') {
              errorMessage.add(`【${rej.file.name}】アップロードできるのは画像・動画ファイルのみです`);
            } else {
              errorMessage.add(`【${rej.file.name}】${error.message}`);
            }
          }
        }

        setErrors(prev => [...prev, ...[...errorMessage].filter(message => !prev.includes(message))]);
      },
      [setErrors]
    );

    const { getInputProps, getRootProps, isDragActive, isFocused } = useDropzone({
      accept: {
        'image/*': [],
        'video/*': [],
      },
      maxFiles: 10,
      onDropAccepted,
      onDropRejected,
      validator: uploadFileValidator,
    });

    const style = useMemo(
      () => ({
        ...baseStyle,
        ...(isFocused ? focusedStyle : {}),
        ...(isDragActive ? dragStyle : {}),
      }),
      [isFocused, isDragActive]
    );

    return (
      <Box>
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <Icon color={'#fff'} icon={ICONS.folderUpload} size="1.5rem" />
          ) : (
            <Icon color={theme.palette.secondary.light} icon={ICONS.add} size="1.5rem" />
          )}
        </div>
      </Box>
    );
  }
);
