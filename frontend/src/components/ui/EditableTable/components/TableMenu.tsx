import { ICONS } from '@/configs';
import { theme } from '@/theme';
import { ListItemIcon, ListItemText, Menu, type MenuProps } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { Icon } from '../../Icon';

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    anchorOrigin={{
      horizontal: 'left',
      vertical: 'bottom',
    }}
    elevation={0}
    transformOrigin={{
      horizontal: 'left',
      vertical: 'top',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    '& .MuiListItemIcon-root': {
      marginRight: theme.spacing(1.5),
      minWidth: 'fit-content',
    },
    '& .MuiMenuItem-root': {
      minHeight: 'fit-content',
    },
    '& .MuiTypography-root': {
      fontSize: '0.875rem',
      lineHeight: 1.35,
    },
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
  },
}));

interface TableMenuProps {
  autoHeight: boolean;
  canUndo: boolean;
  fullWidth: boolean;
  onChangeHeight: () => void;
  onChangeWidth: () => void;
  onDeleteTable: () => void;
  onExportCsv: () => void;
  onImportExcel: () => void;
  onUndoTable: () => void;
  undoLabel: string;
}

export const TableMenu = ({
  autoHeight,
  canUndo,
  fullWidth,
  onChangeHeight,
  onChangeWidth,
  onDeleteTable,
  onExportCsv,
  onImportExcel,
  onUndoTable,
  undoLabel,
}: TableMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        aria-controls={open ? 'editableTableMenu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        aria-label="テーブルメニュー"
        id="editableTableMenu-button"
        onClick={handleClick}
        size="small"
        sx={{
          color: theme.palette.secondary.light,
          ...(open && { bgcolor: 'rgba(255, 255, 255, 0.15)' }),
          '@media (hover: hover)': {
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.15)',
            },
          },
        }}
      >
        <Icon color={theme.palette.secondary.light} icon={ICONS.more} size="1rem" />
      </IconButton>
      <StyledMenu
        anchorEl={anchorEl}
        id="editableTableMenu"
        onClose={handleClose}
        open={open}
        slotProps={{
          list: {
            'aria-labelledby': 'editableTableMenu-button',
          },
        }}
      >
        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onChangeWidth();
          }}
        >
          <ListItemIcon>
            <Icon icon={fullWidth ? ICONS.fixedWidth : ICONS.fullWidth} size="1rem" />
          </ListItemIcon>
          <ListItemText>{fullWidth ? '固定幅表示' : '全幅表示'}</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onChangeHeight();
          }}
        >
          <ListItemIcon>
            <Icon icon={autoHeight ? ICONS.fixedHeight : ICONS.fullHeight} size="1rem" />
          </ListItemIcon>
          <ListItemText>{autoHeight ? '固定高さ表示' : '全行表示'}</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onExportCsv();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.download} size="1rem" />
          </ListItemIcon>
          <ListItemText>CSVをエクスポート</ListItemText>
        </MenuItem>

        <MenuItem
          disabled={canUndo}
          disableRipple
          onClick={() => {
            handleClose();
            onUndoTable();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.arrowGoBack} size="1rem" />
          </ListItemIcon>
          <ListItemText>{`${undoLabel === '' ? '1つ前' : undoLabel}の状態に戻す`}</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onImportExcel();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.excel} size="1rem" />
          </ListItemIcon>
          <ListItemText>Excelをインポート</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onDeleteTable();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.delete} size="1rem" />
          </ListItemIcon>
          <ListItemText>テーブルを削除</ListItemText>
        </MenuItem>
      </StyledMenu>
    </div>
  );
};
