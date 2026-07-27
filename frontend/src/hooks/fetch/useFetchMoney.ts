import { API_ENDPOINTS } from '@/configs';
import { setMoneyData, useAppDispatch } from '@/redux';
import type { Money } from '@/types';
import { formatDateToKey } from '@/utils';
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from 'date-fns';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchMoney = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * 1か月分 or 1年分のMoneyデータを取得
   */
  const fetchMoney = async (date: Date, type: 'month' | 'year'): Promise<Money[] | null> => {
    const response = await getRequest<Money[]>({
      apiUrl: API_ENDPOINTS.money,
      queryParams: {
        end: type === 'year' ? format(endOfYear(date), 'yyyy-MM-dd') : format(endOfMonth(date), 'yyyy-MM-dd'),
        start: type === 'year' ? format(startOfYear(date), 'yyyy-MM-dd') : format(startOfMonth(date), 'yyyy-MM-dd'),
      },
    });

    if (!response) return null;

    if (type === 'year') {
      const year = date.getFullYear();
      // 1年分のキーを空配列で初期化
      const groupedByMonth: Record<string, Money[]> = {};
      for (let month = 1; month <= 12; month++) {
        const key = `${String(year)}-${month.toString().padStart(2, '0')}`;
        groupedByMonth[key] = [];
      }
      // 取得したデータを groupedByMonth に分類
      for (const money of response) {
        const key = money.date.slice(0, 7);
        groupedByMonth[key].push(money);
      }
      // 1か月ごとにsliceに追加
      for (const [key, data] of Object.entries(groupedByMonth)) {
        dispatch(setMoneyData({ data, key }));
      }
    } else {
      dispatch(setMoneyData({ data: response, key: formatDateToKey(date) }));
    }

    return response;
  };

  return { fetchMoney };
};
