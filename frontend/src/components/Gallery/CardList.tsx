import { API_ENDPOINTS, ICONS } from '@/configs';
import { useAuthContext } from '@/contexts';
import { useFetchGallery, useHttpRequest } from '@/hooks';
import {
  addDirectory,
  addGalleryCard,
  selectDirectories,
  selectGalleryCardByPostId,
  sortGalleryCards,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { theme } from '@/theme';
import type { GalleryCard } from '@/types';
import { normalizeDateStr, splitFileName } from '@/utils';
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
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import { Box, Button, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { format } from 'date-fns';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Backdrop, Breadcrumbs, Icon, PageLoader, PageTitle } from '../ui';
import { CardThumbnail } from './CardThumbnail';

interface SortableItemProps {
  card: GalleryCard | undefined;
  dragOverlay?: boolean;
  id: number;
  postId: string;
  thumbnail: string;
}

const SortableItem = memo(({ card, dragOverlay = false, id, postId, thumbnail }: SortableItemProps) => {
  const navigate = useNavigate();
  const sortable = useSortable({ id });
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = sortable;
  const style = {
    transform: transform ? `translate3d(${String(transform.x)}px, ${String(transform.y)}px, 0)` : undefined,
    transition,
  };

  const { extension, name } = useMemo(() => splitFileName(thumbnail), [thumbnail]);

  if (!card) return null;

  return (
    <Grid
      ref={setNodeRef}
      size={{ md: 4, sm: 6, xl: 3, xs: 12 }}
      sx={{
        ...style,
      }}
      {...attributes}
      {...listeners}
      data-testid="card-item"
      tabIndex={-1}
    >
      <Card
        sx={{
          boxShadow: dragOverlay
            ? 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px'
            : theme.shadows[2],
          opacity: isDragging ? 0.4 : 1,
          transform: dragOverlay ? 'scale(0.8)' : 'none',
        }}
      >
        <CardActionArea
          onClick={() => {
            void navigate(`/gallery/${postId}/${String(id)}`);
          }}
        >
          <CardThumbnail
            extension={extension}
            fileName={name}
            path={`gallery/${postId}/${String(id)}/`}
            title={card.title}
          />
          <CardContent
            sx={{
              padding: '0.75rem',
            }}
          >
            <Typography
              gutterBottom
              sx={{
                fontWeight: 700,
              }}
              variant="h6"
            >
              {card.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  alignItems: 'center',
                  color: 'text.secondary',
                  display: 'flex',
                  mr: 2,
                }}
                variant="body2"
              >
                <Icon
                  icon={ICONS.calendar}
                  size="1rem"
                  style={{
                    marginRight: '0.5rem',
                  }}
                />
                {card.date ? normalizeDateStr(card.date) : '-- -- --'}
              </Typography>
              <Typography
                sx={{
                  alignItems: 'center',
                  color: 'text.secondary',
                  display: 'flex',
                }}
                variant={'body2'}
              >
                <Icon
                  icon={ICONS.update}
                  size="1rem"
                  style={{
                    marginRight: '0.5rem',
                  }}
                />
                {normalizeDateStr(card.updated)}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
});

interface CardListProps {
  postId: string;
  subPage: string | undefined;
  title: string;
}

export const CardList = memo(({ postId, subPage, title }: CardListProps) => {
  const { cardMap, fetched, ids, thumbnailMap } = useAppSelector(state =>
    selectGalleryCardByPostId(state, Number(postId))
  );
  const [activeId, setActiveId] = useState<null | UniqueIdentifier>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { userId } = useAuthContext();
  const dispatch = useAppDispatch();
  const { fetchGalleryCards } = useFetchGallery();
  const { patchRequest, postRequest } = useHttpRequest();
  const directories = useAppSelector(selectDirectories);

  const uploadUrl = useMemo(() => {
    if (subPage) {
      return `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/gallery/${postId}/${subPage}/`;
    }
    return `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/gallery/${postId}/`;
  }, [userId, postId, subPage]);

  const path = useMemo(() => {
    if (subPage) {
      return `gallery/${postId}/${subPage}/`;
    }
    return `gallery/${postId}/`;
  }, [postId, subPage]);

  // subPageに渡すcard
  const card = useMemo(() => {
    if (!subPage) return null;
    return cardMap.get(Number(subPage)) ?? null;
  }, [subPage, cardMap]);

  // subPageに渡すProps
  const outletProps = useMemo(
    () => ({
      card,
      path,
      postId,
      setIsUploading,
      uploadUrl,
    }),
    [postId, card, uploadUrl, path]
  );

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

  // カードの並び替え
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id === over?.id) return;
      const oldIndex = ids.indexOf(active.id as number);
      const newIndex = ids.indexOf(over?.id as number);
      const newSortCards = arrayMove(ids, oldIndex, newIndex);
      dispatch(sortGalleryCards({ galleryId: Number(postId), ids: newSortCards }));
      setActiveId(null);
      patchRequest({
        apiUrl: `${API_ENDPOINTS.gallery}sortCard/${postId}/`,
        data: {
          ids: newSortCards,
        },
      }).catch(() => {
        console.error('カードの並び替えに失敗しました');
      });
    },
    [ids, postId, patchRequest, dispatch]
  );

  // データの取得 - galleryCard(contentは含まない) と thumbnail
  useEffect(() => {
    if (fetched) return;
    fetchGalleryCards(postId).catch(() => {
      console.error('ギャラリーカードの取得に失敗しました');
    });
  }, [postId, fetchGalleryCards, fetched]);

  // 新規カードの追加
  const handleCreateCard = useCallback(() => {
    const data = {
      date: null,
      sort: ids.length + 1,
      title: '新規カード',
    };
    postRequest<number>({
      apiUrl: `${API_ENDPOINTS.gallery}card/${postId}/`,
      data,
    })
      .then(response => {
        if (!response) return;
        const newCard = {
          ...data,
          galleryId: Number(postId),
          id: response,
          updated: format(new Date(), 'yyyy-MM-dd'),
        };
        dispatch(addGalleryCard({ card: newCard }));
        // directories に gallery/postId/cardId のディレクトリを追加
        if (directories) dispatch(addDirectory({ name: String(response), path: `gallery/${postId}` }));
      })
      .catch(() => {
        console.error('カードの新規保存に失敗しました');
      });
  }, [postId, ids, directories, dispatch, postRequest]);

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
          ...(subPage
            ? [
                {
                  path: `/gallery/${postId}/${subPage}`,
                  title: cardMap.get(Number(subPage))?.title ?? '',
                },
              ]
            : []),
        ]}
      />
      <PageTitle
        cardId={subPage ? Number(subPage) : undefined}
        key={`gallery-${postId}-${String(subPage)}`}
        title={subPage ? (cardMap.get(Number(subPage))?.title ?? '') : title}
      />
      {subPage ? (
        <Outlet context={outletProps} />
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <Grid container spacing={2}>
              {ids.map(id => (
                <SortableItem
                  card={cardMap.get(id)}
                  id={id}
                  key={id}
                  postId={postId}
                  thumbnail={thumbnailMap.get(id) ?? ''}
                />
              ))}
              <Grid size={{ md: 4, sm: 6, xl: 3, xs: 12 }}>
                <Button
                  fullWidth
                  onClick={handleCreateCard}
                  startIcon={<AddCircleSharpIcon color="primary" />}
                  sx={{ letterSpacing: 0.5, textTransform: 'none' }}
                  variant="outlined"
                >
                  カードを追加
                </Button>
              </Grid>
            </Grid>
          </SortableContext>
          <DragOverlay adjustScale={true}>
            {activeId ? (
              <SortableItem
                card={cardMap.get(activeId as number)}
                dragOverlay
                id={activeId as number}
                postId={postId}
                thumbnail={thumbnailMap.get(activeId as number) ?? ''}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <Backdrop isLoading={isUploading} />
    </>
  );
});
