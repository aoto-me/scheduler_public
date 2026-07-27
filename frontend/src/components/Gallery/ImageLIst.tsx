import { API_ENDPOINTS } from '@/configs';
import { useAuthContext } from '@/contexts';
import { useDeleteFile, useFetchGallery, useHttpRequest, useSaveFile, useShareOrDownload } from '@/hooks';
import {
  removeGalleryItem,
  renameGalleryItem,
  selectGalleryImgByPostId,
  sortGalleryItems,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { theme } from '@/theme';
import { copyToClipboard, createFileUrl, normalizeExtension, validateFileName } from '@/utils';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import styled from '@emotion/styled';
import {
  Box,
  ImageListItem,
  ImageList as MuiImageList,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Backdrop, Breadcrumbs, FileThumbnail, Modal, PageLoader, PageTitle } from '../ui';
import { ImageMenu } from './ImageMenu';
import { ImageSlider } from './ImageSlider';
import { ImageUploader } from './ImageUploader';

interface SortableItemProps {
  dragOverlay?: boolean;
  extension: string;
  galleryId: number;
  id: number;
  name: string;
  onClick?: () => void;
  path: string;
  url: string;
}

const ImgButton = styled.button({
  '&:focus-visible': {
    filter: 'brightness(0.75)',
  },
  alignItems: 'center',
  background: 'none',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  flexGrow: 0,
  font: 'inherit',
  height: 'auto',
  justifyContent: 'center',
  minHeight: '100%',
  padding: 0,
  width: '100%',
});

const SortableItem = memo(
  ({ dragOverlay = false, extension, galleryId, id, name, onClick, path, url }: SortableItemProps) => {
    const sortable = useSortable({ id });
    const { attributes, isDragging, listeners, setNodeRef, transform, transition } = sortable;
    const style = {
      transform: transform ? `translate3d(${String(transform.x)}px, ${String(transform.y)}px, 0)` : undefined,
      transition,
    };

    const [isEdit, setIsEdit] = useState(false);
    const [isError, setIsError] = useState(false);
    const [fileName, setFileName] = useState(name);
    const [fileNameClone, setFileNameClone] = useState(name);
    const { renameFile } = useSaveFile();
    const { deleteFile } = useDeleteFile();
    const { deleteRequest, patchRequest } = useHttpRequest();
    const dispatch = useAppDispatch();

    const dotExtension = useMemo(() => normalizeExtension(extension, { withDot: true }), [extension]);

    // 編集モードを終了
    const finishEdit = useCallback(() => {
      setIsEdit(false);

      if (isError) {
        setFileName(fileNameClone);
        setIsError(false);
        return;
      }

      if (fileName === fileNameClone) return;

      renameFile({
        extension: extension,
        newName: fileName,
        oldName: name,
        path,
      })
        .then(response => {
          if (!response) return;
          dispatch(renameGalleryItem({ galleryId, itemId: id, name: response.name, url: response.url }));
          // galleryItemのテーブルも更新
          void patchRequest({
            apiUrl: `${API_ENDPOINTS.gallery}file/${String(id)}/`,
            data: {
              file: `${response.name}${dotExtension}`,
            },
          });
        })
        .catch(() => {
          console.error('ファイル名の変更に失敗しました');
        });
    }, [
      isError,
      fileName,
      fileNameClone,
      name,
      extension,
      path,
      renameFile,
      id,
      patchRequest,
      dotExtension,
      galleryId,
      dispatch,
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
      deleteFile({
        extension: extension,
        name: name,
        path: path,
      })
        .then(response => {
          if (response === 'ok') {
            dispatch(removeGalleryItem({ galleryId, itemId: id }));
            // galleryItemのテーブルからも削除
            void deleteRequest({
              apiUrl: `${API_ENDPOINTS.gallery}item/${String(id)}/`,
              data: {},
            });
          }
        })
        .catch(() => {
          console.error('ファイルの削除に失敗しました');
        });
    }, [extension, name, path, deleteFile, id, deleteRequest, galleryId, dispatch]);

    const handleCopy = useCallback(() => {
      void copyToClipboard(url);
    }, [url]);

    const handleOpen = useCallback(() => {
      const href = createFileUrl(`${name}${dotExtension}`, path);
      window.open(href, '_blank', 'noopener,noreferrer');
    }, [dotExtension, name, path]);

    const shareOrDownload = useShareOrDownload();
    const handleDownload = useCallback(async () => {
      const fileUrl = createFileUrl(`${name}${dotExtension}`, path);
      await shareOrDownload({ filename: `${name}${dotExtension}`, url: fileUrl });
    }, [dotExtension, name, path, shareOrDownload]);

    return (
      <ImageListItem
        ref={setNodeRef}
        sx={{
          ...style,
        }}
        {...attributes}
        {...listeners}
        data-testid="image-item"
        tabIndex={-1}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.secondary.dark,
            borderRadius: '4px',
            boxShadow: dragOverlay
              ? 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px'
              : theme.shadows[2],
            ...(dragOverlay && {
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
            }),
            minHeight: '70px',
            opacity: isDragging ? 0.4 : 1,
            overflow: 'hidden',
            position: 'relative',
            transform: dragOverlay ? 'scale(0.8)' : 'none',
          }}
        >
          <ImgButton onClick={onClick}>
            <FileThumbnail extension={extension} fileName={name} path={path} />
          </ImgButton>
          {!dragOverlay && (
            <Stack
              direction={'row'}
              spacing={0.5}
              sx={{
                alignItems: 'flex-end',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.01) 85%, rgba(0,0,0,0) 100%)',
                borderRadius: '0 0 4px 4px',
                bottom: 0,
                padding: '0 0.25rem 0 0.5rem',
                position: 'absolute',
                right: 0,
                width: '100%',
              }}
            >
              {isEdit ? (
                <TextField
                  autoComplete="off"
                  autoFocus
                  defaultValue={fileName}
                  error={isError}
                  fullWidth
                  helperText={
                    isError ? (fileName.trim() === '' ? '未入力です' : '使用できない文字が含まれています') : ''
                  }
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
                      fontSize: '12px',
                      lineHeight: 1.35,
                    },
                    marginBottom: '0.25rem !important',
                  }}
                />
              ) : (
                <Typography
                  align="left"
                  sx={{
                    color: 'white',
                    flexGrow: 1,
                    flexShrink: 1,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    padding: '1rem 0 0.25rem',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {`${name}${dotExtension}`}
                </Typography>
              )}
              <ImageMenu
                onCopy={handleCopy}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onEdit={onEdit}
                onOpen={handleOpen}
                type="img"
              />
            </Stack>
          )}
        </Box>
      </ImageListItem>
    );
  }
);

