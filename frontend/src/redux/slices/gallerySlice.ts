import type {
  CardThumbnail,
  Folder,
  GalleryCard,
  GalleryTypeWithNull,
  ImageItem,
  MenuItem,
  MenuItemOrder,
  TreeNode,
} from '@/types';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface GalleryCardContent {
  card: Record<number, GalleryCard>;
  fetched: boolean;
  ids: number[]; // sort済みID配列
  thumbnail: Record<number, string>; // cardId → ファイル名（空文字=""はサムネイルなし）
}

export interface GalleryGroup {
  cardContent?: GalleryCardContent;
  fetched: boolean; // typeの取得確認
  imgContent?: GalleryImgContent;
  type: GalleryTypeWithNull;
}

export interface GalleryImgContent {
  fetched: boolean;
  ids: number[]; // sort済みID配列
  item: Record<number, ImageItem>;
}

export interface GalleryState {
  data: Record<number, GalleryGroup | undefined>;
  invalidId: number[]; // 次回のページ読み込み時に削除予定のid
  menu: {
    fetched: boolean;
    folder: Record<string, Folder | undefined>;
    item: Record<number, MenuItem | undefined>;
    itemOrder: Record<string, MenuItemOrder[] | undefined>;
  };
}

const initialState: GalleryState = {
  data: {},
  invalidId: [],
  menu: {
    fetched: false,
    folder: {},
    item: {},
    itemOrder: {},
  },
};

