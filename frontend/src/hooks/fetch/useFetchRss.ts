import { API_ENDPOINTS } from '@/configs';
import { setEmptyRssList, setRssItem, useAppDispatch } from '@/redux';
import type { RSSItem, RSSList } from '@/types';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchRss = () => {
  const { postRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  const fetchRssItem = async (rssList: RSSList, signal?: AbortSignal): Promise<null | RSSItem[]> => {
    const response = await postRequest<{ id: number; items: RSSItem[] }>({
      apiUrl: API_ENDPOINTS.rss,
      data: {
        id: rssList.id,
        siteName: rssList.siteName,
        url: rssList.url,
      },
      signal,
    });

    if (!response) return null;

    if (response.items.length === 0) {
      dispatch(setEmptyRssList(rssList));
    } else {
      dispatch(setRssItem(response));
    }

    return response.items;
  };

  return { fetchRssItem };
};