interface ImageListProps {
  postId: string;
  title: string;
}

export const ImageList = memo(({ postId, title }: ImageListProps) => {
  const [activeId, setActiveId] = useState<null | UniqueIdentifier>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.down('md'));
  const isLg = useMediaQuery(theme.breakpoints.down('lg'));
  const { fetched, ids, itemMap } = useAppSelector(state => selectGalleryImgByPostId(state, Number(postId)));
  const { userId } = useAuthContext();
  const { fetchGalleryItems } = useFetchGallery();
  const { patchRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  const uploadUrl = useMemo(() => {
    return `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/gallery/${postId}/`;
  }, [userId, postId]);

  const path = useMemo(() => `gallery/${postId}/`, [postId]);

  // データの取得 - item
  useEffect(() => {
    if (fetched) return;
    void fetchGalleryItems(postId, uploadUrl);
  }, [postId, uploadUrl, fetchGalleryItems, fetched]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // 画像の並び替えと保存
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id === over?.id) return;
      const oldIndex = ids.indexOf(active.id as number);
      const newIndex = ids.indexOf(over?.id as number);
      const newSortIds = arrayMove(ids, oldIndex, newIndex);
      dispatch(sortGalleryItems({ galleryId: Number(postId), ids: newSortIds }));
      setActiveId(null);
      void patchRequest({
        apiUrl: `${API_ENDPOINTS.gallery}sortItem/${postId}/`,
        data: {
          ids: newSortIds,
        },
      });
    },
    [ids, postId, patchRequest, dispatch]
  );

  if (!fetched) {
    return (
      <PageLoader
        style={{
          flexGrow: 1,
        }}
      />
    );
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          {
            path: '/gallery',
            title: 'gallery',
          },
          {
            path: `/gallery/${postId}`,
            title: title,
          },
        ]}
      />
      <PageTitle title={title} />

      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <MuiImageList
            cols={isSm ? 2 : isMd ? 3 : isLg ? 4 : 5}
            gap={8}
            rowHeight={'auto'}
            sx={{
              flexGrow: 1,
              height: 'auto',
              placeContent: 'start',
              transform: 'translateZ(0)',
              width: '100%',
            }}
          >
            {ids.map((item, index) => (
              <SortableItem
                extension={itemMap.get(item)?.extension ?? ''}
                galleryId={Number(postId)}
                id={item}
                key={item}
                name={itemMap.get(item)?.name ?? ''}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsModalOpen(true);
                }}
                path={path}
                url={itemMap.get(item)?.url ?? ''}
              />
            ))}
            <li>
              <ImageUploader decodedPath={path} items={ids} setIsUploading={setIsUploading} uploadUrl={uploadUrl} />
            </li>
          </MuiImageList>
        </SortableContext>
        <DragOverlay adjustScale={true}>
          {activeId ? (
            <SortableItem
              dragOverlay
              extension={itemMap.get(activeId as number)?.extension ?? ''}
              galleryId={Number(postId)}
              id={activeId as number}
              name={itemMap.get(activeId as number)?.name ?? ''}
              path={path}
              url={itemMap.get(activeId as number)?.url ?? ''}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <ImageSlider currentIndex={currentIndex} itemMap={itemMap} items={ids} path={path} />
      </Modal>
      <Backdrop isLoading={isUploading} />
    </>
  );
});
