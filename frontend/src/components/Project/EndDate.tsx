import { API_ENDPOINTS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import { updateProjectEnd, useAppDispatch } from '@/redux';
import { datePickerWithLabel } from '@/styles';
import { Stack, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { PickerValue } from '@mui/x-date-pickers/internals';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { differenceInCalendarDays, format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { memo, useCallback, useMemo } from 'react';

interface EndDateProps {
  end: null | string;
  postId: string;
}

export const EndDate = memo(({ end, postId }: EndDateProps) => {
  const { patchRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  // 締切の更新
  const updateEnd = useCallback(
    (e: PickerValue) => {
      const data = e instanceof Date ? format(e, 'yyyy-MM-dd') : null;
      patchRequest({
        apiUrl: `${API_ENDPOINTS.project}end/${postId}/`,
        data: {
          end: data,
        },
      })
        .then(response => {
          if (response === 'ok') dispatch(updateProjectEnd({ end: data, id: Number(postId) }));
        })
        .catch(() => {
          console.error('締切の更新に失敗しました');
        });
    },
    [postId, patchRequest, dispatch]
  );

  // 締切までの残り日数を計算
  const remainingDays = useMemo(() => {
    if (!end) return null;
    const today = new Date();
    const targetDate = new Date(end);
    // 日付（年月日）ベースの差を計算
    const remaining = differenceInCalendarDays(targetDate, today);
    return Math.max(remaining, 0);
  }, [end]);

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
          defaultValue={end ? new Date(end) : undefined}
          format="yyyy年MM月dd日"
          label="終了日"
          name="projectEnd"
          onChange={e => {
            updateEnd(e);
          }}
          sx={{
            ...datePickerWithLabel,
            width: 'fit-content',
          }}
        />
      </LocalizationProvider>
      {end && (
        <Typography
          color="textSecondary"
          component="p"
          sx={{
            flexShrink: 0,
          }}
          variant="body1"
        >
          （{remainingDays}日後）
        </Typography>
      )}
    </Stack>
  );
});
