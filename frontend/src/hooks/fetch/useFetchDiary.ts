import { API_ENDPOINTS } from '@/configs';
import { setDiaryData, useAppDispatch } from '@/redux';
import type { CardThumbnail, DiaryCard, ResponseGalleryItem } from '@/types';
import { formatDateToKey } from '@/utils';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchDiary = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * 1ヶ月分のDiaryを取得
   */
  const fetchDiary = async (date: Date): Promise<null | { card: DiaryCard[]; thumb: CardThumbnail[] }> => {
    const response = await getRequest<{ card: DiaryCard[]; thumb: CardThumbnail[] }>({
      apiUrl: API_ENDPOINTS.diary,
      queryParams: {
        end: format(endOfMonth(date), 'yyyy-MM-dd'),
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
      },
    });

    if (!response) return null;

    dispatch(setDiaryData({ data: response.card, key: formatDateToKey(date), thumb: response.thumb }));

    return response;
  };

  /**
   * 日記の詳細データを取得（編集画面・ドロワー用）
   */
  const fetchDiaryItem = async (id: number): Promise<null | { content: string; item: ResponseGalleryItem[] }> => {
    const response = await getRequest<{ content: string; item: ResponseGalleryItem[] }>({
      apiUrl: `${API_ENDPOINTS.diary}item/${String(id)}/`,
      queryParams: {},
    });

    return response;
  };

  return { fetchDiary, fetchDiaryItem };
};
