import { ICONS } from '@/configs';
import type { BalanceByMonthly, BalanceByYear, ExpenseCategory, IncomeCategory, Money, PieChartData } from '@/types';
import { splitDate } from '@/utils';
import type { GridRowsProp } from '@mui/x-data-grid';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface MoneyGroup {
  fetched: boolean;
  ids: number[]; // 登録されている id のリスト
  money: Record<number, Money | undefined>; // id をキーに Money を持つ
}

export interface MoneyState {
  data: Record<string, MoneyGroup | undefined>; // yyyy-mm をキーとする
  expenseCategory: ExpenseCategory[] | null;
  incomeCategory: IncomeCategory[] | null;
  map: Record<number, string | undefined>; // 逆引きマップ（id ⇒ yyyy-mm）
}

const initialState: MoneyState = {
  data: {},
  expenseCategory: null,
  incomeCategory: null,
  map: {},
};

export const moneySlice = createSlice({
  initialState,
  name: 'money',
  reducers: {
    addMoney: (state, action: PayloadAction<Money>) => {
      const money = action.payload;
      const key = money.date.slice(0, 7);

      state.data[key] ??= { fetched: false, ids: [], money: {} };

      const group = state.data[key];

      // 既存のデータが存在しなければ、追加
      if (!group.money[money.id]) {
        group.money[money.id] = money;
        group.ids.push(money.id);
        state.map[money.id] = key;
      }
    },

    addMoneyCategory: (
      state,
      action: PayloadAction<{
        category: ExpenseCategory | IncomeCategory;
        type: 'expense' | 'income';
      }>
    ) => {
      const { category, type } = action.payload;
      if (type === 'expense') {
        state.expenseCategory ??= [];
        if (!state.expenseCategory.some(c => c.id === category.id)) {
          state.expenseCategory.push(category);
        }
      } else {
        state.incomeCategory ??= [];
        if (!state.incomeCategory.some(c => c.id === category.id)) {
          state.incomeCategory.push(category);
        }
      }
    },

    removeMoney: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const key = state.map[id];
      if (!key) return;

      const group = state.data[key];
      if (!group?.money[id]) return;

      // データの削除
      delete group.money[id];
      // idsの削除
      group.ids = group.ids.filter(x => x !== id);
      // mapの削除
      delete state.map[id];
    },

    removeMoneyCategory: (state, action: PayloadAction<{ id: number; type: 'expense' | 'income' }>) => {
      const { id, type } = action.payload;
      if (type === 'expense' && state.expenseCategory) {
        state.expenseCategory = state.expenseCategory.filter(c => c.id !== id);
      } else if (type === 'income' && state.incomeCategory) {
        state.incomeCategory = state.incomeCategory.filter(c => c.id !== id);
      }
    },

    setMoneyCategory: (
      state,
      action: PayloadAction<{
        data: ExpenseCategory[] | IncomeCategory[];
        type: 'expense' | 'income';
      }>
    ) => {
      const { data, type } = action.payload;
      if (type === 'expense') {
        state.expenseCategory = data;
      } else {
        state.incomeCategory = data;
      }
    },

    // 1か月分まとめて登録
    setMoneyData: (state, action: PayloadAction<{ data: Money[]; key: string }>) => {
      const { data, key } = action.payload;

      // key に対して丸ごと上書き
      state.data[key] = {
        fetched: true, // 取得済みフラグ
        ids: data.map(money => money.id), // idsの更新
        money: data.reduce<Record<number, Money>>((acc, money) => {
          acc[money.id] = money;
          state.map[money.id] = key; // map の更新
          return acc;
        }, {}),
      };
    },

    updateMoney: (state, action: PayloadAction<Money>) => {
      const money = action.payload;
      const newKey = money.date.slice(0, 7);
      const oldKey = state.map[money.id];

      // 古いキーと違う場合は移動
      if (oldKey && oldKey !== newKey) {
        const oldGroup = state.data[oldKey];
        if (oldGroup) {
          const { [money.id]: _, ...rest } = oldGroup.money;
          oldGroup.money = rest;
          oldGroup.ids = oldGroup.ids.filter(id => id !== money.id);
        }
      }

      // 新しいキーに追加/更新
      state.data[newKey] ??= { fetched: false, ids: [], money: {} };

      const newGroup = state.data[newKey];

      if (!newGroup.money[money.id]) newGroup.ids.push(money.id); // idの追加
      newGroup.money[money.id] = money;

      state.map[money.id] = newKey; // map の更新
    },

    updateMoneyCategory: (
      state,
      action: PayloadAction<{
        category: ExpenseCategory | IncomeCategory;
        type: 'expense' | 'income';
      }>
    ) => {
      const { category, type } = action.payload;
      if (type === 'expense' && state.expenseCategory) {
        const index = state.expenseCategory.findIndex(c => c.id === category.id);
        if (index !== -1) state.expenseCategory[index] = category;
      } else if (type === 'income' && state.incomeCategory) {
        const index = state.incomeCategory.findIndex(c => c.id === category.id);
        if (index !== -1) state.incomeCategory[index] = category;
      }
    },
  },
});

