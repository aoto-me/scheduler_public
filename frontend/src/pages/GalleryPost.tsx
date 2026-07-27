import { CardList, DiaryList, ImageList, SelectType } from '@/components/Gallery';
import { NotFound, PageLoader } from '@/components/ui';
import { useFetchGallery } from '@/hooks';
import { selectGalleryTitleByPostId, selectGalleryTypeByPostId, useAppSelector } from '@/redux';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const GalleryPost = () => {
  const { postId, subPage } = useParams();
  const [notFound, setNotFound] = useState(false);
  const [isDiary, setIsDiary] = useState(false);
  const { fetched, type } = useAppSelector(state => selectGalleryTypeByPostId(state, Number(postId)));
  const title = useAppSelector(state => selectGalleryTitleByPostId(state, Number(postId)));
  const { fetchGalleryType } = useFetchGallery();

  // データの取得 - type
  useEffect(() => {
    if (fetched && type) return;
    // 初期化
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDiary(false);
    setNotFound(false);

    // "diary" の場合は取得不要
    if (postId === 'diary') {
      setIsDiary(true);
      return;
    }

    if (!postId) return;

    fetchGalleryType(postId)
      .then(response => {
        if (!response) {
          setNotFound(true);
        }
      })
      .catch(() => {
        console.error('タイプの取得に失敗しました');
      });
  }, [postId, fetchGalleryType]);

  if (notFound) {
    return <NotFound />;
  }

  if (postId !== 'diary' && (!fetched || !postId || !type)) {
    return <PageLoader />;
  }

  const renderContent = () => {
    switch (type) {
      case 'card': {
        return (
          postId &&
          title && <CardList key={`galleryCardList-${postId}`} postId={postId} subPage={subPage} title={title} />
        );
      }
      case 'img': {
        return postId && title && <ImageList key={`galleryImageList-${postId}`} postId={postId} title={title} />;
      }
      case 'unselect': {
        return postId && <SelectType key={`gallerySelectType-${postId}`} postId={postId} />;
      }
      default: {
        return isDiary ? <DiaryList /> : <NotFound />;
      }
    }
  };

  return <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>{renderContent()}</Box>;
};

export default GalleryPost;
