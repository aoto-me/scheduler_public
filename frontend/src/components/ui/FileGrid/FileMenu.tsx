import { ICONS } from '@/configs';
import { ListItemIcon, ListItemText, Menu, type MenuProps } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { Icon } from '../Icon';

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

interface FileMenuProps {
  isOpen: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onDownload: () => Promise<void>;
  onEdit: () => void;
  onOpen: () => void;
}

export const FileMenu = ({ isOpen, onCopy, onDelete, onDownload, onEdit, onOpen }: FileMenuProps) => {
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
        aria-controls={open ? 'fileMenu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        aria-label="ファイル操作メニュー"
        id="fileMenu-button"
        onClick={handleClick}
        size="small"
        sx={{
          ...(open && { backgroundColor: 'var(--IconButton-hoverBg)' }),
        }}
      >
        <Icon icon={ICONS.more} size="1rem" />
      </IconButton>
      <StyledMenu
        anchorEl={anchorEl}
        id="fileMenu"
        onClose={handleClose}
        open={open}
        slotProps={{
          list: {
            'aria-labelledby': 'fileMenu-button',
          },
        }}
      >
        {isOpen && (
          <MenuItem
            disableRipple
            onClick={() => {
              handleClose();
              onOpen();
            }}
          >
            <ListItemIcon>
              <Icon icon={ICONS.open} size="1rem" />
            </ListItemIcon>
            <ListItemText>ファイルを開く</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onEdit();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.edit} size="1rem" />
          </ListItemIcon>
          <ListItemText>ファイル名の変更</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onCopy();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.copy} size="1rem" />
          </ListItemIcon>
          <ListItemText>URLのコピー</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            void onDownload();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.download} size="1rem" />
          </ListItemIcon>
          <ListItemText>ダウンロード</ListItemText>
        </MenuItem>

        <MenuItem
          disableRipple
          onClick={() => {
            handleClose();
            onDelete();
          }}
        >
          <ListItemIcon>
            <Icon icon={ICONS.delete} size="1rem" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </StyledMenu>
    </div>
  );
};