export const {
  addMoney,
  addMoneyCategory,
  removeMoney,
  removeMoneyCategory,
  setMoneyCategory,
  setMoneyData,
  updateMoney,
  updateMoneyCategory,
} = moneySlice.actions;

export default moneySlice.reducer;

export const selectMoneyState = (state: RootState) => state.money.data;

// カテゴリーを取得
export const selectMoneyCategories = createSelector(
  [(state: RootState) => state.money.expenseCategory, (state: RootState) => state.money.incomeCategory],
  (expenseCategory, incomeCategory) => ({
    expenseCategory,
    incomeCategory,
  })
);

// カテゴリーをMapで取得
export const selectMoneyCategoryMap = createSelector(
  [(state: RootState) => state.money.expenseCategory, (state: RootState) => state.money.incomeCategory],
  (
    expenseCategory,
    incomeCategory
  ): {
    expenseCategoryMap: Map<number, ExpenseCategory> | null;
    incomeCategoryMap: Map<number, IncomeCategory> | null;
  } => {
    const expenseCategoryMap =
      expenseCategory === null
        ? null
        : new Map<number, ExpenseCategory>(expenseCategory.map(category => [category.id, category]));

    const incomeCategoryMap =
      incomeCategory === null
        ? null
        : new Map<number, IncomeCategory>(incomeCategory.map(category => [category.id, category]));

    return {
      expenseCategoryMap,
      incomeCategoryMap,
    };
  }
);

// key(yyyy-mm) で1か月分のデータを取得
export const selectMoneyByMonth = createSelector(
  [(state: RootState) => state.money.data, (_: RootState, key: string) => key],
  (data, key): Money[] | null => {
    if (data[key]) {
      return Object.values(data[key].money).filter((m): m is Money => m !== undefined);
    }
    return null;
  }
);

// yyyy で1年分のデータを取得
export const selectMoneyByYear = createSelector(
  [(state: RootState) => state.money.data, (_: RootState, year: number) => year],
  (data, year): null | Record<string, Money[]> => {
    const months = Array.from({ length: 12 }, (_, i) => `${String(year)}-${(i + 1).toString().padStart(2, '0')}`);
    const result: Record<string, Money[]> = {};

    for (const key of months) {
      const monthData = data[key];
      if (!monthData) {
        // 1年分揃っていなければ null を返す
        return null;
      }
      result[key] = Object.values(monthData.money).filter((m): m is Money => m !== undefined);
    }

    return result;
  }
);

// key(yyyy-mm) で1か月分の GridRow用データ を取得
export const selectMonthlyMoneyGridRows = createSelector(
  [(state: RootState) => state.money, (_: RootState, key: string) => key],
  (state, key): GridRowsProp | null => {
    const group = state.data[key];
    if (!group) return null;

    const expenseMap = new Map(state.expenseCategory?.map(c => [c.id, c]));
    const incomeMap = new Map(state.incomeCategory?.map(c => [c.id, c]));
    const money = group.money;

    const rows = Object.values(money)
      .filter((m): m is Money => !!m)
      .map(data => ({
        ...data,
        category:
          data.type === '収入'
            ? (incomeMap.get(data.category)?.name ?? 'カテゴリー不明')
            : (expenseMap.get(data.category)?.name ?? 'カテゴリー不明'),
        date: new Date(data.date),
      }));

    return rows;
  }
);

// Date で該当日のデータを取得
export const selectMoneyByDay = createSelector(
  [(state: RootState) => state.money.data, (_: RootState, date: Date) => date],
  (data, date): Money[] | null => {
    const { day, month, year } = splitDate(date);
    const key = `${year}-${month}`;
    const group = data[key];
    if (!group) return null;

    const entities = group.money;
    const money = Object.values(entities)
      .filter((m): m is Money => !!m)
      .filter(item => item.date === `${year}-${month}-${day}`);

    return money;
  }
);

