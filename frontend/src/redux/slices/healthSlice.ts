import type { Health, HealthCategory, HealthItem, HealthWithItem } from '@/types';
import { splitDate } from '@/utils';
import type { GridRowsProp } from '@mui/x-data-grid';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface HealthGroup {
  fetched: boolean;
  health: Record<number, Health | undefined>; // id をキーに Health を持つ
  healthItem: Record<number, HealthItem[] | undefined>; // healthIdに紐づいたデータ
  ids: number[]; // 登録されている id のリスト
}

export interface HealthState {
  data: Record<string, HealthGroup | undefined>;
  healthCategory: HealthCategory[] | null;
  map: Record<number, string | undefined>; // 逆引きマップ（id ⇒ yyyy-mm）
}

const initialState: HealthState = {
  data: {},
  healthCategory: null,
  map: {},
};

export const healthSlice = createSlice({
  initialState,
  name: 'health',
  reducers: {
    addHealth: (state, action: PayloadAction<{ health: Health; healthItem: HealthItem[] }>) => {
      const { health, healthItem } = action.payload;
      const key = health.date.slice(0, 7);

      state.data[key] ??= {
        fetched: false,
        health: {},
        healthItem: {},
        ids: [],
      };

      const group = state.data[key];

      // 既存のデータが存在しなければ、追加
      if (!group.health[health.id]) {
        group.health[health.id] = health;
        group.ids.push(health.id);
        group.healthItem[health.id] = healthItem;
        state.map[health.id] = key;
      }
    },

    addHealthCategory: (state, action: PayloadAction<HealthCategory>) => {
      state.healthCategory ??= [];
      if (!state.healthCategory.some(h => h.id === action.payload.id)) {
        state.healthCategory.push(action.payload);
      }
    },

    removeHealth: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const key = state.map[id];

      if (!key) return;

      const group = state.data[key];
      if (!group?.health[id]) return;

      // データの削除
      delete group.health[id];
      // idの削除
      group.ids = group.ids.filter(x => x !== id);
      // healthItemの削除
      delete group.healthItem[id];
      // mapの削除
      delete state.map[id];
    },

    removeHealthCategory: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.healthCategory) state.healthCategory = state.healthCategory.filter(h => h.id !== id);
    },

    setHealthCategory: (state, action: PayloadAction<HealthCategory[]>) => {
      state.healthCategory = action.payload;
    },

    // 1か月分のHealthデータを登録
    setHealthData: (
      state,
      action: PayloadAction<{
        health: Health[];
        healthItem: HealthItem[];
        key: string;
      }>
    ) => {
      const { health, healthItem, key } = action.payload;

      // key に対して丸ごと上書き
      state.data[key] = {
        fetched: true,
        health: health.reduce<Record<number, Health>>((acc, health) => {
          acc[health.id] = health;
          state.map[health.id] = key; // map の更新
          return acc;
        }, {}),
        healthItem: healthItem.reduce<Record<number, HealthItem[]>>((acc, item) => {
          acc[item.healthId] ??= [];
          acc[item.healthId].push(item);
          return acc;
        }, {}),
        ids: health.map(health => health.id), // ids の更新
      };
    },

    updateHealth: (state, action: PayloadAction<{ health: Health; healthItem: HealthItem[] }>) => {
      const { health, healthItem } = action.payload;
      const newKey = health.date.slice(0, 7);
      const oldKey = state.map[health.id];

      // 古いキーと違う場合は移動
      if (oldKey && oldKey !== newKey) {
        const oldGroup = state.data[oldKey];
        if (oldGroup) {
          const { [health.id]: _, ...rest } = oldGroup.health;
          oldGroup.health = rest;
          oldGroup.ids = oldGroup.ids.filter(id => id !== health.id);
          const { [health.id]: __, ...restRelated } = oldGroup.healthItem;
          oldGroup.healthItem = restRelated;
        }
      }

      // 新しいキーに追加/更新
      state.data[newKey] ??= {
        fetched: false,
        health: {},
        healthItem: {},
        ids: [],
      };

      const newGroup = state.data[newKey];

      if (!newGroup.health[health.id]) newGroup.ids.push(health.id); // idの追加
      newGroup.health[health.id] = health;
      newGroup.healthItem[health.id] = healthItem;
      state.map[health.id] = newKey; // map の更新
    },

    updateHealthCategory: (state, action: PayloadAction<HealthCategory>) => {
      if (state.healthCategory) {
        const index = state.healthCategory.findIndex(h => h.id === action.payload.id);
        if (index !== -1) state.healthCategory[index] = action.payload;
      }
    },
  },
});

