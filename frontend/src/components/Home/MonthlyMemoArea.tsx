import { API_ENDPOINTS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import { addMonthlyMemo, updateMonthlyMemo, useAppDispatch } from '@/redux';
import { theme } from '@/theme';
import type { MonthlyMemo } from '@/types';
import { base64Encode } from '@/utils';
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import { Box, Button, TextField } from '@mui/material';
import { format, startOfMonth } from 'date-fns';
import { debounce } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';

interface MonthlyMemoAreaProps {
  currentMonth: Date;
  monthlyMemo: MonthlyMemo | null;
}

export const MonthlyMemoArea = memo(({ currentMonth, monthlyMemo }: MonthlyMemoAreaProps) => {
  const [isError, setIsError] = useState(false);
  const { patchRequest, postRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  // メモの保存
  const debouncedSaveRequest = useMemo(() => {
    return debounce((data: string, memo: MonthlyMemo) => {
      patchRequest({
        apiUrl: `${API_ENDPOINTS.monthlyMemo}${String(memo.id)}/`,
        data: {
          memo: base64Encode(data),
        },
      })
        .then(() => {
          const key = memo.date.slice(0, 7);
          dispatch(updateMonthlyMemo({ data: { ...memo, memo: data }, key }));
        })
        .catch(() => {
          console.error('メモの更新に失敗しました');
        });
    }, 1000);
  }, [patchRequest, dispatch]);

  // メモの更新（エラーチェック）
  const updateMemo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = e.target;
      if (value.length < 5000) {
        if (monthlyMemo) debouncedSaveRequest(value, monthlyMemo); // 呼び出し時点の最新値を渡す
        setIsError(false);
      } else {
        setIsError(true);
      }
    },
    [monthlyMemo, debouncedSaveRequest]
  );

  // 新規メモを追加
  const createMemo = useCallback(() => {
    const date = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    postRequest<number>({
      apiUrl: API_ENDPOINTS.monthlyMemo,
      data: {
        date,
      },
    })
      .then(response => {
        if (!response) return;
        const key = date.slice(0, 7);
        const memo = {
          date,
          id: response,
          memo: '',
        };
        dispatch(addMonthlyMemo({ data: memo, key }));
      })
      .catch(() => {
        console.error('メモの作成に失敗しました');
      });
  }, [currentMonth, postRequest, dispatch]);

  return (
    <Box
      sx={{
        padding: { sm: '0px 24px 32px 24px', xs: '0px 5vw 32px 5vw' }, // カレンダーの幅に合わせている
        width: '100%',
      }}
    >
      {monthlyMemo ? (
        <TextField
          autoComplete="off"
          defaultValue={monthlyMemo.memo}
          error={isError}
          fullWidth
          helperText={isError ? '5000文字以内で入力してください' : ''}
          hiddenLabel
          id="monthlyMemo"
          multiline
          name="monthlyMemo"
          onChange={e => {
            updateMemo(e);
          }}
          placeholder="メモを入力（5000文字以内）"
          spellCheck="false"
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: '#fff',
              borderRadius: '4px !important',
            },
            '& fieldset': {
              borderColor: `${theme.palette.divider} !important`,
              borderRadius: '4px !important',
              borderWidth: '1px !important',
            },
            '& textarea': {
              color: '#333',
              lineHeight: 1.5,
            },
            borderRadius: '4px !important',
          }}
          variant="outlined"
        />
      ) : (
        <Button
          fullWidth
          onClick={createMemo}
          startIcon={<AddCircleSharpIcon color="primary" />}
          sx={{
            alignItems: ' center',
            display: 'flex',
            height: 'fit-content',
            letterSpacing: 0.5,
            textTransform: 'none',
          }}
          variant="outlined"
        >
          メモを追加
        </Button>
      )}
    </Box>
  );
});
