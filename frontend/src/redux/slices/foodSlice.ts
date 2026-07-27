import type { AllFoodTotal, Food, FoodDB, Nutrition } from '@/types';
import { splitDate } from '@/utils';
import type { GridRowsProp } from '@mui/x-data-grid';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface FoodGroup {
  fetched: boolean;
  food: Record<number, Food | undefined>; // id をキーに Food を持つ
  ids: number[]; // 登録されている id のリスト
}

export interface FoodState {
  data: Record<string, FoodGroup | undefined>; // yyyy-mm をキーとする
  foodDB: FoodDB[] | null;
  foodDBStandard: FoodDB[] | null;
  map: Record<number, string | undefined>; // 逆引きマップ（id ⇒ yyyy-mm）
  nutrition: null | Nutrition[];
}

const initialState: FoodState = {
  data: {},
  foodDB: null,
  foodDBStandard: null,
  map: {},
  nutrition: null,
};

export const foodSlice = createSlice({
  initialState,
  name: 'food',
  reducers: {
    addFood: (state, action: PayloadAction<Food>) => {
      const food = action.payload;
      const key = food.date.slice(0, 7);

      state.data[key] ??= { fetched: false, food: {}, ids: [] };

      const group = state.data[key];

      // 既存のデータが存在しなければ、追加
      if (!group.food[food.id]) {
        group.food[food.id] = food;
        group.ids.push(food.id);
        state.map[food.id] = key; // map も更新
      }
    },

    addFoodDB: (state, action: PayloadAction<FoodDB>) => {
      state.foodDB ??= [];
      if (!state.foodDB.some(f => f.id === action.payload.id)) {
        state.foodDB.push(action.payload);
      }
    },

    removeFood: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const key = state.map[id];

      if (!key) return;

      const group = state.data[key];
      if (!group?.food[id]) return;

      // foodから削除
      delete group.food[id];
      // idsから削除
      group.ids = group.ids.filter(i => i !== id);
      // mapから削除
      delete state.map[id];
    },

    removeFoodDB: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.foodDB) state.foodDB = state.foodDB.filter(h => h.id !== id);
    },

    /**
     * 1か月分の Foodデータ を登録
     */
    setFoodData: (state, action: PayloadAction<{ data: Food[]; key: string }>) => {
      const { data, key } = action.payload;
      // key に対して丸ごと上書き
      state.data[key] = {
        fetched: true,
        food: data.reduce<Record<number, Food>>((acc, food) => {
          acc[food.id] = food;
          state.map[food.id] = key; // Mapに登録
          return acc;
        }, {}),
        ids: data.map(food => food.id),
      };
    },

    setFoodDB: (state, action: PayloadAction<FoodDB[]>) => {
      state.foodDB = action.payload;
    },

    setFoodDBStandard: (state, action: PayloadAction<FoodDB[]>) => {
      state.foodDBStandard = action.payload;
    },

    setNutrition: (state, action: PayloadAction<Nutrition[]>) => {
      state.nutrition = action.payload;
    },

    updateFood: (state, action: PayloadAction<Food>) => {
      const food = action.payload;
      const newKey = food.date.slice(0, 7);
      const oldKey = state.map[food.id];

      // 古いキーと違う場合は移動
      if (oldKey && oldKey !== newKey) {
        const oldGroup = state.data[oldKey];
        if (oldGroup) {
          const { [food.id]: _, ...rest } = oldGroup.food;
          oldGroup.food = rest;
          oldGroup.ids = oldGroup.ids.filter(id => id !== food.id);
        }
      }

      // 新しいキーに追加/更新
      state.data[newKey] ??= { fetched: false, food: {}, ids: [] };

      const newGroup = state.data[newKey];

      if (!newGroup.food[food.id]) newGroup.ids.push(food.id); // idの追加
      newGroup.food[food.id] = food;
      state.map[food.id] = newKey; // map の更新
    },

    updateFoodDB: (state, action: PayloadAction<FoodDB>) => {
      if (state.foodDB) {
        const index = state.foodDB.findIndex(f => f.id === action.payload.id);
        if (index !== -1) state.foodDB[index] = action.payload;
      }
    },

    updateNutrition: (state, action: PayloadAction<Nutrition>) => {
      if (state.nutrition) {
        const index = state.nutrition.findIndex(f => f.id === action.payload.id);
        if (index !== -1) state.nutrition[index] = action.payload;
      }
    },
  },
});

export const {
  addFood,
  addFoodDB,
  removeFood,
  removeFoodDB,
  setFoodData,
  setFoodDB,
  setFoodDBStandard,
  setNutrition,
  updateFood,
  updateFoodDB,
  updateNutrition,
} = foodSlice.actions;

export default foodSlice.reducer;

export const selectFoodState = (state: RootState) => state.food.data;

export const selectFoodDB = (state: RootState) => state.food.foodDB;

export const selectFoodDBStandard = (state: RootState) => state.food.foodDBStandard;

export const selectNutrition = (state: RootState) => state.food.nutrition;

