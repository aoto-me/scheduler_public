import type { MonthlyMemo } from '@/types';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface MonthlyMemoState {
  monthlyMemo: Record<string, MonthlyMemo | null>; // yyyy-mm をキーとする
}

const initialState: MonthlyMemoState = {
  monthlyMemo: {},
};

export const monthlyMemoSlice = createSlice({
  initialState,
  name: 'monthlyMemo',
  reducers: {
    addMonthlyMemo: (state, action: PayloadAction<{ data: MonthlyMemo | null; key: string }>) => {
      const { data: memo, key } = action.payload;
      // 既存のデータが存在しなければ、追加
      state.monthlyMemo[key] ??= memo;
    },

    setMonthlyMemo: (state, action: PayloadAction<{ data: MonthlyMemo | null; key: string }>) => {
      const { data: memo, key } = action.payload;
      // 既存のデータが存在しなければ、追加
      state.monthlyMemo[key] ??= memo;
    },

    updateMonthlyMemo: (state, action: PayloadAction<{ data: MonthlyMemo | null; key: string }>) => {
      const { data: memo, key } = action.payload;
      // 既存のデータがあれば更新
      if (state.monthlyMemo[key]) state.monthlyMemo[key] = memo;
    },
  },
});

export const { addMonthlyMemo, setMonthlyMemo, updateMonthlyMemo } = monthlyMemoSlice.actions;

export default monthlyMemoSlice.reducer;

// 全てのMonthlyMemoを取得
export const selectMonthlyMemo = (state: RootState) => state.monthlyMemo.monthlyMemo;

// key(yyyy-mm) で該当月のMonthlyMemoを取得
export const selectMonthlyMemoByMonth = createSelector(
  [(state: RootState) => state.monthlyMemo.monthlyMemo, (_: RootState, key: string) => key],
  (monthlyMemo, key): MonthlyMemo | null => monthlyMemo[key]
);