export const gallerySlice = createSlice({
  initialState,
  name: 'gallery',
  reducers: {
    /**
     * ギャラリーの新規追加
     */
    addGallery: (state, action: PayloadAction<{ data: { id: number; title: string }; itemOrder: MenuItemOrder }>) => {
      const { data, itemOrder } = action.payload;

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
     * カードの追加
     */
    addGalleryCard: (state, action: PayloadAction<{ card: GalleryCard }>) => {
      const { card } = action.payload;
      const content = state.data[card.galleryId]?.cardContent;
      if (!content) return;
      content.ids.push(card.id);
      content.card[card.id] = card;
      content.thumbnail[card.id] = '';
    },

    /**
     * フォルダの追加
     */
    addGalleryFolder: (state, action: PayloadAction<Folder>) => {
      const folder = action.payload;
      if (state.menu.folder[folder.folderId]) return; // 既存のデータがあれば追加しない
      state.menu.folder[folder.folderId] = folder;
    },

    /**
     * 画像アイテムの追加
     */
    addGalleryItem: (state, action: PayloadAction<{ galleryId: number; item: ImageItem }>) => {
      const { galleryId, item } = action.payload;
      const content = state.data[galleryId]?.imgContent;
      if (!content) return;
      content.ids.push(item.id);
      content.item[item.id] = item;
    },

    /**
     * ギャラリーの削除
     */
    removeGallery: (state, action: PayloadAction<{ folderId: UniqueIdentifier; itemId: UniqueIdentifier }>) => {
      const { folderId, itemId } = action.payload;

      // itemOrder から除外
      const folder = state.menu.itemOrder[folderId];
      if (folder) {
        state.menu.itemOrder[folderId] = folder.filter(item => item.itemId !== itemId);
      }
      // itemから除外
      delete state.menu.item[Number(itemId)];
      // invalidIdに削除予定のidをセット
      state.invalidId.push(Number(itemId));
    },

    removeGalleryCard: (state, action: PayloadAction<{ cardId: number; galleryId: number }>) => {
      const { cardId, galleryId } = action.payload;
      const content = state.data[galleryId]?.cardContent;
      if (!content) return;
      content.ids = content.ids.filter(id => id !== cardId);
      delete content.card[cardId];
      delete content.thumbnail[cardId];
    },

    /**
     * フォルダの削除
     */
    removeGalleryFolder: (state, action: PayloadAction<UniqueIdentifier>) => {
      const folderId = action.payload;

      // folder から除外
      delete state.menu.folder[folderId];
      // itemOrder から除外
      delete state.menu.itemOrder[folderId];
    },

    /**
     * 画像アイテムの削除
     */
    removeGalleryItem: (state, action: PayloadAction<{ galleryId: number; itemId: number }>) => {
      const { galleryId, itemId } = action.payload;
      const content = state.data[galleryId]?.imgContent;
      if (!content) return;
      content.ids = content.ids.filter(id => id !== itemId);
      delete content.item[itemId];
    },

    /**
     * 画像アイテムのリネーム
     */
    renameGalleryItem: (
      state,
      action: PayloadAction<{ galleryId: number; itemId: number; name: string; url: string }>
    ) => {
      const { galleryId, itemId, name, url } = action.payload;
      const content = state.data[galleryId]?.imgContent;
      if (!content) return;
      const item = content.item[itemId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!item) return;
      item.name = name;
      item.url = url;
    },

    /**
     * 取得したカードの格納
     */
    setGalleryCardContent: (
      state,
      action: PayloadAction<{ cards: GalleryCard[]; galleryId: number; thumbs: CardThumbnail[] }>
    ) => {
      const { cards, galleryId, thumbs } = action.payload;
      const group = state.data[galleryId];
      if (!group) return;
      const cardRecord: Record<number, GalleryCard> = {};
      for (const c of cards) {
        cardRecord[c.id] = c;
      }
      const thumbnailRecord: Record<number, string> = {};
      for (const c of cards) {
        thumbnailRecord[c.id] = '';
      }
      for (const thumb of thumbs) {
        thumbnailRecord[thumb.cardId] = thumb.file;
      }
      group.cardContent = {
        card: cardRecord,
        fetched: true,
        ids: cards.map(c => c.id),
        thumbnail: thumbnailRecord,
      };
    },

    /**
     * 取得した画像の格納
     */
    setGalleryImgContent: (state, action: PayloadAction<{ galleryId: number; items: ImageItem[] }>) => {
      const { galleryId, items } = action.payload;
      const itemRecord: Record<number, ImageItem> = {};
      for (const item of items) {
        itemRecord[item.id] = item;
      }
      const group = state.data[galleryId];
      if (!group) return;
      group.imgContent = {
        fetched: true,
        ids: items.map(item => item.id),
        item: itemRecord,
      };
    },

    /**
     * メニューデータの格納
     */
    setGalleryMenu: (
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

      state.menu.itemOrder = grouped;
      state.menu.fetched = true;
    },

    /**
     * typeの格納
     */
    setGalleryType: (state, action: PayloadAction<{ id: number; type: GalleryTypeWithNull }>) => {
      const { id, type } = action.payload;
      state.data[id] = {
        ...state.data[id],
        fetched: true,
        type,
      };
    },

    /**
     * カードの並び替え
     */
    sortGalleryCards: (state, action: PayloadAction<{ galleryId: number; ids: number[] }>) => {
      const { galleryId, ids } = action.payload;
      const content = state.data[galleryId]?.cardContent;
      if (!content) return;
      content.ids = ids;
    },

    /**
     * 画像の並び替え
     */
    sortGalleryItems: (state, action: PayloadAction<{ galleryId: number; ids: number[] }>) => {
      const { galleryId, ids } = action.payload;
      const content = state.data[galleryId]?.imgContent;
      if (!content) return;
      content.ids = ids;
    },

    /**
     * カードの日付の更新
     */
    updateGalleryCardDate: (
      state,
      action: PayloadAction<{ cardId: number; date: null | string; galleryId: number; updated: string }>
    ) => {
      const { cardId, date, galleryId, updated } = action.payload;
      const content = state.data[galleryId]?.cardContent;
      if (!content) return;
      const card = content.card[cardId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!card) return;
      card.date = date;
      card.updated = updated;
    },

    /**
     * カードのサムネイルの設定
     */
    updateGalleryCardThumbnail: (state, action: PayloadAction<{ cardId: number; file: string; galleryId: number }>) => {
      const { cardId, file, galleryId } = action.payload;
      const content = state.data[galleryId]?.cardContent;
      if (!content) return;
      content.thumbnail[cardId] = file;
    },

    /**
     * カードタイトルの更新
     */
    updateGalleryCardTitle: (
      state,
      action: PayloadAction<{ cardId: number; galleryId: number; title: string; updated: string }>
    ) => {
      const { cardId, galleryId, title, updated } = action.payload;
      const content = state.data[galleryId]?.cardContent;
      if (!content) return;
      const card = content.card[cardId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!card) return;
      card.title = title;
      card.updated = updated;
    },

    /**
     * カードの更新日の更新
     */
    updateGalleryCardUpdated: (
      state,
      action: PayloadAction<{ cardId: number; galleryId: number; updated: string }>
    ) => {
      const { cardId, galleryId, updated } = action.payload;
      const content = state.data[galleryId]?.cardContent;
      if (!content) return;
      const card = content.card[cardId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!card) return;
      card.updated = updated;
    },

    /**
     * フォルダ名を更新
     */
    updateGalleryFolderName: (state, action: PayloadAction<{ folderId: string; name: string }>) => {
      const { folderId, name } = action.payload;

      const folder = state.menu.folder[folderId];
      if (folder) folder.name = name;
    },

    /**
     * 新規フォルダ追加時に noCategoryの順番 を更新
     */
    updateGalleryFolderSort: (state, action: PayloadAction<{ id: string; sort: number }>) => {
      const { id, sort } = action.payload;

      const folder = state.menu.folder[id];
      if (folder) folder.sort = sort;
    },

    /**
     * タイトルを更新
     */
    updateGalleryTitle: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const { id, title } = action.payload;

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
    updateGalleryTreeSort: (state, action: PayloadAction<TreeNode[]>) => {
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

    // typeの更新
    updateGalleryType: (state, action: PayloadAction<{ id: number; type: GalleryTypeWithNull }>) => {
      const { id, type } = action.payload;
      if (state.data[id]) {
        state.data[id].type = type;
      }
    },
  },
});

export const {
  addGallery,
  addGalleryCard,
  addGalleryFolder,
  addGalleryItem,
  removeGallery,
  removeGalleryCard,
  removeGalleryFolder,
  removeGalleryItem,
  renameGalleryItem,
  setGalleryCardContent,
  setGalleryImgContent,
  setGalleryMenu,
  setGalleryType,
  sortGalleryCards,
  sortGalleryItems,
  updateGalleryCardDate,
  updateGalleryCardThumbnail,
  updateGalleryCardTitle,
  updateGalleryCardUpdated,
  updateGalleryFolderName,
  updateGalleryFolderSort,
  updateGalleryTitle,
  updateGalleryTreeSort,
  updateGalleryType,
} = gallerySlice.actions;

export default gallerySlice.reducer;

// 削除予定のid
export const selectGalleryInvalidId = (state: RootState) => state.gallery.invalidId;

// メニューの取得状況
export const selectGalleryMenuFetched = (state: RootState) => state.gallery.menu.fetched;

// メニューで利用するデータを取得
export const selectGalleryMenu = createSelector([(state: RootState) => state.gallery.menu], state => {
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

// postId で該当の galleryのタイトル を取得
export const selectGalleryTitleByPostId = createSelector(
  [(state: RootState) => state.gallery.menu.item, (_: RootState, postId: number) => postId],
  (item, postId): null | string => (item[postId] ? item[postId].title : null)
);

// postId で該当のギャラリーのtypeを取得
export const selectGalleryTypeByPostId = createSelector(
  [(state: RootState) => state.gallery.data, (_: RootState, postId: number) => postId],
  (data, postId): { fetched: boolean; type: GalleryTypeWithNull } => {
    if (!data[postId]) {
      return {
        fetched: false,
        type: null,
      };
    }
    return {
      fetched: data[postId].fetched,
      type: data[postId].type,
    };
  }
);

// postId で img型ギャラリーの画像一覧を取得
export const selectGalleryImgByPostId = createSelector(
  [(state: RootState) => state.gallery.data, (_: RootState, postId: number) => postId],
  (data, postId): { fetched: boolean; ids: number[]; itemMap: Map<number, ImageItem> } => {
    const content = data[postId]?.imgContent;
    if (!content) return { fetched: false, ids: [], itemMap: new Map() };
    return {
      fetched: content.fetched,
      ids: content.ids,
      itemMap: new Map(Object.entries(content.item).map(([k, v]) => [Number(k), v])),
    };
  }
);

// postId で card型ギャラリーのカード一覧を取得
export const selectGalleryCardByPostId = createSelector(
  [(state: RootState) => state.gallery.data, (_: RootState, postId: number) => postId],
  (
    data,
    postId
  ): { cardMap: Map<number, GalleryCard>; fetched: boolean; ids: number[]; thumbnailMap: Map<number, string> } => {
    const content = data[postId]?.cardContent;
    if (!content) return { cardMap: new Map(), fetched: false, ids: [], thumbnailMap: new Map() };
    return {
      cardMap: new Map(Object.entries(content.card).map(([k, v]) => [Number(k), v])),
      fetched: content.fetched,
      ids: content.ids,
      thumbnailMap: new Map(Object.entries(content.thumbnail).map(([k, v]) => [Number(k), v])),
    };
  }
);

// postId + cardId で単体の GalleryCard を取得（subPage用）
export const selectGalleryCardById = createSelector(
  [
    (state: RootState) => state.gallery.data,
    (_: RootState, postId: number) => postId,
    (_: RootState, __: number, cardId: number) => cardId,
  ],
  (data, postId, cardId): GalleryCard | null => {
    return data[postId]?.cardContent?.card[cardId] ?? null;
  }
);
