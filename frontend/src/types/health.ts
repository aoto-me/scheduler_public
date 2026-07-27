/**
 * Healthデータ
 * - mental: number (0～5)
 * - other: string (', 'の区切りテキスト)
 */
export interface Health {
  date: string;
  exercise: 0 | 1;
  id: number;
  memo: string;
  mental: number;
  other: string;
}

/**
 * 症状カテゴリー
 */
export interface HealthCategory {
  icon: string;
  id: number;
  name: string;
}

export type HealthCategoryWithNew = HealthCategory & {
  isNew: boolean;
};

/**
 * Healthに紐づいた症状の記録
 */
export interface HealthItem {
  categoryId: number;
  healthId: number;
  id: number;
}

export type HealthSaveRequest = Health & { addItems: HealthItem[]; delItems: HealthItem[] };

export interface HealthSaveResponse {
  healthItem: HealthItem[];
  id: number;
}

export type HealthWithItem = Health & { item: string[] };
