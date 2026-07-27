import { API_ENDPOINTS } from '@/configs';
import { setMonthlyMemo, useAppDispatch } from '@/redux';
import type { MonthlyMemo } from '@/types';
import { formatDateToKey } from '@/utils';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchMonthlyMemo = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * 該当月のMonthlyMemoを取得
   */
  const fetchMonthlyMemo = async (date: Date): Promise<MonthlyMemo | null> => {
    const response = await getRequest<MonthlyMemo>({
      apiUrl: API_ENDPOINTS.monthlyMemo,
      queryParams: {
        end: format(endOfMonth(date), 'yyyy-MM-dd'),
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
      },
    });

    if (!response) return null;

    // responseをnullだけで返すとエラー処理になるため、
    // データがない場合は id = 0 を返すようにしてフラグにしている
    const memo = response.id === 0 ? null : response;
    dispatch(setMonthlyMemo({ data: memo, key: formatDateToKey(date) }));

    return memo;
  };

  return { fetchMonthlyMemo };
};
