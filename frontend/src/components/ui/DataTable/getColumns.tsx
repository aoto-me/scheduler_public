import { ICONS } from '@/configs';
import { Box } from '@mui/material';
import { GridActionsCellItem, type GridColDef, GridRowModes, type GridRowModesModel } from '@mui/x-data-grid';
import { convertToRemixIcon, Icon } from '../Icon';

type GridRowModesModelProps = GridRowModesModel[number | string];

export const getColumns = (
  table: string,
  rowModesModel: GridRowModesModel,
  handleSaveClick: (id: number | string) => () => void,
  handleCancelClick: (id: number | string) => () => void,
  handleEditClick: (id: number | string) => () => void,
  handleDeleteClick: (id: number | string) => () => void
): GridColDef[] => {
  switch (table) {
    case 'expenseCategory':
    case 'healthCategory':
    case 'incomeCategory': {
      return [
        {
          align: 'center',
          editable: true,
          field: 'icon',
          headerAlign: 'center',
          headerName: 'アイコン',
          renderCell: params => (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
              }}
            >
              <Icon icon={convertToRemixIcon(params.value as string)} />
            </Box>
          ),
          width: 130,
        },
        {
          editable: true,
          field: 'name',
          headerName: 'カテゴリー名',
          width: 200,
        },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => {
            const modeInfo = rowModesModel[id] as GridRowModesModelProps | undefined;
            const isInEditMode = modeInfo?.mode === GridRowModes.Edit;
            if (isInEditMode) {
              return [
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.saveFill} size="1rem" />}
                  key={`${String(id)}-save`}
                  label="保存"
                  onClick={handleSaveClick(id)}
                />,
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.closeFill} size="1rem" />}
                  key={`${String(id)}-cancel`}
                  label="キャンセル"
                  onClick={handleCancelClick(id)}
                />,
              ];
            }
            return [
              <GridActionsCellItem
                icon={<Icon icon={ICONS.editFill} size="1rem" />}
                key={`${String(id)}-edit`}
                label="編集"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
                key={`${String(id)}-delete`}
                label="削除"
                onClick={handleDeleteClick(id)}
              />,
            ];
          },
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    case 'foodDB': {
      return [
        {
          editable: true,
          field: 'name',
          headerName: '名称',
          width: 220,
        },
        {
          editable: true,
          field: 'perItem',
          headerAlign: 'center',
          headerName: '1個あたり',
          renderCell: params => <>{!!params.value && <Icon icon={ICONS.check} />}</>,
          type: 'boolean',
          width: 140,
        },
        {
          editable: true,
          field: 'energy',
          headerAlign: 'center',
          headerName: '熱量(kcal)',
          type: 'number',
          width: 140,
        },
        {
          editable: true,
          field: 'protein',
          headerAlign: 'center',
          headerName: 'たんぱく質(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 160,
        },
        {
          editable: true,
          field: 'fat',
          headerAlign: 'center',
          headerName: '脂質(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 120,
        },
        {
          editable: true,
          field: 'carb',
          headerAlign: 'center',
          headerName: '炭水化物(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 160,
        },
        {
          editable: true,
          field: 'salt',
          headerAlign: 'center',
          headerName: '食塩相当量(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 170,
        },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => {
            const modeInfo = rowModesModel[id] as GridRowModesModelProps | undefined;
            const isInEditMode = modeInfo?.mode === GridRowModes.Edit;
            if (isInEditMode) {
              return [
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.saveFill} size="1rem" />}
                  key={`${String(id)}-save`}
                  label="保存"
                  onClick={handleSaveClick(id)}
                />,
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.closeFill} size="1rem" />}
                  key={`${String(id)}-cancel`}
                  label="キャンセル"
                  onClick={handleCancelClick(id)}
                />,
              ];
            }
            return [
              <GridActionsCellItem
                icon={<Icon icon={ICONS.editFill} size="1rem" />}
                key={`${String(id)}-edit`}
                label="編集"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
                key={`${String(id)}-delete`}
                label="削除"
                onClick={handleDeleteClick(id)}
              />,
            ];
          },
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    case 'nutrition': {
      return [
        {
          editable: true,
          field: 'energy',
          headerAlign: 'center',
          headerName: '熱量(kcal)',
          type: 'number',
          width: 140,
        },
        {
          editable: true,
          field: 'protein',
          headerAlign: 'center',
          headerName: 'たんぱく質(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 160,
        },
        {
          editable: true,
          field: 'fat',
          headerAlign: 'center',
          headerName: '脂質(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 120,
        },
        {
          editable: true,
          field: 'carb',
          headerAlign: 'center',
          headerName: '炭水化物(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 160,
        },
        {
          editable: true,
          field: 'salt',
          headerAlign: 'center',
          headerName: '食塩相当量(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 170,
        },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => {
            const modeInfo = rowModesModel[id] as GridRowModesModelProps | undefined;
            const isInEditMode = modeInfo?.mode === GridRowModes.Edit;
            if (isInEditMode) {
              return [
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.saveFill} size="1rem" />}
                  key={`${String(id)}-save`}
                  label="保存"
                  onClick={handleSaveClick(id)}
                />,
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.closeFill} size="1rem" />}
                  key={`${String(id)}-cancel`}
                  label="キャンセル"
                  onClick={handleCancelClick(id)}
                />,
              ];
            }
            return [
              <GridActionsCellItem
                icon={<Icon icon={ICONS.editFill} size="1rem" />}
                key={`${String(id)}-edit`}
                label="編集"
                onClick={handleEditClick(id)}
              />,
            ];
          },
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    case 'rss': {
      return [
        {
          editable: true,
          field: 'siteName',
          headerName: 'サイト名',
          width: 200,
        },
        {
          editable: true,
          field: 'url',
          headerName: 'URL',
          width: 240,
        },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => {
            const modeInfo = rowModesModel[id] as GridRowModesModelProps | undefined;
            const isInEditMode = modeInfo?.mode === GridRowModes.Edit;
            if (isInEditMode) {
              return [
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.saveFill} size="1rem" />}
                  key={`${String(id)}-save`}
                  label="保存"
                  onClick={handleSaveClick(id)}
                />,
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.closeFill} size="1rem" />}
                  key={`${String(id)}-cancel`}
                  label="キャンセル"
                  onClick={handleCancelClick(id)}
                />,
              ];
            }
            return [
              <GridActionsCellItem
                icon={<Icon icon={ICONS.editFill} size="1rem" />}
                key={`${String(id)}-edit`}
                label="編集"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
                key={`${String(id)}-delete`}
                label="削除"
                onClick={handleDeleteClick(id)}
              />,
            ];
          },
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    case 'yearEvent': {
      return [
        {
          editable: true,
          field: 'date',
          headerName: '日付',
          type: 'date',
          width: 130,
        },
        { editable: true, field: 'name', headerName: 'イベント名', width: 200 },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => {
            const modeInfo = rowModesModel[id] as GridRowModesModelProps | undefined;
            const isInEditMode = modeInfo?.mode === GridRowModes.Edit;
            if (isInEditMode) {
              return [
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.saveFill} size="1rem" />}
                  key={`${String(id)}-save`}
                  label="保存"
                  onClick={handleSaveClick(id)}
                />,
                <GridActionsCellItem
                  icon={<Icon icon={ICONS.closeFill} size="1rem" />}
                  key={`${String(id)}-cancel`}
                  label="キャンセル"
                  onClick={handleCancelClick(id)}
                />,
              ];
            }
            return [
              <GridActionsCellItem
                icon={<Icon icon={ICONS.editFill} size="1rem" />}
                key={`${String(id)}-edit`}
                label="編集"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
                key={`${String(id)}-delete`}
                label="削除"
                onClick={handleDeleteClick(id)}
              />,
            ];
          },
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    default: {
      return [];
      break;
    }
  }
};
