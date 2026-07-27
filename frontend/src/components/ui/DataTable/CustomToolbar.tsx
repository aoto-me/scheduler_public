import { ICONS } from '@/configs';
import { theme } from '@/theme';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { Button, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import {
  ExportCsv,
  FilterPanelTrigger,
  GridRowModes,
  type GridRowModesModel,
  type GridRowsProp,
  type GridSlotProps,
  type GridValidRowModel,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  Toolbar,
} from '@mui/x-data-grid';
import { ColumnsPanelTrigger, ToolbarButton } from '@mui/x-data-grid';
import { Icon } from '../Icon';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    setRowModesModel: (newModel: (oldModel: GridRowModesModel) => GridRowModesModel) => void;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  }
}

const buttonStyle = {
  '&[aria-expanded="true"]': {
    bgcolor: 'rgba(255, 255, 255, 0.15)',
  },
  '@media (hover: hover)': {
    '&:hover': {
      bgcolor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  color: theme.palette.secondary.light,
};

export const CustomToolbar = (
  props: GridSlotProps['toolbar'] & {
    rows: readonly GridValidRowModel[] | undefined;
    table: string;
  }
) => {
  const { rows, setRowModesModel, setRows, table } = props;

  const getNewRow = () => {
    switch (table) {
      case 'expenseCategory':
      case 'healthCategory':
      case 'incomeCategory': {
        return {
          icon: '',
          name: '',
        };
      }
      case 'foodDB': {
        return {
          carb: null,
          energy: null,
          fat: null,
          name: '',
          perItem: false,
          protein: null,
          salt: null,
        };
      }
      case 'rss': {
        return {
          siteName: '',
          url: '',
        };
      }
      case 'yearEvent': {
        return {
          date: '',
          name: '',
        };
      }
      default: {
        return {
          content: '',
        };
      }
    }
  };

  const getNextId = (data: readonly GridValidRowModel[]) => {
    // 配列が空の場合、初期値として1を返す
    if (data.length === 0) return 1;
    // 最大のidを取得
    const maxId = data.reduce((max, item) => Math.max(max, item.id as number), 0);
    return maxId + 1;
  };

  const addNewRow = () => {
    if (!rows) return;
    const id = getNextId(rows);
    const newRow = getNewRow();
    setRows(oldRows => [...oldRows, { id, ...newRow, isNew: true }]);
    setRowModesModel(oldModel => ({
      ...oldModel,
      [id]: {
        mode: GridRowModes.Edit,
      },
    }));
  };

  return (
    <Toolbar>
      {table !== 'nutrition' && (
        <Button
          onClick={addNewRow}
          startIcon={<Icon color={theme.palette.secondary.light} icon={ICONS.addCircle} size="1rem" />}
          sx={{
            ...buttonStyle,
            flexShrink: 0,
          }}
        >
          データの追加
        </Button>
      )}

      <Tooltip disableFocusListener disableTouchListener placement="top" title="カラムの表示">
        <ColumnsPanelTrigger
          render={
            <ToolbarButton
              render={
                <IconButton sx={buttonStyle}>
                  <Icon color={theme.palette.secondary.light} icon={ICONS.column} size="1rem" />
                </IconButton>
              }
            />
          }
        />
      </Tooltip>

      <Tooltip disableFocusListener disableTouchListener placement="top" title="フィルター">
        <FilterPanelTrigger
          render={
            <ToolbarButton
              render={
                <IconButton sx={buttonStyle}>
                  <Icon color={theme.palette.secondary.light} icon={ICONS.filter} size="1rem" />
                </IconButton>
              }
            />
          }
        />
      </Tooltip>

      <Tooltip disableFocusListener disableTouchListener placement="top" title="CSVダウンロード">
        <ExportCsv
          render={
            <ToolbarButton
              render={
                <IconButton aria-label="CSVダウンロード" sx={{ ...buttonStyle, marginRight: 'auto' }}>
                  <Icon color={theme.palette.secondary.light} icon={ICONS.downloadFill} size="1rem" />
                </IconButton>
              }
            />
          }
        />
      </Tooltip>

      <QuickFilter expanded>
        <QuickFilterControl
          render={({ ref, ...other }) => (
            <TextField
              {...other}
              aria-label="Search"
              autoComplete="off"
              inputRef={ref}
              placeholder="検索..."
              size="small"
              slotProps={{
                input: {
                  endAdornment: other.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        aria-label="検索リセット"
                        edge="end"
                        material={{ sx: { marginRight: -0.75 } }}
                        size="small"
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  ...other.slotProps?.input,
                },
                ...other.slotProps,
              }}
              spellCheck={'false'}
              sx={{
                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                },
                '& fieldset': {
                  borderColor: `${theme.palette.secondary.light} !important`,
                },
                maxWidth: 260,
                width: '100%',
              }}
            />
          )}
        />
      </QuickFilter>
    </Toolbar>
  );
};
