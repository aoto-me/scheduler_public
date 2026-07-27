import type { Folder, MenuItem, MenuItemOrder, Project, Section, Table, TreeNode } from '@/types';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { JSONContent } from '@tiptap/core';
import type { RootState } from '../store';

export interface ProjectGroup {
  fetched: boolean;
  project: Project;
  table: {
    data: null | Table;
    fetched: boolean;
  };
}

export interface ProjectState {
  data: Record<number, ProjectGroup | undefined>;
  fetched: {
    section: boolean;
  };
  invalidId: number[];
  menu: {
    fetched: boolean;
    folder: Record<string, Folder | undefined>;
    item: Record<number, MenuItem | undefined>;
    itemOrder: Record<string, MenuItemOrder[] | undefined>;
  };
  sections: Record<string, Section | undefined>; // Section の全件データ
  sectionsByProjectId: Record<number, string[]>; // ProjectId に紐づいたデータ
}

const initialState: ProjectState = {
  data: {},
  fetched: {
    section: false,
  },
  invalidId: [],
  menu: {
    fetched: false,
    folder: {},
    item: {},
    itemOrder: {},
  },
  sections: {},
  sectionsByProjectId: {},
};

export const projectSlice = createSlice({
  initialState,
  name: 'project',
  reducers: {
    /**
     * projectの追加
     */
    addProject: (state, action: PayloadAction<{ data: Project; itemOrder: MenuItemOrder }>) => {
      const { data, itemOrder } = action.payload;

      if (state.data[data.id]) return;
      state.data[data.id] = {
        fetched: true,
        project: data,
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

      // sectionsByProjectIdに追加
      const sectionsByProjectId = state.sectionsByProjectId;
      sectionsByProjectId[data.id] ??= [];
    },

    /**
     * フォルダの追加
     */
    addProjectFolder: (state, action: PayloadAction<Folder>) => {
      const folder = action.payload;
      if (state.menu.folder[folder.folderId]) return; // 既存のデータがあれば追加しない
      state.menu.folder[folder.folderId] = folder;
    },

    /**
     * テーブルの新規作成
     */
    addProjectTable: (state, action: PayloadAction<{ data: Table; id: number }>) => {
      const { data, id } = action.payload;

      // プロジェクトの本体がなれば終了
      if (!state.data[id]) return;

      const target = state.data[id];
      target.table = {
        data: data,
        fetched: true,
      };
    },

    /**
     * 新規セクションの追加
     */
    addSection: (state, action: PayloadAction<Section>) => {
      const section = action.payload;
      const { projectId, sectionId } = section;

      // sections に追加
      state.sections[sectionId] = section;

      // sectionsByProjectId に追加
      const projectSections = state.sectionsByProjectId[projectId] as string[] | undefined;

      if (projectSections) {
        if (!projectSections.includes(sectionId)) {
          projectSections.push(sectionId);
        }
      } else {
        state.sectionsByProjectId[projectId] = [sectionId];
      }
    },

    /**
     * プロジェクトの削除
     */
    removeProject: (state, action: PayloadAction<{ folderId: UniqueIdentifier; itemId: UniqueIdentifier }>) => {
      const { folderId, itemId } = action.payload;

      const projectId = Number(itemId);

      // sectionIds を state から取得
      const sectionIds = state.sectionsByProjectId[projectId] ?? [];

      // itemOrder から削除
      const folderKey = String(folderId);
      const folder = state.menu.itemOrder[folderKey];
      if (folder) {
        state.menu.itemOrder[folderKey] = folder.filter(item => item.itemId !== itemId);
      }

      // menu.item から削除
      delete state.menu.item[projectId];
      // sectionsByProjectId から削除
      delete state.sectionsByProjectId[projectId];
      // sections から削除
      for (const secId of sectionIds) {
        delete state.sections[secId];
      }
      // invalidIdに削除予定をのidをセット
      state.invalidId.push(projectId);
    },

    /**
     * フォルダの削除
     */
    removeProjectFolder: (state, action: PayloadAction<UniqueIdentifier>) => {
      const folderId = action.payload;

      // folder から除外
      delete state.menu.folder[folderId];
      // itemOrder から除外
      delete state.menu.itemOrder[folderId];
    },

    /***
     * invalidIdのページを削除
     */
    removeProjectInvalidId: (state, action: PayloadAction<number[]>) => {
      const ids = action.payload;

      for (const id of ids) {
        delete state.data[id];
      }

      state.invalidId = [];
    },

    /**
     * tableの削除
     */
    removeProjectTable: (state, action: PayloadAction<number>) => {
      const postId = action.payload;

      // projectの本体がなれば終了
      if (!state.data[postId]) return;

      const target = state.data[postId];
      target.table = {
        data: null,
        fetched: true,
      };
    },

    /**
     * セクションの削除
     */
    removeSection: (state, action: PayloadAction<{ projectId: number; sectionId: string }>) => {
      const { projectId, sectionId } = action.payload;

      // sectionsByProjectId から削除
      const projectSections = state.sectionsByProjectId[projectId] as string[] | undefined;
      if (projectSections) {
        state.sectionsByProjectId[projectId] = projectSections.filter(id => id !== sectionId);
      }
      // sections から削除
      delete state.sections[sectionId];
    },

    /**
     * projectデータの格納
     */
    setProjectData: (state, action: PayloadAction<Project>) => {
      const project = action.payload;

      state.data[project.id] = {
        fetched: true,
        project: {
          content: project.content,
          end: project.end,
          id: project.id,
          title: project.title,
        },
        table: {
          data: null,
          fetched: false,
        }, // プロジェクトデータの取得後にtableを取得するためこの時点ではnull
      };
    },

    /**
     * メニューデータの格納
     */
    setProjectMenu: (
      state,
      action: PayloadAction<{ folder: Folder[]; item: MenuItem[]; itemOrder: MenuItemOrder[] }>
    ) => {
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
    setProjectTableData: (state, action: PayloadAction<{ data: null | Table; id: number }>) => {
      const { data, id } = action.payload;

      // projectの本体がなれば終了
      if (!state.data[id]) return;

      const target = state.data[id];
      target.table = {
        data: data,
        fetched: true,
      };
    },

    /**
     * セクションデータの格納
     */
    setSectionData: (state, action: PayloadAction<Section[]>) => {
      const data = action.payload;

      for (const section of data) {
        const { projectId, sectionId } = section;

        state.sections[sectionId] = section;

        state.sectionsByProjectId[projectId] ??= [];

        // 登録されていなければ追加
        if (!state.sectionsByProjectId[projectId].includes(sectionId)) {
          state.sectionsByProjectId[projectId].push(sectionId);
        }
      }

      state.fetched.section = true;
    },

    /**
     * プロジェクトの締切を更新
     */
    updateProjectEnd: (state, action: PayloadAction<{ end: null | string; id: number }>) => {
      const { end, id } = action.payload;

      const project = state.data[id];
      if (project) project.project.end = end;
    },

    /**
     * フォルダ名を更新
     */
    updateProjectFolderName: (state, action: PayloadAction<{ folderId: string; name: string }>) => {
      const { folderId, name } = action.payload;

      const folder = state.menu.folder[folderId];
      if (folder) folder.name = name;
    },

    /**
     * 新規フォルダ追加時にnoCategoryの順番を更新
     */
    updateProjectFolderSort: (state, action: PayloadAction<{ id: string; sort: number }>) => {
      const { id, sort } = action.payload;

      const folder = state.menu.folder[id];
      if (folder) folder.sort = sort;
    },

    /**
     * メモを更新
     */
    updateProjectMemo: (state, action: PayloadAction<{ content: JSONContent | string; id: number }>) => {
      const { content, id } = action.payload;

      const project = state.data[id];
      if (project) project.project.content = content;
    },

    /**
     * テーブルの列の更新
     */
    updateProjectTableColumn: (state, action: PayloadAction<{ data: string; postId: number }>) => {
      const { data, postId } = action.payload;

      // projectの本体がなれば終了
      if (!state.data[postId]) return;

      const table = state.data[postId].table.data;
      if (!table) return;
      table.columnData = data;
    },

    /**
     * テーブルの行の更新
     */
    updateProjectTableRow: (state, action: PayloadAction<{ data: string; postId: number }>) => {
      const { data, postId } = action.payload;

      // projectの本体がなれば終了
      if (!state.data[postId]) return;

      const table = state.data[postId].table.data;
      if (!table) return;
      table.rowData = data;
    },

    /**
     * テーブルのサイズの更新
     */
    updateProjectTableSize: (
      state,
      action: PayloadAction<{ data: boolean; postId: number; target: 'height' | 'width' }>
    ) => {
      const { data, postId, target } = action.payload;

      // projectの本体がなれば終了
      if (!state.data[postId]) return;

      const table = state.data[postId].table.data;
      if (!table) return;
      table[target] = data;
    },

    /**
     * タイトルを更新
     */
    updateProjectTitle: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const { id, title } = action.payload;

      const project = state.data[id]?.project;
      if (project) project.title = title;

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
    updateProjectTreeSort: (state, action: PayloadAction<TreeNode[]>) => {
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

    /**
     * セクション名の更新
     */
    updateSectionName: (state, action: PayloadAction<{ name: string; sectionId: string }>) => {
      const { name, sectionId } = action.payload;

      const section = state.sections[sectionId];
      if (section) section.name = name;
    },

    /**
     * セクションの並び替え
     */
    updateSectionSort: (state, action: PayloadAction<{ projectId: number; sectionIds: string[] }>) => {
      const { projectId, sectionIds } = action.payload;

      // sectionsByProjectId の更新
      const isProject = state.sectionsByProjectId[projectId] as string[] | undefined;
      if (!isProject) return;
      state.sectionsByProjectId[projectId] = sectionIds; // 順番が保持されているので、そのまま上書き

      // sectionsの更新
      // sectionIds の順番に従って sort を更新
      for (const [index, sectionId] of sectionIds.entries()) {
        const section = state.sections[sectionId];
        if (section) section.sort = index + 1; // 1スタート
      }
    },
  },
});

export const {
  addProject,
  addProjectFolder,
  addProjectTable,
  addSection,
  removeProject,
  removeProjectFolder,
  removeProjectInvalidId,
  removeProjectTable,
  removeSection,
  setProjectData,
  setProjectMenu,
  setProjectTableData,
  setSectionData,
  updateProjectEnd,
  updateProjectFolderName,
  updateProjectFolderSort,
  updateProjectMemo,
  updateProjectTableColumn,
  updateProjectTableRow,
  updateProjectTableSize,
  updateProjectTitle,
  updateProjectTreeSort,
  updateSectionName,
  updateSectionSort,
} = projectSlice.actions;

export default projectSlice.reducer;

// 削除予定のid
export const selectProjectInvalidId = (state: RootState) => state.project.invalidId;

// メニューの取得状況
export const selectProjectMenuFetched = (state: RootState) => state.project.menu.fetched;

// projectTitleのMap
export const selectProjectTitleMap = createSelector([(state: RootState) => state.project.menu], state => {
  const { fetched, item } = state;
  if (!fetched) return null;

  const itemArray = Object.values(item).filter((i): i is MenuItem => !!i);
  const itemMap = new Map(itemArray.map(i => [i.id, i.title]));

  return itemMap;
});

// メニューで利用するデータを取得
export const selectProjectMenu = createSelector([(state: RootState) => state.project.menu], state => {
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

// postId で該当のProjectの内容を取得
export const selectProjectByPostId = createSelector(
  [(state: RootState) => state.project.data, (_: RootState, postId: number) => postId],
  (data, postId): { fetched: boolean; project: null | Project } => {
    if (!data[postId]) {
      return {
        fetched: false,
        project: null,
      };
    }
    return {
      fetched: data[postId].fetched,
      project: data[postId].project,
    };
  }
);

// postId で該当のテーブルの内容を取得
export const selectProjectTableByPostId = createSelector(
  [(state: RootState) => state.project.data, (_: RootState, postId: number) => postId],
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
export const selectProjectTitleByPostId = createSelector(
  [(state: RootState) => state.project.menu.item, (_: RootState, postId: number) => postId],
  (item, postId): null | string => (item[postId] ? item[postId].title : null)
);

// sectionの取得状況
export const selectSectionFetched = (state: RootState) => state.project.fetched.section;

// sectionMapを取得
export const selectSectionMap = (state: RootState) => state.project.sections;

// sectionsByProjectIdを取得
export const selectSectionsByProjectId = (state: RootState) => state.project.sectionsByProjectId;

// postId でsectionIds（並び替え済み）を取得
export const selectSectionIdsByPostId = createSelector(
  [(state: RootState) => state.project, (_: RootState, postId: number) => postId],
  (project, postId): string[] => {
    const { sections, sectionsByProjectId } = project;

    const sectionIds = sectionsByProjectId[postId] as string[] | undefined;
    if (!sectionIds || sectionIds.length === 0) return ['sec_0'];

    const sortedSectionIds = [...sectionIds].sort((a, b) => {
      const sortA = sections[a]?.sort ?? Infinity;
      const sortB = sections[b]?.sort ?? Infinity;
      return sortA - sortB;
    });

    return [...sortedSectionIds, 'sec_0'];
  }
);
