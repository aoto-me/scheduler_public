import { z } from 'zod';

export const ALIGN_TYPES = ['left', 'center', 'right'] as const;
export type AlignType = (typeof ALIGN_TYPES)[number];

export const CELL_DATA_TYPES = ['text', 'number', 'boolean', 'dateString', 'select', 'img', 'url'] as const;
export type CellDataType = (typeof CELL_DATA_TYPES)[number];

export const columnSchema = z
  .object({
    align: z.enum(ALIGN_TYPES, { message: 'タイプを選択してください' }),
    autoHeight: z.boolean(),
    cellDataType: z.enum(CELL_DATA_TYPES, {
      message: 'タイプを選択してください',
    }),
    field: z
      .string()
      .min(1, { message: 'IDを入力してください' })
      .regex(/^[a-zA-Z0-9]+$/, { message: 'IDには半角英数字のみ使用できます' }),
    headerName: z.string().min(1, { message: 'カラム名を入力してください' }),
    pinned: z.boolean(),
    selectItem: z.string(),
    wrapText: z.boolean(),
  })
  .refine(({ cellDataType, selectItem }) => (cellDataType === 'select' ? selectItem.length > 0 : true), {
    message: '選択を利用する場合は、項目をカンマ区切りで入力してください',
    path: ['selectItem'],
  });

// tsの型定義
export type ColumnSchema = z.infer<typeof columnSchema>;
