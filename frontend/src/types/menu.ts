import type { UniqueIdentifier } from '@dnd-kit/core';

/**
 * メニューのフォルダ
 */
export interface Folder {
  folderId: UniqueIdentifier;
  name: string;
  parentFolderId?: null | UniqueIdentifier;
  sort: number;
}

/**
 * メニューのページアイテム
 */
export interface MenuItem {
  id: UniqueIdentifier;
  title: string;
}

/**
 * メニューのページアイテムの並び順
 */
export interface MenuItemOrder {
  folderId: UniqueIdentifier;
  itemId: UniqueIdentifier;
  sort: number;
}

/**
 * Sortable Tree の統合ノード型
 */
export interface TreeNode {
  id: UniqueIdentifier;
  name: string;
  parentId: null | UniqueIdentifier;
  sort: number;
  type: 'folder' | 'item';
}
