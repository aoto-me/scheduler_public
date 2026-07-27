import type { CardThumbnail, DiaryCard } from '@/types';
import { splitDate } from '@/utils';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface DiaryGroup {
  diary: Record<string, DiaryCard | undefined>; // yyyy-mm-dd をキーとする
  fetched: boolean;
  ids: number[]; // 登録されている id のリスト（日付順）
  thumbnail: Record<number, CardThumbnail>; // cardId をキーとする
}

export interface DiaryState {
  data: Record<string, DiaryGroup | undefined>; // yyyy-mm をキーとする
  map: Record<number, string | undefined>; // 逆引きマップ(cardId → yyyy-mm)
}

const initialState: DiaryState = {
  data: {},
  map: {},
};

export const diarySlice = createSlice({
  initialState,
  name: 'diary',
  reducers: {
    /**
     * Diaryの追加
     */
    addDiary: (state, action: PayloadAction<DiaryCard>) => {
      const diaryCard = action.payload;
      const key = diaryCard.date.slice(0, 7);

      state.data[key] ??= { diary: {}, fetched: false, ids: [], thumbnail: {} };

      const group = state.data[key];

      group.diary[diaryCard.date] ??= diaryCard;

      group.thumbnail[diaryCard.id] ??= {
        cardId: diaryCard.id,
        file: '',
      };

      state.map[diaryCard.id] = key; // mapの更新
      // idsを日付順で更新
      group.ids = Object.values(group.diary)
        .filter((c): c is DiaryCard => !!c)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(c => c.id);
    },

    /**
     * Diaryの削除
     */
    removeDiary: (state, action: PayloadAction<{ date: string; id: number }>) => {
      const { date, id } = action.payload;
      const key = date.slice(0, 7);

      const group = state.data[key];
      if (!group) return;

      if (group.diary[date]) {
        delete group.diary[date]; // diaryの削除
        group.ids = group.ids.filter(x => x !== id); // ids削除
        delete group.thumbnail[id]; // thumbnailの削除
        delete state.map[id]; // mapの削除
      }
    },

    /**
     * 1か月分のDiaryをまとめて登録
     */
    setDiaryData: (state, action: PayloadAction<{ data: DiaryCard[]; key: string; thumb: CardThumbnail[] }>) => {
      const { data, key, thumb } = action.payload;

      // 日付順にソート（昇順）
      const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const thumbnailRecord = data.reduce<Record<number, CardThumbnail>>((acc, diaryCard) => {
        acc[diaryCard.id] = {
          cardId: diaryCard.id,
          file: '',
        };
        return acc;
      }, {});
      // thumb があれば登録
      for (const t of thumb) {
        thumbnailRecord[t.cardId] = t;
      }

      // data[yyyy-mm] を丸ごと上書き
      state.data[key] = {
        diary: data.reduce<Record<string, DiaryCard>>((acc, diaryCard) => {
          acc[diaryCard.date] = diaryCard;
          state.map[diaryCard.id] = key; // map の更新
          return acc;
        }, {}),
        fetched: true,
        ids: sortedData.map(diaryCard => diaryCard.id), // ソート済みから id 抜き出し
        thumbnail: thumbnailRecord,
      };
    },

    /**
     * サムネイル画像の設定
     */
    setDiaryThumbnail: (
      state,
      action: PayloadAction<{
        file: string;
        id: number;
      }>
    ) => {
      const { file, id } = action.payload;
      const key = state.map[id];
      if (!key) return;

      const group = state.data[key];
      if (!group) return;

      const thumbnail = group.thumbnail[id];
      thumbnail.file = file; // サムネイルの入れ替え
    },

    /**
     * DiaryDataの更新
     */
    updateDiary: (
      state,
      action: PayloadAction<{
        date: string;
        id: number;
        target: 'title' | 'updated';
        title?: string;
        updated: string;
      }>
    ) => {
      const { date, id, target, title, updated } = action.payload;
      const key = date.slice(0, 7);

      if (!state.data[key]) return;

      const group = state.data[key];
      if (!group.diary[date]) return;

      // データがあり、id が一致したら上書き
      if (target === 'title' && title && group.diary[date].id === id) {
        group.diary[date].title = title;
        group.diary[date].updated = updated;
      }
      if (target === 'updated' && group.diary[date].id === id) {
        group.diary[date].updated = updated;
      }
    },

    /**
     * サムネイル名の更新
     */
    updateDiaryThumbnail: (
      state,
      action: PayloadAction<{
        id: number;
        newFile: string;
        oldFile: string;
      }>
    ) => {
      const { id, newFile, oldFile } = action.payload;
      const key = state.map[id];
      if (!key) return;

      const group = state.data[key];
      if (!group) return;

      const thumbnail = group.thumbnail[id];

      if (thumbnail.file === oldFile) {
        thumbnail.file = newFile;
      }
    },
  },
});