export const {
  addHealth,
  addHealthCategory,
  removeHealth,
  removeHealthCategory,
  setHealthCategory,
  setHealthData,
  updateHealth,
  updateHealthCategory,
} = healthSlice.actions;

export default healthSlice.reducer;

export const selectHealthState = (state: RootState) => state.health.data;

export const selectHealthCategory = (state: RootState) => state.health.healthCategory;

// key(yyyy-mm) で該当月のデータの取得状況を取得
export const selectIsHealthFetchedForMonth = createSelector(
  [(state: RootState) => state.health.data, (_: RootState, key: string) => key],
  (data, key): boolean => {
    const group = data[key];
    if (!group) {
      return false;
    }

    return group.fetched;
  }
);

// key(yyyy-mm) で1か月分の HealthItem と Other の症状名を一意で取得
export const selectMonthlyHealthItemNames = createSelector(
  [(state: RootState) => state.health, (_: RootState, key: string) => key],
  (state, key): string[] => {
    const group = state.data[key];
    if (!group) return [];

    const health = group.health;
    const healthItems = group.healthItem;
    const healthCategory = state.healthCategory ?? [];

    // カテゴリーをMap化
    const healthCategoryMap = new Map(healthCategory.map(item => [item.id, item.name]));

    // healthItem の症状名を集める
    const healthItemList: string[] = [];
    for (const healthItem of Object.values(healthItems)) {
      if (!healthItem) continue;
      for (const item of healthItem) {
        const name = healthCategoryMap.get(item.categoryId);
        if (name) healthItemList.push(name);
      }
    }

    // Other（自由入力）分の症状名を集める
    const otherList = Object.values(health)
      .filter((h): h is Health => !!h && h.other.length > 0)
      .flatMap(h =>
        h.other
          .split(',')
          .map(text => text.trim())
          .filter(text => text !== '')
      );

    // 重複を排除して返す
    return [...new Set([...healthItemList, ...otherList])];
  }
);

// key(yyyy-mm) で1か月分の平均の調子を取得
export const selectMonthlyAverageMental = createSelector(
  [(state: RootState) => state.health.data, (_: RootState, key: string) => key],
  (
    data,
    key
  ): {
    average: number;
    icon: number;
  } => {
    const group = data[key];
    if (!group)
      return {
        average: 0,
        icon: 0,
      };

    const health = group.health;
    const healthData = Object.values(health).filter((d): d is Health => !!d);

    const totalMental = { count: 0, total: 0 };
    for (const item of healthData) {
      if (item.mental > 0) {
        totalMental.total += item.mental;
        totalMental.count += 1;
      }
    }

    const averageVal = totalMental.count > 0 ? totalMental.total / totalMental.count : 0;
    const formattedAverage = Math.round(averageVal * 100) / 100; // 小数点第二まで表示
    const iconNum = Math.trunc(formattedAverage); // iconを呼びだす用に整数値部分のみ取り出す
    return {
      average: formattedAverage,
      icon: iconNum,
    };
  }
);

