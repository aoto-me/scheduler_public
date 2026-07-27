import { MONEY_TYPES, TODO_TYPES, UNIT_TYPES } from '@/types';
import { z } from 'zod';

/**
 * ログイン
 */
export const loginSchema = z.object({
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(30, { message: '30文字以内で入力してください' })
    .regex(/^[a-zA-Z0-9_/@-]+$/, '半角英数字と _ / @ - のみ使用できます'),
  userName: z
    .string()
    .min(1, 'ユーザー名を入力してください')
    .max(30, { message: '30文字以内で入力してください' })
    .regex(/^[a-zA-Z0-9_/@-]+$/, '半角英数字と _ / @ - のみ使用できます'),
});
export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Todo
 */
export const todoSchema = z.object({
  completed: z.boolean(),

  content: z
    .string()
    .min(1, { message: '内容を入力してください' })
    .max(100, { message: '100文字以内で入力してください' }),
  end: z.string(),
  estimated: z.string(),
  memo: z.string().max(500, { message: '500文字以内で入力してください' }),
  project: z.number().nullable(),
  section: z.string().nullable(),
  start: z.string().min(1, { message: '日時を選択してください' }),
  taskTime: z.array(
    z
      .object({
        end: z.string(),
        id: z.number(),
        start: z.string(),
      })
      .nullable()
  ),
  type: z.enum(TODO_TYPES, { message: 'タイプを選択してください' }),
  visible: z.boolean(),
});
export type TodoSchema = z.infer<typeof todoSchema>;

/**
 * Health
 */
export const healthSchema = z.object({
  date: z.string().min(1, { message: '日付を選択してください' }),
  exercise: z.boolean(),
  item: z.array(z.number()),
  memo: z.string().max(500, { message: '500文字以内で入力してください' }),
  mental: z.number(),
  other: z.string().max(50, { message: '50文字以内で入力してください' }),
});
export type HealthSchema = z.infer<typeof healthSchema>;

/**
 * Food
 */
export const foodSchema = z.object({
  carb: z.number().nullable(),
  date: z.string().min(1, { message: '日付を選択してください' }),
  energy: z.union([z.number().nullable()]).refine(val => val !== null && val >= 0, {
    message: '熱量を入力してください',
  }),
  fat: z.number().nullable(),
  name: z.union([z.string().max(100, { message: '100文字以内で入力してください' })]).refine(val => val.trim() !== '', {
    message: '内容を入力してください',
  }),
  protein: z.number().nullable(),
  quantity: z.union([z.number().nullable()]).refine(val => val !== null && val >= 0, {
    message: '量を入力してください',
  }),
  salt: z.number().nullable(),
  unit: z.enum(UNIT_TYPES, { message: 'タイプを選択してください' }),
});
export type FoodSchema = z.infer<typeof foodSchema>;

/**
 * Money
 */
export const moneySchema = z.object({
  amount: z.union([z.number().nullable()]).refine(val => val !== null && val >= 0, {
    message: '金額を入力してください',
  }),
  category: z.number().refine(val => val > 0, { message: 'カテゴリーを選択してください' }),
  content: z
    .string()
    .min(1, { message: '内容を入力してください' })
    .max(100, { message: '100文字以内で入力してください' }),
  date: z.string().min(1, { message: '日付を選択してください' }),
  type: z.enum(MONEY_TYPES, { message: 'タイプを選択してください' }),
});
export type MoneySchema = z.infer<typeof moneySchema>;