// 全ての foodDB をMapで取得（キー：エイリアス名 → FoodDB）
export const selectAllFoodDBMap = createSelector(
  [(state: RootState) => state.food.foodDB, (state: RootState) => state.food.foodDBStandard],
  (foodDB, foodDBStandard): Map<string, FoodDB> => {
    const map = new Map<string, FoodDB>();
    // 標準食品DBのエイリアスを展開（alias → FoodDB）
    for (const item of foodDBStandard ?? []) {
      for (const keyword of item.keywords) {
        map.set(keyword, item);
      }
    }
    // APIから取得したFoodDBは正式名でそのまま登録
    for (const item of foodDB ?? []) {
      map.set(item.name, item);
    }
    return map;
  }
);

// key(yyyy-mm) で該当月のデータの取得状況を取得
export const selectIsFoodFetchedForMonth = createSelector(
  [(state: RootState) => state.food.data, (_: RootState, key: string) => key],
  (data, key): boolean => {
    const group = data[key];
    if (!group) {
      return false;
    }

    return group.fetched;
  }
);

// key(yyyy-mm) で1か月分の 合計値 と 平均値 を取得
interface foodAverage {
  average: {
    carb: number;
    energy: number;
    fat: number;
    protein: number;
    salt: number;
  };
  total: {
    carb: number;
    energy: number;
    fat: number;
    protein: number;
    salt: number;
  };
}

export const selectFoodAverageAndTotalByMonth = createSelector(
  [(state: RootState) => state.food.data, (_: RootState, key: string) => key],
  (data, key): foodAverage => {
    const group = data[key];
    if (!group)
      return {
        average: {
          carb: 0,
          energy: 0,
          fat: 0,
          protein: 0,
          salt: 0,
        },
        total: {
          carb: 0,
          energy: 0,
          fat: 0,
          protein: 0,
          salt: 0,
        },
      };

    const foods = group.food;
    const food = Object.values(foods).filter((f): f is Food => !!f);

    // データのある日数
    const uniqueDate = new Set(food.map(item => item.date));
    const days = uniqueDate.size || 1; // 0除算回避

    // 合計と平均を算出
    const total = food.reduce(
      (acc, item) => ({
        carb: acc.carb + (item.carb ?? 0),
        energy: acc.energy + item.energy,
        fat: acc.fat + (item.fat ?? 0),
        protein: acc.protein + (item.protein ?? 0),
        salt: acc.salt + (item.salt ?? 0),
      }),
      { carb: 0, energy: 0, fat: 0, protein: 0, salt: 0 }
    );

    const average = Object.fromEntries(
      Object.entries(total).map(([key, value]) => [key, Math.round((value / days) * 10) / 10 || 0])
    ) as typeof total;

    return { average, total };
  }
);

// key(yyyy-mm) で1か月分の GridRow用データ を取得
export const selectMonthlyFoodGridRows = createSelector(
  [(state: RootState) => state.food.data, (_: RootState, key: string) => key],
  (data, key): GridRowsProp | null => {
    const group = data[key];
    if (!group) return null;

    const food = group.food;

    const rows = Object.values(food)
      .filter((f): f is Food => !!f)
      .map(data => ({
        ...data,
        date: new Date(data.date),
      }));

    return rows;
  }
);

// id のデータを取得
export const selectFoodById = createSelector(
  [(state: RootState) => state.food, (_: RootState, id: number) => id],
  (state, id): Food | null => {
    // idからkeyを逆引き
    const key = state.map[id];
    if (!key) return null;

    const group = state.data[key];
    if (!group) return null;

    const food = group.food[id];
    if (!food) return null;

    return food;
  }
);

// Date で該当日のデータを取得
export const selectFoodByDay = createSelector(
  [(state: RootState) => state.food.data, (_: RootState, date: Date) => date],
  (data, date): Food[] | null => {
    const { day, month, year } = splitDate(date);
    const key = `${year}-${month}`;
    const group = data[key];
    if (!group) return null;

    const entities = group.food;
    const food = Object.values(entities)
      .filter((f): f is Food => !!f)
      .filter(item => item.date === `${year}-${month}-${day}`);

    return food;
  }
);

// 全取得済みデータの日ごとの合計値を取得
export const selectAllFoodTotal = createSelector([(state: RootState) => state.food.data], (data): AllFoodTotal => {
  const result: AllFoodTotal = new Map();

  for (const group of Object.values(data)) {
    if (!group) continue;
    for (const food of Object.values(group.food).filter((f): f is Food => !!f)) {
      const { date } = food;

      if (!result.has(date)) {
        result.set(date, {
          carb: 0,
          energy: 0,
          fat: 0,
          protein: 0,
          salt: 0,
        });
      }

      const acc = result.get(date)!;
      if (food.energy) acc.energy += food.energy;
      if (food.protein) acc.protein += food.protein;
      if (food.fat) acc.fat += food.fat;
      if (food.carb) acc.carb += food.carb;
      if (food.salt) acc.salt += food.salt;
    }
  }

  // 四捨五入処理（小数点第1位まで）
  for (const [date, total] of result.entries()) {
    result.set(date, {
      carb: Math.round(total.carb * 10) / 10,
      energy: Math.round(total.energy * 10) / 10,
      fat: Math.round(total.fat * 10) / 10,
      protein: Math.round(total.protein * 10) / 10,
      salt: Math.round(total.salt * 10) / 10,
    });
  }

  return result;
});