// key(yyyy-mm) で1か月分の運動した日数を取得
export const selectMonthlyExerciseCount = createSelector(
  [(state: RootState) => state.health.data, (_: RootState, key: string) => key],
  (data, key): number => {
    const group = data[key];
    if (!group) return 0;

    const health = group.health;
    const healthData = Object.values(health).filter((d): d is Health => !!d);

    return healthData.filter(item => item.exercise === 1).length || 0;
  }
);

// key(yyyy-mm) で1か月分の GridRow用データ を取得
export const selectMonthlyHealthGridRows = createSelector(
  [(state: RootState) => state.health, (_: RootState, key: string) => key],
  (state, key): GridRowsProp | null => {
    const group = state.data[key];
    if (!group) return null;

    const health = group.health;
    const healthItems = group.healthItem;
    const healthCategory = state.healthCategory ?? [];

    // カテゴリーをMap化
    const healthCategoryMap = new Map(healthCategory.map(item => [item.id, item.name]));

    const rows: GridRowsProp = Object.values(health)
      .filter((d): d is Health => !!d)
      .map(data => {
        const itemsForId = healthItems[data.id] ?? [];
        const itemsListText = itemsForId
          .map(item => healthCategoryMap.get(item.categoryId))
          .filter((name): name is string => !!name)
          .join(', ');

        const itemString = [itemsListText, data.other].filter(Boolean).join(', ');

        return {
          ...data,
          date: new Date(data.date),
          exercise: data.exercise !== 0,
          item: itemString,
        };
      });

    return rows;
  }
);

// id で該当のデータを取得
export const selectHealthById = createSelector(
  [(state: RootState) => state.health, (_: RootState, id: number) => id],
  (state, id): { health: Health | null; healthItem: HealthItem[] } => {
    const emptyObj = { health: null, healthItem: [] };
    // idからkeyを逆引き
    const key = state.map[id];
    if (!key) return emptyObj;

    const group = state.data[key];
    if (!group) return emptyObj;

    const health = group.health[id];
    if (!health) return emptyObj;

    const item = group.healthItem[id] ?? [];

    return {
      health,
      healthItem: item,
    };
  }
);

// 全取得済みデータを HealthWithItem[] として取得
export const selectAllHealthDataWithItem = createSelector(
  [(state: RootState) => state.health],
  (state): HealthWithItem[] => {
    const healthCategory = state.healthCategory ?? [];
    const healthCategoryMap = new Map(healthCategory.map(c => [c.id, c.name]));

    const result: HealthWithItem[] = [];

    for (const group of Object.values(state.data)) {
      if (!group) continue;

      for (const health of Object.values(group.health).filter((h): h is Health => !!h)) {
        const items = group.healthItem[health.id] ?? [];

        const itemNames = [
          ...items.map(i => healthCategoryMap.get(i.categoryId) ?? '').filter(Boolean),
          ...health.other
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        ];

        result.push({
          ...health,
          item: itemNames,
        });
      }
    }

    return result;
  }
);

// Date で該当日のデータを HealthWithItem[] として取得
export const selectHealthDataWithItemByDay = createSelector(
  [(state: RootState) => state.health, (_: RootState, date: Date) => date],
  (state, date): HealthWithItem | null => {
    const { day, month, year } = splitDate(date);
    const key = `${year}-${month}`;
    const group = state.data[key];
    if (!group) return null;

    const health = group.health;
    const healthItems = group.healthItem;
    const healthCategory = state.healthCategory ?? [];

    // カテゴリーをMap化
    const healthCategoryMap = new Map(healthCategory.map(c => [c.id, c.name]));

    // 該当日のデータ
    const currentData = Object.values(health)
      .filter((h): h is Health => !!h)
      .find(data => data.date === `${year}-${month}-${day}`);
    if (!currentData) return null;

    const currentItem = healthItems[currentData.id] ?? [];

    // item + other
    const item = [
      ...currentItem.map(i => healthCategoryMap.get(i.categoryId) ?? '').filter(Boolean), // category がない場合を除外
      ...currentData.other
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    ];

    return {
      ...currentData,
      item,
    };
  }
);
