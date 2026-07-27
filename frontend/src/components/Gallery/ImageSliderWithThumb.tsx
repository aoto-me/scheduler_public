import { API_ENDPOINTS, ICONS, imageExtensions, NO_IMG_URL, thumbExtensions, videoExtensions } from '@/configs';
import { useDeleteFile, useHttpRequest, useSaveFile, useShareOrDownload, useVideoThumbnail } from '@/hooks';
import {
  setDiaryThumbnail,
  updateDiaryThumbnail,
  updateGalleryCardThumbnail,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { theme } from '@/theme';
import type { ImageItem } from '@/types';
import { copyToClipboard, createFileUrl, normalizeExtension, validateFileName } from '@/utils';
import { arrayMove } from '@dnd-kit/sortable';
import styled from '@emotion/styled';
import { Box, TextField, Typography } from '@mui/material';
import { type CSSProperties, type JSX, memo, useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SliderModule from 'react-slick';
// Vite 8 (Rolldown) は CJS パッケージの __esModule: true を自動でアンラップしないため、.default を明示的に参照する
const Slider = (SliderModule as unknown as { default?: typeof SliderModule }).default ?? SliderModule;
import { Icon, Image, Video } from '../ui';
import { ImageMenu } from './ImageMenu';
import { ImageUploader } from './ImageUploader';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ThumbnailProps {
  item: ImageItem | undefined;
  path: string;
}

const Thumbnail = memo(({ item, path }: ThumbnailProps) => {
  // 拡張子の.有無と大文字、小文字を統一
  const normalizedExtension = useMemo(() => {
    if (!item) return '';
    return normalizeExtension(item.extension, { lowerCase: true });
  }, [item]);

  // 元々の拡張子に.をつけたもの
  const dotExtension = useMemo(() => {
    if (!item) return '';
    return normalizeExtension(item.extension, { withDot: true });
  }, [item]);

  // 動画のサムネイル生成
  const videoThumbnail = useVideoThumbnail({
    extension: item ? item.extension : '',
    fileName: item ? item.name : '',
    path,
  });

  if (!item) return null;

  if (imageExtensions.includes(normalizedExtension)) {
    if (thumbExtensions.includes(normalizedExtension)) {
      // _thumb付きのURLを作る
      const fileNameThumb = `${item.name}_thumb`;
      return (
        <Image
          alt={`${item.name}${dotExtension}のサムネイル`}
          square
          src={createFileUrl(`${fileNameThumb}${dotExtension}`, path)}
        />
      );
    }
    return (
      <Image
        alt={`${item.name}${dotExtension}のサムネイル`}
        square
        src={createFileUrl(`${item.name}${dotExtension}`, path)}
      />
    );
  }

  if (videoThumbnail) {
    return <Image alt={`${item.name}${dotExtension}のサムネイル`} square src={videoThumbnail} />;
  }

  return <Image alt={`${item.name}${dotExtension}のサムネイル`} square src={NO_IMG_URL} />;
});

interface SlideItemProps {
  index: number;
  item: ImageItem | undefined;
  items: number[];
  onLoad: () => void;
  path: string;
  postId: string | undefined;
  setItemMap: React.Dispatch<React.SetStateAction<Map<number, ImageItem> | null>>;
  setItems: React.Dispatch<React.SetStateAction<number[]>>;
}

const SlideItem = memo(({ item, items, onLoad, path, postId, setItemMap, setItems }: SlideItemProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isError, setIsError] = useState(false);
  const [fileName, setFileName] = useState(item ? item.name : '');
  const [fileNameClone, setFileNameClone] = useState(item ? item.name : '');
  const { renameFile } = useSaveFile();
  const { deleteFile } = useDeleteFile();
  const dispatch = useAppDispatch();
  const { deleteRequest, patchRequest } = useHttpRequest();

  const currentThumbnail = useAppSelector(state => {
    if (!postId || postId === 'diary' || !item?.cardId) return;
    return state.gallery.data[Number(postId)]?.cardContent?.thumbnail[item.cardId];
  });

  // 拡張子の.なし、小文字に統一
  const normalizedExtension = useMemo(() => normalizeExtension(item?.extension, { lowerCase: true }), [item]);

  const dotExtension = useMemo(() => normalizeExtension(item?.extension, { withDot: true }), [item]);

  // 編集モードを終了
  const finishEdit = useCallback(() => {
    setIsEdit(false);

    if (isError) {
      setFileName(fileNameClone);
      setIsError(false);
      return;
    }

    if (!item) return;
    if (fileName === fileNameClone) return;

    renameFile({
      extension: item.extension,
      newName: fileName,
      oldName: item.name,
      path,
    })
      .then(response => {
        if (!response) return;
        // サムネイルに利用されていたら更新
        if (
          postId !== undefined &&
          postId !== 'diary' &&
          item.cardId &&
          currentThumbnail === `${item.name}${dotExtension}`
        ) {
          dispatch(
            updateGalleryCardThumbnail({
              cardId: item.cardId,
              file: `${response.name}${dotExtension}`,
              galleryId: Number(postId),
            })
          );
        }
        if (postId === 'diary') {
          dispatch(
            updateDiaryThumbnail({
              id: item.cardId!,
              newFile: `${response.name}${dotExtension}`,
              oldFile: `${item.name}${dotExtension}`,
            })
          );
        }

        setItemMap(prev => {
          if (!prev) return null;
          const newMap = new Map(prev);
          const target = prev.get(item.id);
          if (!target) return newMap;
          newMap.set(item.id, { ...target, name: response.name, url: response.url });
          return newMap;
        });

        // galleryItem と diaryItem のテーブルも更新
        const apiUrl =
          postId === 'diary'
            ? `${API_ENDPOINTS.diary}file/${String(item.id)}/`
            : `${API_ENDPOINTS.gallery}file/${String(item.id)}/`;
        void patchRequest({
          apiUrl,
          data: {
            file: `${response.name}${dotExtension}`,
          },
        });
      })
      .catch(() => {
        console.error('ファイル名の変更に失敗しました');
      });
  }, [
    dispatch,
    postId,
    isError,
    fileName,
    fileNameClone,
    path,
    renameFile,
    setItemMap,
    patchRequest,
    dotExtension,
    item,
    currentThumbnail,
  ]);

  // Enterキーで編集完了
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        finishEdit();
      }
    },
    [finishEdit]
  );

  // 編集モードを開始
  const onEdit = useCallback(() => {
    setTimeout(() => {
      setFileNameClone(fileName);
      setIsEdit(true);
    }, 100);
  }, [fileName]);

  const handleDelete = useCallback(() => {
    const result = confirm(`ファイルを削除しますか？`);
    if (!result) return;
    if (!item) return;
    deleteFile({
      extension: item.extension,
      name: item.name,
      path: path,
    })
      .then(response => {
        if (response === 'ok') {
          // gallery card型: サムネイルに利用されていたら空にする
          if (
            postId !== undefined &&
            postId !== 'diary' &&
            item.cardId &&
            currentThumbnail === `${item.name}${dotExtension}`
          ) {
            dispatch(
              updateGalleryCardThumbnail({
                cardId: item.cardId,
                file: '',
                galleryId: Number(postId),
              })
            );
          }
          if (postId === 'diary') {
            dispatch(
              updateDiaryThumbnail({
                id: item.cardId!,
                newFile: '',
                oldFile: `${item.name}${dotExtension}`,
              })
            );
          }

          setItems(prev => prev.filter(id => id !== item.id));
          setItemMap(prev => {
            if (!prev) return null;
            const newMap = new Map(prev);
            newMap.delete(item.id);
            return newMap;
          });

          // galleryItem と diaryItem のテーブルも削除
          const apiUrl =
            postId === 'diary'
              ? `${API_ENDPOINTS.diary}item/${String(item.id)}/`
              : `${API_ENDPOINTS.gallery}item/${String(item.id)}/`;
          void deleteRequest({
            apiUrl,
            data: {},
          });
        }
      })
      .catch(() => {
        console.error('ファイルの削除に失敗しました');
      });
  }, [dispatch, postId, item, path, deleteFile, deleteRequest, setItemMap, setItems, dotExtension, currentThumbnail]);

  // サムネイルに設定（1番目の画像にする）
  const handleSetThumbnail = useCallback(() => {
    if (items.length < 2 || !item) return;
    const targetIndex = items.indexOf(item.id);
    const newSortItems = arrayMove(items, targetIndex, 0);
    setItems(newSortItems);
    if (postId !== undefined && postId !== 'diary' && item.cardId) {
      dispatch(
        updateGalleryCardThumbnail({
          cardId: item.cardId,
          file: `${item.name}${dotExtension}`,
          galleryId: Number(postId),
        })
      );
    }
    if (postId === 'diary') {
      dispatch(
        setDiaryThumbnail({
          file: `${item.name}${dotExtension}`,
          id: item.cardId!,
        })
      );
    }

    // galleryItem と diaryItem のテーブルも更新
    const apiUrl =
      postId === 'diary'
        ? `${API_ENDPOINTS.diary}sortItem/${String(item.cardId)}/`
        : `${API_ENDPOINTS.gallery}sortItem/${String(postId)}/`;
    patchRequest({
      apiUrl,
      data: {
        ids: newSortItems,
      },
    }).catch(() => {
      console.error('画像の並び替えに失敗しました');
    });
  }, [dispatch, postId, items, item, dotExtension, patchRequest, setItems]);

  const handleCopy = useCallback(() => {
    void copyToClipboard(item?.url ?? '');
  }, [item?.url]);

  const handleOpen = useCallback(() => {
    const href = createFileUrl(`${item?.name ?? ''}${dotExtension}`, path);
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [dotExtension, item?.name, path]);

  const shareOrDownload = useShareOrDownload();
  const handleDownload = useCallback(async () => {
    const fileUrl = createFileUrl(`${item?.name ?? ''}${dotExtension}`, path);
    await shareOrDownload({ filename: `${item?.name ?? ''}${dotExtension}`, url: fileUrl });
  }, [dotExtension, item?.name, path, shareOrDownload]);

  if (!item) return null;

  return (
    <div>
      {videoExtensions.includes(normalizedExtension) ? (
        <Video onLoad={onLoad} url={createFileUrl(`${item.name}${dotExtension}`, path)} />
      ) : (
        <>
          {thumbExtensions.includes(normalizedExtension) ? (
            <Image
              alt={item.name}
              height="100%"
              onLoad={onLoad}
              src={createFileUrl(`${item.name}_thumb${dotExtension}`, path)}
              style={{ maxHeight: '500px' }}
            />
          ) : (
            <Image
              alt={item.name}
              height="100%"
              onLoad={onLoad}
              src={createFileUrl(`${item.name}${dotExtension}`, path)}
              style={{ maxHeight: '500px' }}
            />
          )}
        </>
      )}
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: '0.25rem',
          justifyContent: 'space-between',
          width: 'calc(100% - 2px)',
        }}
      >
        {isEdit ? (
          <TextField
            autoComplete="off"
            autoFocus
            defaultValue={fileName}
            error={isError}
            fullWidth
            helperText={isError ? (fileName.trim() === '' ? '未入力です' : '使用できない文字が含まれています') : ''}
            hiddenLabel
            onBlur={finishEdit}
            onChange={e => {
              setFileName(e.target.value);
              setIsError(!validateFileName(e.target.value));
            }}
            onKeyDown={handleKeyDown}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                lineHeight: 1.35,
                padding: '1px 2px',
              },
              '& .MuiInputBase-root': {
                backgroundColor: '#fff',
                padding: '2px 4px',
              },
              '.MuiFormHelperText-root.Mui-error': {
                background: '#ffffffa1',
                fontSize: '12px',
                left: 0,
                lineHeight: 1.35,
                marginLeft: 0,
                marginRight: 0,
                position: 'absolute',
                top: -15,
              },
              flexGrow: 1,
              flexShrink: 1,
              padding: '0.5rem 0',
              width: '100%',
            }}
          />
        ) : (
          <Typography
            align={'center'}
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              overflow: 'hidden',
              padding: '0.5rem 0',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
            variant="subtitle2"
          >
            {item.name}
            {dotExtension}
          </Typography>
        )}
        <ImageMenu
          onCopy={handleCopy}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onEdit={onEdit}
          onOpen={handleOpen}
          onSort={handleSetThumbnail}
          type="card"
        />
      </Box>
    </div>
  );
});

