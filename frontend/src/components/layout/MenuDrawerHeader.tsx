import { ICONS } from '@/configs';
import { useSaveMenu } from '@/hooks';
import { selectGalleryMenu, selectMemoMenu, selectProjectMenu, useAppSelector } from '@/redux';
import { theme } from '@/theme';
import type { TreeNode } from '@/types';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { IconButton } from '@mui/material';
import { type ChangeEvent, type Dispatch, type SetStateAction, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '../ui';

interface MenuState {
  itemMap: Map<UniqueIdentifier, string>;
  nodes: TreeNode[];
  page: string;
}

/**
 * 新規のフォルダIDを作成する
 */
const generateNewFolderId = (nodes: TreeNode[], pathname: string) => {
  const prefixMap = {
    gallery: 'GF',
    memo: 'MF',
    project: 'PF',
  };
  const prefix = prefixMap[pathname as 'gallery' | 'memo' | 'project'];
  let maxNumber = 0;
  for (const node of nodes) {
    if (node.type !== 'folder' || typeof node.id !== 'string') continue;
    const [, numberStr] = node.id.split('-');
    const num = Number.parseInt(numberStr, 10);
    if (!Number.isNaN(num)) {
      maxNumber = Math.max(maxNumber, num);
    }
  }
  return `${prefix}-${String(maxNumber + 1)}`;
};

interface DrawerMenuHeaderProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  setIsUpdate: Dispatch<SetStateAction<boolean>>;
}

export const DrawerMenuHeader = ({ onChange, setIsUpdate }: DrawerMenuHeaderProps) => {
  const pathname = useLocation().pathname.split('/')[1];
  const memoMenu = useAppSelector(selectMemoMenu);
  const projectMenu = useAppSelector(selectProjectMenu);
  const galleryMenu = useAppSelector(selectGalleryMenu);
  const { createFolder, createItem } = useSaveMenu();

  const menu = useMemo<MenuState | null>(() => {
    switch (pathname) {
      case 'gallery': {
        if (!galleryMenu) return null;
        return { page: 'ギャラリー', ...galleryMenu };
      }
      case 'memo': {
        if (!memoMenu) return null;
        return { page: 'メモ', ...memoMenu };
      }
      case 'project': {
        if (!projectMenu) return null;
        return { page: 'プロジェクト', ...projectMenu };
      }
      default: {
        return null;
      }
    }
  }, [pathname, memoMenu, projectMenu, galleryMenu]);

  /**
   * 新規フォルダの作成
   */
  const handleCreateFolder = useCallback(() => {
    if (!menu) return;
    const newFolderId = generateNewFolderId(menu.nodes, pathname);
    if (!newFolderId) return;
    const noCategory = menu.nodes.find(n => n.id === 'noCategory');
    const topLevelCount = menu.nodes.filter(n => n.parentId === null).length;
    const sort = noCategory?.sort ?? topLevelCount;
    createFolder({
      folderId: newFolderId,
      pathname,
      sort,
    })
      .then(response => {
        if (!response) return;
        setTimeout(() => {
          setIsUpdate(true);
        }, 100);
      })
      .catch(() => {
        console.error('フォルダの追加に失敗しました');
      });
  }, [menu, pathname, createFolder, setIsUpdate]);

  /**
   * 新規アイテムの作成
   */
  const handleCreateItem = useCallback(() => {
    if (!menu) return;
    const noCategoryItems = menu.nodes.filter(n => n.parentId === 'noCategory');
    const maxSort = noCategoryItems.length > 0 ? Math.max(...noCategoryItems.map(n => n.sort)) : -1;
    const sort = maxSort + 1;
    createItem({
      page: menu.page,
      pathname,
      sort,
    })
      .then(response => {
        if (!response) return;
        setTimeout(() => {
          setIsUpdate(true);
        }, 100);
      })
      .catch(() => {
        console.error('アイテムの追加に失敗しました');
      });
  }, [menu, pathname, createItem, setIsUpdate]);

  return (
    <>
      <IconButton
        aria-label="新規フォルダの追加"
        onClick={handleCreateFolder}
        size="small"
        sx={{
          flexShrink: 0,
        }}
      >
        <Icon icon={ICONS.folderAdd} />
      </IconButton>
      <IconButton
        aria-label={`新規${menu ? menu.page : pathname}の追加`}
        onClick={handleCreateItem}
        size="small"
        sx={{
          flexShrink: 0,
        }}
      >
        <Icon icon={ICONS.fileAdd} />
      </IconButton>
      <input
        aria-label={`${menu ? menu.page : pathname}の絞り込み`}
        onChange={onChange}
        placeholder="検索..."
        style={{
          border: `solid 1px ${theme.palette.secondary.main}`,
          borderRadius: '3px',
          flexGrow: 1,
          flexShrink: 1,
          fontSize: '1rem',
          padding: '0.25rem',
          width: '50px',
        }}
        type="search"
      />
    </>
  );
};
