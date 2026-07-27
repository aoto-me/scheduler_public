import { API_ENDPOINTS } from '@/configs';
import {
  updateMemoTableColumn,
  updateMemoTableRow,
  updateMemoTableSize,
  updateProjectTableColumn,
  updateProjectTableRow,
  updateProjectTableSize,
  useAppDispatch,
} from '@/redux';
import type { TableColumnType } from '@/types';
import { base64Encode } from '@/utils';
import { useHttpRequest } from '../useHttpRequest';

export const useSaveTable = () => {
  const { patchRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  // tableDataの更新
  const updateTable = async ({
    data,
    id,
    pathname,
    postId,
    target,
    text,
  }: {
    data: boolean | string;
    id: number;
    pathname: string;
    postId: string;
    target: TableColumnType;
    text?: string;
  }): Promise<null | string> => {
    const dataMap: Record<TableColumnType, object> = {
      columnData: { columnData: data },
      height: { height: data ? 1 : 0 },
      rowData: { rowData: base64Encode(data as string), text: base64Encode(text!) },
      width: { width: data ? 1 : 0 },
    };

    const response = await patchRequest<string>({
      apiUrl: `${API_ENDPOINTS.table}${pathname}/${String(id)}/`,
      data: { target, ...dataMap[target] },
    });

    if (!response) return null;

    if (response === 'ok') {
      switch (target) {
        case 'columnData': {
          if (pathname === 'memo') {
            dispatch(updateMemoTableColumn({ data: data as string, postId: Number(postId) }));
          }
          if (pathname === 'project') {
            dispatch(updateProjectTableColumn({ data: data as string, postId: Number(postId) }));
          }
          break;
        }
        case 'height':
        case 'width': {
          if (pathname === 'memo') {
            dispatch(updateMemoTableSize({ data: data as boolean, postId: Number(postId), target }));
          }
          if (pathname === 'project') {
            dispatch(updateProjectTableSize({ data: data as boolean, postId: Number(postId), target }));
          }
          break;
        }
        case 'rowData': {
          if (pathname === 'memo') {
            dispatch(updateMemoTableRow({ data: data as string, postId: Number(postId) }));
          }
          if (pathname === 'project') {
            dispatch(updateProjectTableRow({ data: data as string, postId: Number(postId) }));
          }
          break;
        }
        default: {
          break;
        }
      }
    }
    return response;
  };

  return { updateTable };
};