const ThumbnailsList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  margin: 0px;

  li {
    width: 25%;
    height: 100%;
    aspect-ratio: 1 / 1;
    margin: 0;
    border: solid 2px transparent;
    display: block;
    overflow: hidden;
    z-index: 1;

    @media screen and (min-width: 400px) {
      width: 20%;
    }

    @media screen and (min-width: 600px) {
      width: 12.5%;
    }

    @media screen and (min-width: 1000px) {
      width: 10%;
    }

    @media screen and (min-width: 1500px) {
      width: 6.25%;
    }
  }

  .slick-active {
    border-color: #333;
  }
`;

interface ImageSliderWithThumbProps {
  date?: string;
  itemMap: Map<number, ImageItem> | null;
  items: number[];
  path: string;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  setItemMap: React.Dispatch<React.SetStateAction<Map<number, ImageItem> | null>>;
  setItems: React.Dispatch<React.SetStateAction<number[]>>;
  style?: CSSProperties;
  uploadUrl: string;
}

export const ImageSliderWithThumb = memo(
  ({
    date,
    itemMap,
    items,
    path,
    setIsUploading,
    setItemMap,
    setItems,
    style,
    uploadUrl,
  }: ImageSliderWithThumbProps) => {
    const { postId, subPage } = useParams();
    const sliderRef = useRef<InstanceType<typeof SliderModule> | null>(null);

    const settings = useMemo(
      () => ({
        adaptiveHeight: true,
        appendDots: (dots: JSX.Element) => (
          <div
            style={{
              marginTop: '1rem',
              position: 'static',
            }}
          >
            <ThumbnailsList>
              {dots}
              <li
                style={{
                  border: '2px solid transparent',
                }}
              >
                <ImageUploader
                  cardId={Number(subPage)}
                  date={date}
                  decodedPath={path}
                  items={items}
                  setIsUploading={setIsUploading}
                  setItemMap={setItemMap}
                  setItems={setItems}
                  uploadUrl={uploadUrl}
                />
              </li>
            </ThumbnailsList>
          </div>
        ),
        arrows: false,
        customPaging: (i: number) => (
          <div
            style={{
              height: '100%',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {items.length === 0 && (
              <Box
                sx={{
                  backgroundColor: theme.palette.secondary.light,
                  height: '100%',
                  widow: '100%',
                }}
              ></Box>
            )}
            {items[i] && itemMap && <Thumbnail item={itemMap.get(items[i])} path={path} />}
          </div>
        ),
        dots: true,
        infinite: true,
        initialSlide: 0,
        slidesToScroll: 1,
        slidesToShow: 1,
        speed: 500,
      }),
      [date, items, itemMap, path, subPage, uploadUrl, setIsUploading, setItemMap, setItems]
    );

    const handleLoad = useCallback((index: number) => {
      if (index === 0) {
        sliderRef.current?.slickGoTo(0);
      }
    }, []);

    return (
      <div className="slider-container" data-testid="image-slider" style={style}>
        <Slider {...settings} ref={sliderRef}>
          {items.length === 0 && (
            <Box
              sx={{
                alignItems: 'center',
                aspectRatio: '16/9',
                backgroundColor: theme.palette.grey[200],
                display: 'flex !important',
                flexDirection: 'column',
                justifyContent: 'center',
                margin: '0 auto',
                maxWidth: '500px',
                minHeight: '150px',
                width: '100%',
              }}
            >
              <Icon
                icon={ICONS.emptyImage}
                size="2rem"
                style={{
                  marginBottom: '1rem',
                }}
              />
              <Typography
                sx={{
                  color: theme.palette.secondary.main,
                }}
                variant="body2"
              >
                画像/動画の登録がありません
              </Typography>
            </Box>
          )}
          {items.map((item, index) => (
            <SlideItem
              index={index}
              item={itemMap?.get(item)}
              items={items}
              key={itemMap?.get(item)?.id}
              onLoad={() => {
                handleLoad(index);
              }}
              path={path}
              postId={postId}
              setItemMap={setItemMap}
              setItems={setItems}
            />
          ))}
        </Slider>
        {/*
         * 以前は、画像が0～1枚でもページング領域が表示されていたが、
         * バージョンアップデート後に2枚以下は非表示になったため、スライダー直下に挿入
         */}
        {items.length < 2 && (
          <div
            style={{
              marginTop: '1rem',
              position: 'static',
            }}
          >
            <ThumbnailsList>
              <li
                style={{
                  border: '2px solid transparent',
                }}
              >
                <ImageUploader
                  cardId={Number(subPage)}
                  date={date}
                  decodedPath={path}
                  items={items}
                  setIsUploading={setIsUploading}
                  setItemMap={setItemMap}
                  setItems={setItems}
                  uploadUrl={uploadUrl}
                />
              </li>
            </ThumbnailsList>
          </div>
        )}
      </div>
    );
  }
);
