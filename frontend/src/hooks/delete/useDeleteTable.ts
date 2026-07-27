import { API_ENDPOINTS } from '@/configs';
import { removeMemoTable, removeProjectTable, useAppDispatch } from '@/redux';
import type { Action } from '@reduxjs/toolkit';
import { useHttpRequest } from '../useHttpRequest';

export const useDeleteTable = () => {
  const { deleteRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * table
   */
  const deleteTable = async ({
    id,
    pathname,
    postId,
  }: {
    id: number;
    pathname: string;
    postId: string;
  }): Promise<null | string> => {
    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.table}${pathname}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    const actionMap: Partial<Record<string, (postId: number) => Action>> = {
      memo: removeMemoTable,
      project: removeProjectTable,
    };
    const action = actionMap[pathname];

    if (response === 'ok' && action) dispatch(action(Number(postId)));

    return response;
  };

  return { deleteTable };
};
