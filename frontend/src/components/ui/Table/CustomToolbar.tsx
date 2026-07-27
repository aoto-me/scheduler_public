import { ICONS } from '@/configs';
import { theme } from '@/theme';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { Button, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import {
  ExportCsv,
  FilterPanelTrigger,
  type GridSlotProps,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  Toolbar,
} from '@mui/x-data-grid';
import { ColumnsPanelTrigger, ToolbarButton } from '@mui/x-data-grid';
import { Icon } from '../Icon';

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

const TABLE_ADD_LABELS: Record<string, string> = {
  food: '食事記録を追加',
  health: '体調を追加',
  money: '家計簿データを追加',
};

export const CustomToolbar = (
  props: GridSlotProps['toolbar'] & {
    onAdd: React.MouseEventHandler<HTMLButtonElement>;
    table?: string;
  }
) => {
  const { onAdd, table } = props;

  return (
    <Toolbar>
      <Button
        aria-label={table ? (TABLE_ADD_LABELS[table] ?? 'データの追加') : 'データの追加'}
        onClick={onAdd}
        startIcon={<Icon color={theme.palette.secondary.light} icon={ICONS.addCircle} size="1rem" />}
        sx={{
          ...buttonStyle,
          flexShrink: 0,
        }}
      >
        データの追加
      </Button>
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
                <IconButton sx={{ ...buttonStyle, marginRight: 'auto' }}>
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
