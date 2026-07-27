import { API_ENDPOINTS } from '@/configs';
import { setGalleryMenu, setMemoMenu, setProjectMenu, useAppDispatch } from '@/redux';
import type { Folder, MenuItem, MenuItemOrder } from '@/types';
import { useHttpRequest } from '../useHttpRequest';

const menuActionMap = {
  gallery: setGalleryMenu,
  memo: setMemoMenu,
  project: setProjectMenu,
} as const;

export const useFetchMenu = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * メニューデータを取得（memo / gallery / project 共用）
   */
  const fetchMenu = async (
    pathname: keyof typeof menuActionMap
  ): Promise<null | { folders: Folder[]; itemOrder: MenuItemOrder[]; items: MenuItem[] }> => {
    const action = menuActionMap[pathname];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!action) return null;

    const response = await getRequest<{
      folders: Folder[];
      itemOrder: MenuItemOrder[];
      items: MenuItem[];
    }>({
      apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(
      action({
        folder: response.folders,
        item: response.items,
        itemOrder: response.itemOrder,
      })
    );

    return response;
  };

  return { fetchMenu };
};
