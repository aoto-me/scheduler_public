import { API_ENDPOINTS } from '@/configs';
import { setMemoTableData, setProjectTableData, useAppDispatch } from '@/redux';
import type { ResponseTable, Table } from '@/types';
import type { Action } from '@reduxjs/toolkit';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchTable = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * tableデータを取得
   */
  const fetchTable = async ({ pathname, postId }: { pathname: string; postId: string }): Promise<null | Table> => {
    const response = await getRequest<ResponseTable>({
      apiUrl: `${API_ENDPOINTS.table}${pathname}/${postId}/`,
      queryParams: {},
    });

    if (!response) return null;

    const actionMap: Partial<Record<string, ({ data, id }: { data: null | Table; id: number }) => Action>> = {
      memo: setMemoTableData,
      project: setProjectTableData,
    };
    const action = actionMap[pathname];

    if (response.id === 0) {
      // tableのデータなし
      if (action) dispatch(action({ data: null, id: Number(postId) }));
      return null;
    }

    const tableData: Table = {
      ...response,
      height: Boolean(response.height),
      width: Boolean(response.width),
    };

    if (action) dispatch(action({ data: tableData, id: Number(postId) }));

    return tableData;
  };

  return { fetchTable };
};
