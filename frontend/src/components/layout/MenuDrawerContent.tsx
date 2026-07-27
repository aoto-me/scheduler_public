import { useFetchMenu, useSaveMenu } from '@/hooks';
import {
  selectGalleryMenu,
  selectGalleryMenuFetched,
  selectMemoMenu,
  selectMemoMenuFetched,
  selectProjectMenu,
  selectProjectMenuFetched,
  useAppSelector,
} from '@/redux';
import { drawerHeader, navHeight } from '@/styles';
import { theme } from '@/theme';
import type { TreeNode } from '@/types';
import { useMediaQuery } from '@mui/material';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader } from '../ui';
import { DraggableMenu } from '../ui/DraggableMenu';

interface DrawerMenuContentProps {
  filterText: string;
  isUpdate: boolean;
  setIsUpdate: Dispatch<SetStateAction<boolean>>;
}

export const DrawerMenuContent = ({ filterText, isUpdate, setIsUpdate }: DrawerMenuContentProps) => {
  const pathname = useLocation().pathname.split('/')[1];
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchMenu } = useFetchMenu();
  const { sortTree } = useSaveMenu();
  // memo
  const memoMenu = useAppSelector(selectMemoMenu);
  const memoMenuFetched = useAppSelector(selectMemoMenuFetched);
  // project
  const projectMenu = useAppSelector(selectProjectMenu);
  const projectMenuFetched = useAppSelector(selectProjectMenuFetched);
  // gallery
  const galleryMenu = useAppSelector(selectGalleryMenu);
  const galleryMenuFetched = useAppSelector(selectGalleryMenuFetched);

  // データの選択
  const { fetched, menu, page } = useMemo(() => {
    switch (pathname) {
      case 'gallery': {
        return { fetched: galleryMenuFetched, menu: galleryMenu, page: 'ギャラリー' };
      }
      case 'memo': {
        return { fetched: memoMenuFetched, menu: memoMenu, page: 'メモ' };
      }
      case 'project': {
        return { fetched: projectMenuFetched, menu: projectMenu, page: 'プロジェクト' };
      }
      default: {
        return { fetched: false, menu: null, page: '' };
      }
    }
  }, [pathname, memoMenu, memoMenuFetched, projectMenu, projectMenuFetched, galleryMenu, galleryMenuFetched]);

  useEffect(() => {
    const fetchedMap = {
      gallery: galleryMenuFetched,
      memo: memoMenuFetched,
      project: projectMenuFetched,
    } as const;

    const fetched = fetchedMap[pathname as keyof typeof fetchedMap];
    if (fetched) return; // 取得済み

    void fetchMenu(pathname as Parameters<typeof fetchMenu>[0]).catch(() => {
      console.error('Menuの取得に失敗しました');
    });
  }, [fetchMenu, pathname, projectMenuFetched, memoMenuFetched, galleryMenuFetched]);

  const filterItemIds = useMemo(() => {
    if (!filterText || filterText.trim().length === 0) return null;
    if (!menu) return null;

    // 部分一致でタイトルに含まれる id を配列で取得
    const matchingIds = [...menu.itemMap.entries()].filter(([, title]) => title.includes(filterText)).map(([id]) => id);
    return matchingIds;
  }, [filterText, menu]);

  const handleSortEnd = useCallback(
    (nodes: TreeNode[]) => {
      void sortTree({ nodes, pathname });
    },
    [pathname, sortTree]
  );

  if (!fetched || !menu) {
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

  return (
    <DraggableMenu
      filterItemIds={filterItemIds}
      isUpdate={isUpdate}
      itemMap={menu.itemMap}
      key={pathname}
      nodes={menu.nodes}
      onSortEnd={handleSortEnd}
      page={page}
      setIsUpdate={setIsUpdate}
    />
  );
};
