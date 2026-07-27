export type AllFoodTotal = Map<
  string,
  {
    carb: number;
    energy: number;
    fat: number;
    protein: number;
    salt: number;
  }
>;

/**
 * 食事記録
 */
export interface Food {
  carb: null | number;
  date: string;
  energy: number;
  fat: null | number;
  id: number;
  name: string;
  protein: null | number;
  quantity: number;
  salt: null | number;
  unit: UnitType;
}

/**
 * 食品データベース
 * - perItem: boolean (true:1個あたり false:100g)
 */
export interface FoodDB {
  carb: null | number;
  energy: number;
  fat: null | number;
  id: number;
  keywords: string[];
  name: string;
  perItem: boolean | number;
  protein: null | number;
  salt: null | number;
}

export type FoodDBWithNew = FoodDB & {
  isNew: boolean;
};

/**
 * 目標値栄養値
 */
export interface Nutrition {
  carb: number;
  energy: number;
  fat: number;
  id: number;
  protein: number;
  salt: number;
}

export const UNIT_TYPES = ['g', '個'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];
