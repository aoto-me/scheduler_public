import { API_ENDPOINTS } from '@/configs';
import { setMemoData, useAppDispatch } from '@/redux';
import type { Memo } from '@/types';
import type { JSONContent } from '@tiptap/core';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchMemo = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * メモの詳細データを取得
   */
  const fetchMemo = async (postId: string): Promise<Memo | null> => {
    const response = await getRequest<Memo>({
      apiUrl: `${API_ENDPOINTS.memo}${postId}`,
      queryParams: {},
    });

    if (!response) return null;

    const parsed: Memo = { ...response, content: JSON.parse(response.content as string) as JSONContent };
    dispatch(setMemoData(parsed));

    return parsed;
  };

  return { fetchMemo };
};