// id で該当のデータを取得
export const selectMoneyById = createSelector(
  [(state: RootState) => state.money, (_: RootState, id: number) => id],
  (state, id): Money | null => {
    // idからkeyを逆引き
    const key = state.map[id];
    if (!key) return null;

    const group = state.data[key];
    if (!group) return null;

    const money = group.money[id];
    if (!money) return null;

    return money;
  }
);

// yyyyで 年間収支 と 月別収支 を取得
export const selectMoneyBalanceByYear = createSelector(
  [(state: RootState) => state.money.data, (_: RootState, year: number) => year],
  (
    data,
    year
  ): null | {
    monthly: BalanceByMonthly[];
    yearly: BalanceByYear[];
  } => {
    const months = Array.from({ length: 12 }, (_, i) => `${String(year)}-${String(i + 1).padStart(2, '0')}`);

    // 月別集計
    const monthly = months.map((key, i) => {
      const group = data[key];
      if (!group) return { expense: 0, income: 0, month: String(i + 1).padStart(2, '0') };

      const moneyItems = Object.values(group.money).filter((m): m is Money => !!m);

      return moneyItems.reduce(
        (acc, item) => {
          if (item.type === '収入') acc.income += item.amount;
          else acc.expense += item.amount;
          return acc;
        },
        { expense: 0, income: 0, month: String(i + 1).padStart(2, '0') }
      );
    });

    // 年間集計
    const totalIncome = monthly.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthly.reduce((sum, m) => sum + m.expense, 0);

    const yearly: BalanceByYear[] = [
      { amount: totalIncome, icon: ICONS.arrowRightUp, label: '収入', type: 'income' },
      { amount: totalExpense, icon: ICONS.arrowRightDown, label: '支出', type: 'expense' },
      { amount: totalIncome - totalExpense, icon: ICONS.lineChart, label: '収支', type: 'balance' },
    ];

    return { monthly, yearly };
  }
);

// 日ごとの合計値を全件取得
export const selectMoneyBalanceAllDays = createSelector(
  [(state: RootState) => state.money.data],
  (data): Map<string, { expense: number; income: number }> => {
    const result = new Map<string, { expense: number; income: number }>();

    for (const group of Object.values(data)) {
      if (!group) continue;
      for (const money of Object.values(group.money).filter((m): m is Money => !!m)) {
        if (!result.has(money.date)) {
          result.set(money.date, { expense: 0, income: 0 });
        }

        const total = result.get(money.date)!;
        if (money.type === '収入') {
          total.income += money.amount;
        } else {
          total.expense += money.amount;
        }
      }
    }

    return result;
  }
);

// カテゴリー別の合計値を算出し、PieChart用のデータを成形
const aggregateByCategory = (
  items: Money[],
  type: '収入' | '支出',
  categoryMap: Map<number, ExpenseCategory | IncomeCategory>
): PieChartData[] => {
  const total = items
    .filter(data => data.type === type)
    .reduce<Record<string, number>>((acc, item) => {
      const categoryName = categoryMap.get(item.category)?.name ?? '不明なカテゴリー';
      acc[categoryName] = (acc[categoryName] ?? 0) + item.amount;
      return acc;
    }, {});

  return Object.entries(total)
    .sort((a, b) => {
      // "その他" は常に最後
      // それ以外のカテゴリーは金額順
      if (a[0] === 'その他') return 1;
      if (b[0] === 'その他') return -1;
      return b[1] - a[1];
    })
    .map(([category, amount], index) => ({
      id: index + 1,
      label: category,
      value: amount,
      ...(category === 'その他' ? { color: '#D6D6D6' } : {}),
    }));
};

// key(yyyy-mm)で月の支出と収入をカテゴリー別に集計したデータを取得
export const selectMonthlyCategoryTotals = createSelector(
  [(state: RootState) => state.money, (_: RootState, key: string) => key],
  (state, key): null | { expense: PieChartData[]; income: PieChartData[] } => {
    const group = state.data[key];
    if (!group) return null;

    const expenseMap = new Map(state.expenseCategory?.map(e => [e.id, e]));
    const incomeMap = new Map(state.incomeCategory?.map(i => [i.id, i]));
    const money = Object.values(group.money).filter((m): m is Money => !!m);

    return {
      expense: aggregateByCategory(money, '支出', expenseMap),
      income: aggregateByCategory(money, '収入', incomeMap),
    };
  }
);
