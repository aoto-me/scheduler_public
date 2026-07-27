import type { Folder, Memo, MenuItem, MenuItemOrder, Table, TreeNode } from '@/types';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { JSONContent } from '@tiptap/core';
import type { RootState } from '../store';

export interface MemoGroup {
  fetched: boolean;
  memo: Memo;
  table: {
    data: null | Table;
    fetched: boolean;
  };
}

export interface MemoState {
  data: Record<number, MemoGroup | undefined>;
  invalidId: number[]; // 次回のページ読み込み時に削除予定のid
  menu: {
    fetched: boolean;
    folder: Record<string, Folder | undefined>;
    item: Record<number, MenuItem | undefined>;
    itemOrder: Record<string, MenuItemOrder[] | undefined>;
  };
}

const initialState: MemoState = {
  data: {},
  invalidId: [],
  menu: {
    fetched: false,
    folder: {},
    item: {},
    itemOrder: {},
  },
};

export const memoSlice = createSlice({
  initialState,
  name: 'memo',
  reducers: {
    /**
     * メモの追加
     */
    addMemo: (state, action: PayloadAction<{ data: Memo; itemOrder: MenuItemOrder }>) => {
      const { data, itemOrder } = action.payload;

      if (state.data[data.id]) return;
      state.data[data.id] = {
        fetched: true,
        memo: data,
        table: {
          data: null,
          fetched: true,
        }, // tableは初期状態では未作成のためnull
      };

      // 対応するフォルダに itemOrder を追加
      const targetFolderId = itemOrder.folderId;
      const existing = state.menu.itemOrder[targetFolderId] ?? [];

      const exists = existing.some(item => item.itemId === itemOrder.itemId);
      if (!exists) {
        state.menu.itemOrder[targetFolderId] = [...existing, itemOrder].sort((a, b) => a.sort - b.sort);
      }

      const item = state.menu.item[data.id];
      if (!item) {
        state.menu.item[data.id] = {
          id: data.id,
          title: data.title,
        };
      }
    },

    /**
     * フォルダの追加
     */
    addMemoFolder: (state, action: PayloadAction<Folder>) => {
      const folder = action.payload;
      if (state.menu.folder[folder.folderId]) return; // 既存のデータがあれば追加しない
      state.menu.folder[folder.folderId] = folder;
    },

    // テーブルの新規作成
    addMemoTable: (state, action: PayloadAction<{ data: Table; id: number }>) => {
      const { data, id } = action.payload;

      // メモの本体がなれば終了
      if (!state.data[id]) return;

      const target = state.data[id];
      target.table = {
        data: data,
        fetched: true,
      };
    },

    /**
     * メモの削除
     */
    removeMemo: (state, action: PayloadAction<{ folderId: UniqueIdentifier; itemId: UniqueIdentifier }>) => {
      const { folderId, itemId } = action.payload;

      // itemOrder から除外
      const folder = state.menu.itemOrder[folderId];
      if (folder) {
        state.menu.itemOrder[folderId] = folder.filter(item => item.itemId !== itemId);
      }
      // itemから除外
      delete state.menu.item[Number(itemId)];
      // invalidIdに削除予定をのidをセット
      state.invalidId.push(Number(itemId));
    },

    /**
     * フォルダの削除
     */
    removeMemoFolder: (state, action: PayloadAction<UniqueIdentifier>) => {
      const folderId = action.payload;

      // folder から除外
      delete state.menu.folder[folderId];
      // itemOrder から除外
      delete state.menu.itemOrder[folderId];
    },

    /**
     * invalidIdのページを削除
     */
    removeMemoInvalidId: (state, action: PayloadAction<number[]>) => {
      const ids = action.payload;

      for (const id of ids) {
        delete state.data[id];
      }

      state.invalidId = [];
    },

    /**
     * tableの削除
     */
    removeMemoTable: (state, action: PayloadAction<number>) => {
      const postId = action.payload;

      // メモの本体がなれば終了
      if (!state.data[postId]) return;

      const target = state.data[postId];
      target.table = {
        data: null,
        fetched: true,
      };
    },

    /**
     * メモデータの格納
     */
    setMemoData: (state, action: PayloadAction<Memo>) => {
      const memo = action.payload;

      state.data[memo.id] = {
        fetched: true,
        memo: {
          content: memo.content,
          id: memo.id,
          title: memo.title,
        },
        table: {
          data: null,
          fetched: false,
        }, // メモデータの取得後にtableを取得するためこの時点ではnull
      };
    },

    /**
     * メニューデータの格納
     */
    setMemoMenu: (state, action: PayloadAction<{ folder: Folder[]; item: MenuItem[]; itemOrder: MenuItemOrder[] }>) => {
      const { folder, item, itemOrder } = action.payload;

      // Folder を sort 順で格納
      const sortedFolders = [...folder].sort((a, b) => a.sort - b.sort);
      state.menu.folder = {};
      for (const f of sortedFolders) {
        state.menu.folder[f.folderId] = f;
      }
      // ItemOrder を folderId ごとにグループ化
      const grouped: Record<UniqueIdentifier, MenuItemOrder[]> = {};
      for (const item of itemOrder) {
        grouped[item.folderId] ??= [];
        grouped[item.folderId].push(item);
      }
      // sort順に並び替え
      for (const folderId in grouped) {
        grouped[folderId] = grouped[folderId].sort((a, b) => a.sort - b.sort);
      }
      // key:id, val:MenuItem として格納
      for (const i of item) {
        state.menu.item[Number(i.id)] = i;
      }
      state.menu.itemOrder = grouped; // state を上書き
      state.menu.fetched = true;
    },

    /**
     * テーブルデータの格納
     */
    setMemoTableData: (state, action: PayloadAction<{ data: null | Table; id: number }>) => {
      const { data, id } = action.payload;

      // メモの本体がなれば終了
      if (!state.data[id]) return;

      const target = state.data[id];
      target.table = {
        data: data,
        fetched: true,
      };
    },

    /**
     * メモを更新
     */
    updateMemo: (state, action: PayloadAction<{ content: JSONContent | string; id: number }>) => {
      const { content, id } = action.payload;

      const memo = state.data[id];
      if (memo) memo.memo.content = content;
    },

    /**
     * フォルダ名を更新
     */
    updateMemoFolderName: (state, action: PayloadAction<{ folderId: string; name: string }>) => {
      const { folderId, name } = action.payload;

      const folder = state.menu.folder[folderId];
      if (folder) folder.name = name;
    },

    /**
     * 新規フォルダ追加時に noCategoryの順番 を更新
     */
    updateMemoFolderSort: (state, action: PayloadAction<{ id: string; sort: number }>) => {
      const { id, sort } = action.payload;

      const folder = state.menu.folder[id];
      if (folder) folder.sort = sort;
    },

    /**
     * テーブルの列の更新
     */
    updateMemoTableColumn: (state, action: PayloadAction<{ data: string; postId: number }>) => {
      const { data, postId } = action.payload;

      // メモの本体がなれば終了
      if (!state.data[postId]) return;

      const table = state.data[postId].table.data;
      if (!table) return;
      table.columnData = data;
    },

    /**
     * テーブルの行の更新
     */
    updateMemoTableRow: (state, action: PayloadAction<{ data: string; postId: number }>) => {
      const { data, postId } = action.payload;

      // メモの本体がなれば終了
      if (!state.data[postId]) return;

      const table = state.data[postId].table.data;
      if (!table) return;
      table.rowData = data;
    },

    /**
     * テーブルのサイズの更新
     */
    updateMemoTableSize: (
      state,
      action: PayloadAction<{ data: boolean; postId: number; target: 'height' | 'width' }>
    ) => {
      const { data, postId, target } = action.payload;

      // メモの本体がなれば終了
      if (!state.data[postId]) return;

      const table = state.data[postId].table.data;
      if (!table) return;
      table[target] = data;
    },

    /**
     * タイトルを更新
     */
    updateMemoTitle: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const { id, title } = action.payload;

      const memo = state.data[id]?.memo;
      if (memo) memo.title = title;

      const item = state.menu.item[id];
      if (item) {
        state.menu.item[id] = {
          id,
          title,
        };
      }
    },

    /**
     * ツリー全体の並び替えを一括更新
     */
    updateMemoTreeSort: (state, action: PayloadAction<TreeNode[]>) => {
      const nodes = action.payload;

      // フォルダの parentFolderId と sort を更新
      for (const node of nodes) {
        if (node.type === 'folder') {
          const folder = state.menu.folder[node.id as string];
          if (folder) {
            folder.sort = node.sort;
            folder.parentFolderId = node.parentId;
          }
        }
      }

      // itemOrder をアイテムノードから再構築
      const newItemOrder: Record<string, MenuItemOrder[]> = {};
      for (const node of nodes) {
        if (node.type === 'item') {
          const folderId = node.parentId === null ? 'noCategory' : String(node.parentId);
          newItemOrder[folderId] ??= [];
          newItemOrder[folderId].push({ folderId, itemId: node.id, sort: node.sort });
        }
      }
      state.menu.itemOrder = newItemOrder;
    },
  },
});

