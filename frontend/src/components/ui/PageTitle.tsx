import { API_ENDPOINTS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import {
  updateDiary,
  updateGalleryCardTitle,
  updateGalleryTitle,
  updateMemoTitle,
  updateProjectTitle,
  useAppDispatch,
} from '@/redux';
import { fontSerif } from '@/styles';
import type { DiaryCard } from '@/types';
import { base64Encode } from '@/utils';
import { TextField } from '@mui/material';
import type { Action } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

interface PageTitleProps {
  cardId?: number;
  date?: string; // diaryで使用
  marginBottom?: string;
  title: string;
}

export const PageTitle = memo(({ cardId, date, marginBottom = '2rem', title }: PageTitleProps) => {
  const pathname = useLocation().pathname.split('/')[1];
  const { postId } = useParams();
  const [isError, setIsError] = useState('');
  const { patchRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  const saveTitle = useCallback(
    (title: string) => {
      const updated = format(new Date(), 'yyyy-MM-dd');
      const encodeTitle = base64Encode(title);
      const pathnameKey = pathname as keyof typeof API_ENDPOINTS;

      const getApiUrl = (): string => {
        switch (pathnameKey) {
          case 'gallery': {
            if (postId === 'diary') {
              return `${API_ENDPOINTS.diary}title/${String(cardId)}/`;
            }
            return cardId
              ? `${API_ENDPOINTS[pathnameKey]}cardTitle/${String(cardId)}/`
              : `${API_ENDPOINTS[pathnameKey]}title/${String(postId)}/`;
          }
          case 'memo':
          case 'project': {
            return `${API_ENDPOINTS[pathnameKey]}title/${String(postId)}/`;
          }
          default: {
            return '';
          }
        }
      };

      patchRequest<string>({
        apiUrl: getApiUrl(),
        data: {
          title: encodeTitle,
        },
      })
        .then(response => {
          if (!response) return;
          // diary
          if (postId === 'diary' && date && cardId) {
            const newDiary: DiaryCard = {
              date: date,
              id: cardId,
              title,
              updated,
            };
            dispatch(updateDiary({ ...newDiary, target: 'title' }));
            return;
          }
          // galleryCard
          if (cardId && postId !== 'diary') {
            dispatch(updateGalleryCardTitle({ cardId, galleryId: Number(postId), title, updated }));
            return;
          }
          // 各ページ
          const actionMap: Partial<Record<string, ({ id, title }: { id: number; title: string }) => Action>> = {
            gallery: updateGalleryTitle,
            memo: updateMemoTitle,
            project: updateProjectTitle,
          };
          const action = actionMap[pathname];
          if (action) dispatch(action({ id: Number(postId), title }));
        })
        .catch(() => {
          console.error('ページタイトルの更新に失敗しました');
        });
    },
    [postId, patchRequest, pathname, dispatch, cardId, date]
  );

  const debouncedSaveTitle = useMemo(() => debounce(saveTitle, 1000), [saveTitle]);

  const handleTitleUpdate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      const length = value.trim().length;

      if (length === 0) {
        setIsError('タイトルを入力してください');
      } else if (length > 100) {
        setIsError('100文字以内で入力してください');
      } else {
        setIsError('');
        debouncedSaveTitle(value);
      }
    },
    [debouncedSaveTitle]
  );

  return (
    <TextField
      autoComplete="off"
      defaultValue={title}
      error={isError.length > 0}
      fullWidth
      helperText={isError}
      hiddenLabel
      id="title"
      multiline
      name="title"
      onChange={e => {
        handleTitleUpdate(e);
      }}
      spellCheck="false"
      sx={{
        '& .MuiInputBase-input': {
          ...fontSerif,
          fontSize: 'clamp(1.85rem, 7vw, 2.5rem)',
          fontWeight: 700,
          lineHeight: 1.35,
        },
        '& .MuiInputBase-root': {
          backgroundColor: 'transparent',
          padding: 0,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none !important',
        },
        backgroundColor: 'transparent',
        marginBottom,
      }}
      variant="outlined"
    />
  );
});
