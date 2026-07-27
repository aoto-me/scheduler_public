import type { RSSItem, RSSList, WebCSV } from '@/types';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface WebState {
  emptyRssList: RSSList[];
  errorWebCsv: WebCSV[];
  fetched: boolean;
  rssItems: Record<number, RSSItem[]>;
  rssList: null | RSSList[];
  updated: boolean; // 取得済みのち、更新フラグ
  webCsv: null | Record<string, WebCSV[]>;
}

const initialState: WebState = {
  emptyRssList: [],
  errorWebCsv: [],
  fetched: false,
  rssItems: {},
  rssList: null,
  updated: true,
  webCsv: null,
};

export const webSlice = createSlice({
  initialState,
  name: 'web',
  reducers: {
    addRssList: (state, action: PayloadAction<RSSList>) => {
      state.rssList ??= [];
      state.updated = true;
      if (!state.rssList.some(r => r.id === action.payload.id)) {
        state.rssList.push(action.payload);
      }
    },

    removeRssList: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      state.rssList ??= [];
      state.rssList = state.rssList.filter(r => r.id !== id);
    },

    setEmptyRssList: (state, action: PayloadAction<RSSList>) => {
      const exists = state.emptyRssList.some(item => item.id === action.payload.id);
      if (exists) return;
      state.emptyRssList.push(action.payload);
    },

    setRssItem: (state, action: PayloadAction<{ id: number; items: RSSItem[] }>) => {
      const { id, items } = action.payload;
      state.rssItems[id] = items;
    },

    setRssItemsFetched: (state, action: PayloadAction<boolean>) => {
      state.fetched = action.payload;
      state.updated = !action.payload;
    },

    setRssList: (state, action: PayloadAction<RSSList[]>) => {
      state.rssList = action.payload;
    },

    setWebCsv: (state, action: PayloadAction<{ data: Record<string, WebCSV[]>; error: WebCSV[] }>) => {
      const { data, error } = action.payload;
      state.webCsv = data;
      state.errorWebCsv = error;
    },

    updateRssList: (state, action: PayloadAction<RSSList>) => {
      state.rssList ??= [];
      state.updated = true;
      const index = state.rssList.findIndex(r => r.id === action.payload.id);
      if (index !== -1) state.rssList[index] = action.payload;
    },
  },
});

export const {
  addRssList,
  removeRssList,
  setEmptyRssList,
  setRssItem,
  setRssItemsFetched,
  setRssList,
  setWebCsv,
  updateRssList,
} = webSlice.actions;

export default webSlice.reducer;

export const selectWebState = (state: RootState) => state.web;

export const selectRssList = (state: RootState) => state.web.rssList;

// サイト別に取得したrssItemをバラして日付順に並び替え
export const selectSortedRssItems = createSelector(
  [(state: RootState) => state.web.rssItems],
  (rssItems): null | RSSItem[] => {
    const mergedSortedRssItems = Object.entries(rssItems)
      .flatMap(([_id, items]) => items.map(item => ({ ...item })))
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return mergedSortedRssItems;
  }
);
