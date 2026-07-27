import { useFetchFile } from '@/hooks';
import { selectDirectories, selectDirectoryFetched, useAppSelector } from '@/redux';
import { drawerHeader, navHeight } from '@/styles';
import { theme } from '@/theme';
import { useMediaQuery } from '@mui/material';
import { useEffect } from 'react';
import { Loader } from '../ui';
import { DirectoryTree } from './DirectoryTree';

export const FileDrawerContent = () => {
  const fetched = useAppSelector(selectDirectoryFetched);
  const directories = useAppSelector(selectDirectories);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchDirectories } = useFetchFile();

  // データの取得 - directories
  useEffect(() => {
    if (fetched) return;
    void fetchDirectories();
  }, [fetched, fetchDirectories]);

  if (!fetched && !directories) {
    return (
      <Loader
        style={{
          height: isMobile
            ? `calc(100svh - ${drawerHeader} - 1.5rem - ${navHeight})`
            : `calc(100svh - ${drawerHeader} - 1.5rem )`,
        }}
      />
    );
  }

  return <DirectoryTree />;
};
