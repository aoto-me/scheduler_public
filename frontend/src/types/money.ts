import * as Icons from '@remixicon/react';

export interface BalanceByMonthly {
  expense: number;
  income: number;
  month: string;
}

export interface BalanceByYear {
  amount: number;
  icon: keyof typeof Icons;
  label: string;
  type: string;
}

/**
 * 支出カテゴリー
 */
export interface ExpenseCategory {
  icon: string;
  id: number;
  name: string;
}

export type ExpenseCategoryWithNew = ExpenseCategory & {
  isNew: boolean;
};

/**
 * 収入カテゴリー
 */
export interface IncomeCategory {
  icon: string;
  id: number;
  name: string;
}

export type IncomeCategoryWithNew = IncomeCategory & {
  isNew: boolean;
};

/**
 * Moneyデータ
 */
export interface Money {
  amount: number;
  category: number;
  content: string;
  date: string;
  id: number;
  type: MoneyType;
}

export const MONEY_TYPES = ['収入', '支出'] as const;
export type MoneyType = (typeof MONEY_TYPES)[number];

export interface PieChartData {
  color?: string | undefined;
  id: number;
  label: string;
  value: number;
}