export const {
  addMemo,
  addMemoFolder,
  addMemoTable,
  removeMemo,
  removeMemoFolder,
  removeMemoInvalidId,
  removeMemoTable,
  setMemoData,
  setMemoMenu,
  setMemoTableData,
  updateMemo,
  updateMemoFolderName,
  updateMemoFolderSort,
  updateMemoTableColumn,
  updateMemoTableRow,
  updateMemoTableSize,
  updateMemoTitle,
  updateMemoTreeSort,
} = memoSlice.actions;

export default memoSlice.reducer;

// 削除予定のId
export const selectMemoInvalidId = (state: RootState) => state.memo.invalidId;

// メニューの取得状況
export const selectMemoMenuFetched = (state: RootState) => state.memo.menu.fetched;

// メニューで利用するデータを取得
export const selectMemoMenu = createSelector([(state: RootState) => state.memo.menu], state => {
  const { fetched, folder, item, itemOrder } = state;
  if (!fetched) return null;

  const itemArray = Object.values(item).filter((i): i is MenuItem => !!i);
  const itemMap = new Map(itemArray.map(i => [i.id, i.title]));

  const nodes: TreeNode[] = [];

  // フォルダノードを追加
  const folderArray = Object.values(folder).filter((f): f is Folder => !!f);
  for (const f of folderArray) {
    nodes.push({
      id: f.folderId,
      name: f.name,
      parentId: f.parentFolderId ?? null,
      sort: f.sort,
      type: 'folder',
    });
  }

  // アイテムノードを追加（itemOrder から構築）
  const allOrders = Object.values(itemOrder)
    .flat()
    .filter((o): o is MenuItemOrder => !!o);
  for (const order of allOrders) {
    const itemData = item[Number(order.itemId)];
    if (!itemData) continue;
    nodes.push({
      id: order.itemId,
      name: itemData.title,
      parentId: order.folderId,
      sort: order.sort,
      type: 'item',
    });
  }

  return { itemMap, nodes };
});

// postId で該当のメモの内容を取得
export const selectMemoByPostId = createSelector(
  [(state: RootState) => state.memo.data, (_: RootState, postId: number) => postId],
  (data, postId): { fetched: boolean; memo: Memo | null } => {
    if (!data[postId]) {
      return {
        fetched: false,
        memo: null,
      };
    }
    return {
      fetched: data[postId].fetched,
      memo: data[postId].memo,
    };
  }
);

// postId で該当のテーブルの内容を取得
export const selectMemoTableByPostId = createSelector(
  [(state: RootState) => state.memo.data, (_: RootState, postId: number) => postId],
  (data, postId): { fetched: boolean; table: null | Table } => {
    if (!data[postId]) {
      return {
        fetched: false,
        table: null,
      };
    }
    return {
      fetched: data[postId].table.fetched,
      table: data[postId].table.data,
    };
  }
);

// postId で該当のメモのタイトルを取得
export const selectMemoTitleByPostId = createSelector(
  [(state: RootState) => state.memo.menu.item, (_: RootState, postId: number) => postId],
  (item, postId): null | string => (item[postId] ? item[postId].title : null)
);