export const { addDiary, removeDiary, setDiaryData, setDiaryThumbnail, updateDiary, updateDiaryThumbnail } =
  diarySlice.actions;

export default diarySlice.reducer;

// 全てのデータを取得
export const selectDiaryState = (state: RootState) => state.diary.data;

// diaryCardMap：Map<number, DiaryCard> を作る
export const selectDiaryCardMapByMonth = createSelector(
  [(state: RootState) => state.diary.data, (_: RootState, key: string) => key],
  (data, key): Map<number, DiaryCard> | null => {
    const group = data[key];
    if (!group) return null;

    const diary = Object.values(group.diary).filter((e): e is DiaryCard => !!e);

    return new Map(diary.map(item => [item.id, item]));
  }
);

// key(yyyy-mm) で1か月分のデータを取得
export const selectDiaryCardByMonth = createSelector(
  [(state: RootState) => state.diary.data, (_: RootState, key: string) => key, selectDiaryCardMapByMonth],
  (
    data,
    key,
    diaryCardMap
  ): {
    cardMap: Map<number, DiaryCard> | null;
    fetched: boolean;
    ids: number[];
    thumbnailMap: Map<number, string> | null;
  } => {
    const group = data[key];
    if (!group || !diaryCardMap)
      return {
        cardMap: null,
        fetched: false,
        ids: [],
        thumbnailMap: null,
      };

    // thumbnail を Map に変換
    const thumbnailMap = new Map<number, string>(
      Object.entries(group.thumbnail).map(([cardId, value]) => [Number(cardId), value.file])
    );

    return {
      cardMap: diaryCardMap,
      fetched: group.fetched,
      ids: group.ids,
      thumbnailMap,
    };
  }
);

// id(subPage)で単体の DiaryCard を取得
export const selectDiaryCardById = createSelector(
  [
    selectDiaryCardMapByMonth, // diaryCardMap を利用
    (_: RootState, key: string) => key,
    (_: RootState, __: string, id: number) => id, // id(subPage)を受け取る
  ],
  (diaryCardMap, _key, id): DiaryCard | null => {
    if (!diaryCardMap) return null;
    return diaryCardMap.get(id) ?? null;
  }
);

// 全ての DiaryCard をフラットな配列で取得
export const selectAllDiaryCard = createSelector([(state: RootState) => state.diary.data], (data): DiaryCard[] => {
  const result: DiaryCard[] = [];

  for (const group of Object.values(data)) {
    if (!group) continue;
    const cards = Object.values(group.diary).filter((card): card is DiaryCard => !!card);
    result.push(...cards);
  }

  return result;
});

// Date で該当日のデータを取得
export const selectDiaryCardByDay = createSelector(
  [(state: RootState) => state.diary.data, (_: RootState, date: Date) => date],
  (data, date): DiaryCard | null => {
    const { day, month, year } = splitDate(date);
    const key = `${year}-${month}`;
    const group = data[key];
    if (!group) return null;

    const key2 = `${year}-${month}-${day}`;
    return group.diary[key2] ?? null;
  }
);
