import { MentalIcons } from '@/components/Health';
import { ICONS } from '@/configs';
import { theme } from '@/theme';
import type { ExpenseCategory, IncomeCategory } from '@/types';
import { Box, Chip } from '@mui/material';
import { GridActionsCellItem, type GridColDef, type GridRowModel } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { Fragment } from 'react/jsx-runtime';
import { convertToRemixIcon, Icon } from '../Icon';

export const getColumns = (
  table: string,
  onEdit: (id: number | string) => () => void,
  onDelete: (id: number | string) => () => void,
  iconMap?: Map<string, string>,
  expenseCategory?: ExpenseCategory[],
  incomeCategory?: IncomeCategory[]
): GridColDef[] => {
  // Moneyページの場合、収入カテゴリーと支出カテゴリーの選択やアイコンを表示するため
  const incomeCategoryValueOptions = incomeCategory ? incomeCategory.map(category => category.name) : [];
  const expenseCategoryValueOptions = expenseCategory ? expenseCategory.map(category => category.name) : [];
  const incomeCategoryMap = incomeCategory
    ? new Map(incomeCategory.map(c => [c.name, c]))
    : new Map<string, IncomeCategory>();
  const expenseCategoryMap = expenseCategory
    ? new Map(expenseCategory.map(c => [c.name, c]))
    : new Map<string, IncomeCategory>();

  switch (table) {
    case 'food': {
      return [
        {
          field: 'date',
          headerName: '日付',
          type: 'date',
          width: 110,
        },
        {
          field: 'name',
          headerName: '食事',
          width: 200,
        },
        {
          field: 'quantity',
          headerAlign: 'center',
          headerName: '量',
          renderCell: params => {
            const row = params.row as GridRowModel;
            return (
              <>
                {params.value} {row.unit}
              </>
            );
          },
          type: 'number',
          width: 90,
        },
        {
          field: 'energy',
          headerAlign: 'center',
          headerName: '熱量(kcal)',
          type: 'number',
          width: 140,
        },
        {
          field: 'protein',
          headerAlign: 'center',
          headerName: 'たんぱく質(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 160,
        },
        {
          field: 'fat',
          headerAlign: 'center',
          headerName: '脂質(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 120,
        },
        {
          field: 'carb',
          headerAlign: 'center',
          headerName: '炭水化物(g)',
          renderCell: params => <>{params.value !== null && params.value}</>,
          type: 'number',
          width: 160,
        },
        {
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
          getActions: ({ id }) => [
            <GridActionsCellItem
              icon={<Icon icon={ICONS.editFill} size="1rem" />}
              key={`${String(id)}-edit`}
              label="編集"
              onClick={onEdit(id)}
            />,
            <GridActionsCellItem
              icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
              key={`${String(id)}-delete`}
              label="削除"
              onClick={onDelete(id)}
            />,
          ],
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    case 'health': {
      return [
        {
          field: 'date',
          headerName: '日付',
          renderCell: params => (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                height: '100%',
                minHeight: '52px',
                padding: '8px 0',
              }}
            >
              {format(params.value as Date, 'yyyy/M/dd')}
            </Box>
          ),
          type: 'date',
          width: 110,
        },
        {
          field: 'item',
          headerName: '症状',
          renderCell: params => {
            const items = (params.value as string)
              .split(',')
              .map((text: string) => text.trim())
              .filter(Boolean);
            return (
              <Box
                sx={{
                  alignContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'wrap',
                  height: '100%',
                  minHeight: '52px',
                  padding: '4px 0',
                }}
              >
                {items.map((item: string, index: number) => (
                  <Chip
                    icon={
                      <Icon
                        icon={convertToRemixIcon(iconMap?.get(item) ?? 'dossier-line')}
                        style={{
                          flexShrink: 0,
                          marginLeft: '4px',
                          marginRight: '-4px',
                        }}
                      />
                    }
                    key={index}
                    label={item}
                    size="small"
                    sx={{
                      height: 'auto',
                      margin: '4px',
                      padding: '3px',
                    }}
                  />
                ))}
              </Box>
            );
          },
          width: 180,
        },
        {
          field: 'mental',
          headerAlign: 'center',
          headerName: '調子',
          renderCell: params => (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
                minHeight: '52px',
                padding: '8px 0',
              }}
            >
              {params.value > 0 && (
                <p
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                  }}
                >
                  {MentalIcons[params.value as number].icon}
                </p>
              )}
            </Box>
          ),
          type: 'number',
          width: 110,
        },
        {
          field: 'exercise',
          headerAlign: 'center',
          headerName: '運動',
          renderCell: params => <>{params.value && <Icon icon={ICONS.check} />}</>,
          type: 'boolean',
          width: 110,
        },
        {
          field: 'memo',
          headerName: 'メモ',
          renderCell: params => (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                height: '100%',
                minHeight: '52px',
                padding: '8px 0',
              }}
            >
              <p>
                {(params.value as string).split('\n').map((line: string, index: number) => (
                  <Fragment key={index}>
                    {line}
                    <br />
                  </Fragment>
                ))}
              </p>
            </Box>
          ),
          width: 300,
        },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => [
            <GridActionsCellItem
              icon={<Icon icon={ICONS.editFill} size="1rem" />}
              key={`${String(id)}-edit`}
              label="編集"
              onClick={onEdit(id)}
            />,
            <GridActionsCellItem
              icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
              key={`${String(id)}-delete`}
              label="削除"
              onClick={onDelete(id)}
            />,
          ],
          headerName: '編集',
          type: 'actions',
          width: 100,
        },
      ];
      break;
    }
    case 'money': {
      return [
        {
          field: 'date',
          headerName: '日付',
          type: 'date',
          width: 110,
        },
        {
          align: 'center',
          field: 'type',
          headerAlign: 'center',
          headerName: 'タイプ',
          renderCell: params => {
            const row = params.row as GridRowModel;
            const selectedType = row.type as string;
            return (
              <>
                {selectedType === '収入' ? (
                  <span
                    style={{
                      backgroundColor: theme.palette.incomeColor.light,
                      border: `1px solid ${theme.palette.incomeColor.main}`,
                      borderRadius: '999px',
                      color: theme.palette.incomeColor.dark,
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                    }}
                  >
                    {params.value}
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: theme.palette.expenseColor.light,
                      border: `1px solid ${theme.palette.expenseColor.main}`,
                      borderRadius: '999px',
                      color: theme.palette.expenseColor.dark,
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                    }}
                  >
                    {params.value}
                  </span>
                )}
              </>
            );
          },
          type: 'singleSelect',
          valueOptions: ['収入', '支出'],
          width: 120,
        },
        {
          field: 'category',
          headerName: 'カテゴリー',
          renderCell: params => {
            const row = params.row as GridRowModel;
            const selectedType = row.type as string;
            return (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'nowrap',
                  justifyContent: 'flex-start',
                }}
              >
                {selectedType === '収入' ? (
                  <Icon
                    icon={convertToRemixIcon(incomeCategoryMap.get(params.value as string)?.icon ?? 'question-mark')}
                    style={{ flexShrink: 0, marginRight: 8 }}
                  />
                ) : (
                  <Icon
                    icon={convertToRemixIcon(expenseCategoryMap.get(params.value as string)?.icon ?? 'question-mark')}
                    style={{ flexShrink: 0, marginRight: 8 }}
                  />
                )}
                <span>{params.value}</span>
              </Box>
            );
          },
          type: 'singleSelect',
          valueOptions: params => {
            const row = params.row as GridRowModel | undefined;
            const selectedType = row ? (row.type as '収入' | '支出') : '';
            switch (selectedType) {
              case '収入': {
                return incomeCategoryValueOptions;
              }
              case '支出': {
                return expenseCategoryValueOptions;
              }
              default: {
                return [...expenseCategoryValueOptions, ...incomeCategoryValueOptions];
              }
            }
          },
          width: 180,
        },
        { field: 'content', headerName: '内容', width: 200 },
        {
          align: 'left',
          field: 'amount',
          headerAlign: 'left',
          headerName: '金額',
          renderCell: params => <>¥ {Intl.NumberFormat('ja-JP').format(params.value as number)}</>,
          type: 'number',
          width: 120,
        },
        {
          cellClassName: 'actions',
          field: 'actions',
          getActions: ({ id }) => [
            <GridActionsCellItem
              icon={<Icon icon={ICONS.editFill} size="1rem" />}
              key={`${String(id)}-edit`}
              label="編集"
              onClick={onEdit(id)}
            />,
            <GridActionsCellItem
              icon={<Icon icon={ICONS.deleteFill} size="1rem" />}
              key={`${String(id)}-delete`}
              label="削除"
              onClick={onDelete(id)}
            />,
          ],
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
