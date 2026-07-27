import { API_ENDPOINTS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import { updateGalleryCardDate, useAppDispatch } from '@/redux';
import { datePickerWithLabel } from '@/styles';
import { theme } from '@/theme';
import { Stack } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { PickerValue } from '@mui/x-date-pickers/internals';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { memo, useCallback } from 'react';

interface CardDateProps {
  cardId: number;
  date: null | string;
  postId: string;
}

export const CardDate = memo(({ cardId, date, postId }: CardDateProps) => {
  const { patchRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  const handleUpdateDate = useCallback(
    (e: PickerValue) => {
      const newDate = e instanceof Date ? format(e, 'yyyy-MM-dd') : null;
      const updated = format(new Date(), 'yyyy-MM-dd');
      patchRequest({
        apiUrl: `${API_ENDPOINTS.gallery}cardDate/${String(cardId)}/`,
        data: { date: newDate },
      })
        .then(() => {
          dispatch(updateGalleryCardDate({ cardId, date: newDate, galleryId: Number(postId), updated }));
        })
        .catch(() => {
          console.error('日付の更新に失敗しました');
        });
    },
    [cardId, patchRequest, postId, dispatch]
  );

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: 'center',
      }}
    >
      <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
        <DatePicker
          defaultValue={date ? new Date(date) : undefined}
          disabled={postId === 'diary'}
          format="yyyy年MM月dd日"
          label="日付"
          name="cardDate"
          onChange={e => {
            handleUpdateDate(e);
          }}
          sx={{
            ...datePickerWithLabel,
            '& .Mui-disabled *': {
              color: `${theme.palette.text.primary} !important`,
            },
            '& .MuiButtonBase-root.Mui-disabled': {
              display: 'none',
            },
            '& .MuiPickersInputBase-root': {
              maxWidth: 'fit-content',
              width: '50vw',
            },
            flexShrink: 1,
            width: 'fit-content',
          }}
        />
      </LocalizationProvider>
    </Stack>
  );
});
