import { ICONS } from '@/configs';
import { useSaveFile } from '@/hooks';
import { selectSelectedDirectory, useAppSelector } from '@/redux';
import { IconButton } from '@mui/material';
import { useCallback } from 'react';
import { Icon } from '../ui';

export const FileDrawerHeader = () => {
  const selectedDirectory = useAppSelector(selectSelectedDirectory);
  const { createFolder } = useSaveFile();

  // 選択中のフォルダ直下に新規フォルダを作成
  const handleCreateFolder = useCallback(() => {
    if (selectedDirectory) void createFolder(selectedDirectory);
  }, [selectedDirectory, createFolder]);

  return (
    <IconButton
      aria-label="新規フォルダの追加"
      onClick={handleCreateFolder}
      size="small"
      sx={{
        marginRight: 'auto',
      }}
    >
      <Icon icon={ICONS.folderAdd} />
    </IconButton>
  );
};
