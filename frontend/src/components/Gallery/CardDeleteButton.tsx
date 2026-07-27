import { API_ENDPOINTS, ICONS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import {
  removeDiary,
  removeDirectory,
  removeGalleryCard,
  selectDirectories,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { splitDate } from '@/utils';
import { IconButton } from '@mui/material';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui';

interface CardDeleteButtonProps {
  cardId: number;
  date: string;
  postId: string;
}

export const CardDeleteButton = memo(({ cardId, date, postId }: CardDeleteButtonProps) => {
  const navigate = useNavigate();
  const { deleteRequest } = useHttpRequest();
  const dispatch = useAppDispatch();
  const directories = useAppSelector(selectDirectories);

  const handleDelete = useCallback(() => {
    const result = confirm('カードとそれに関連するデータを削除しますか？');
    if (!result) return;

    const apiUrl =
      postId === 'diary'
        ? `${API_ENDPOINTS.diary}card/${String(cardId)}/`
        : `${API_ENDPOINTS.gallery}card/${String(cardId)}/`;

    deleteRequest({
      apiUrl,
      data: {
        date,
        postId,
      },
    })
      .then(response => {
        if (!response) return;
        // galleryCardの処理
        if (postId !== 'diary') {
          dispatch(removeGalleryCard({ cardId, galleryId: Number(postId) }));
        }

        // diaryCardの処理
        if (postId === 'diary') {
          dispatch(removeDiary({ date, id: cardId }));
        }

        // directoriesから削除
        if (directories) {
          if (postId === 'diary' && date) {
            const { day, month, year } = splitDate(date);
            dispatch(removeDirectory(`diary/${year}/${month}/${day}`));
          } else {
            dispatch(removeDirectory(`gallery/${postId}/${String(cardId)}`));
          }
        }

        // ページ遷移
        const path = postId === 'diary' ? `/gallery/diary` : `/gallery/${postId}`;
        void navigate(path);
      })
      .catch(() => {
        console.error('カードの削除に失敗しました');
      });
  }, [postId, cardId, directories, deleteRequest, dispatch, navigate, date]);

  return (
    <IconButton
      aria-label="カードの削除"
      onClick={handleDelete}
      sx={{
        flexGrow: 0,
        flexShrink: 0,
      }}
    >
      <Icon icon={ICONS.deleteFill} size="1.15rem" />
    </IconButton>
  );
});
