import { API_ENDPOINTS } from '@/configs';
import { useHttpRequest } from '@/hooks';
import { addMemoTable, addProjectTable, useAppDispatch } from '@/redux';
import type { Table } from '@/types';
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import { Button } from '@mui/material';
import { memo, useCallback } from 'react';

interface CreateTableButtonProps {
  pathname: string;
  postId: string;
}

export const CreateTableButton = memo(({ pathname, postId }: CreateTableButtonProps) => {
  const { postRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  const createTable = useCallback(async () => {
    const response = await postRequest<number>({
      apiUrl: `${API_ENDPOINTS.table}${pathname}/${postId}/`,
      data: {},
    });

    if (!response) return;

    const tableData: Table = {
      columnData: JSON.stringify([]),
      height: true,
      id: response,
      page: pathname,
      postId: Number(postId),
      rowData: JSON.stringify([]),
      width: false,
    };

    switch (pathname) {
      case 'memo': {
        dispatch(addMemoTable({ data: tableData, id: Number(postId) }));
        break;
      }
      case 'project': {
        dispatch(addProjectTable({ data: tableData, id: Number(postId) }));
        break;
      }
      default: {
        break;
      }
    }
  }, [postId, pathname, postRequest, dispatch]);

  return (
    <Button
      fullWidth
      onClick={createTable}
      startIcon={<AddCircleSharpIcon color="primary" />}
      sx={{
        alignItems: ' center',
        display: 'flex',
        height: 'fit-content',
        letterSpacing: 0.5,
        maxWidth: '20rem',
        textTransform: 'none',
      }}
      variant="outlined"
    >
      テーブルを追加
    </Button>
  );
});
