import { API_ENDPOINTS } from '@/configs';
import {
  addFoodDB,
  addHealthCategory,
  addMoneyCategory,
  addRssList,
  addYearEvent,
  updateFoodDB,
  updateHealthCategory,
  updateMoneyCategory,
  updateNutrition,
  updateRssList,
  updateYearEvent,
  useAppDispatch,
} from '@/redux';
import type {
  ExpenseCategory,
  ExpenseCategoryWithNew,
  FoodDB,
  FoodDBWithNew,
  HealthCategory,
  HealthCategoryWithNew,
  IncomeCategory,
  IncomeCategoryWithNew,
  Nutrition,
  RSSList,
  RSSListWithNew,
  YearEvent,
  YearEventWithNew,
} from '@/types';
import { format } from 'date-fns';
import { useHandleValidate } from '../useHandleValidate';
import { useHttpRequest } from '../useHttpRequest';

export const useSaveSettings = () => {
  const { putRequest } = useHttpRequest();
  const dispatch = useAppDispatch();
  const {
    handleValidateDate,
    handleValidateNonNegativeNumber,
    handleValidateNullableNonNegativeNumber,
    handleValidatePositiveInteger,
    handleValidateText,
  } = useHandleValidate();

  /**
   * rssList
   */
  const saveRssList = async (data: RSSListWithNew): Promise<null | RSSList> => {
    const table = 'rss';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const siteName = handleValidateText(data.siteName, 'サイト名', 200);
    const url = handleValidateText(data.url, 'URL', 200);
    if (!id || !siteName || !url) return null;

    // 保存処理
    const response = await putRequest<RSSList>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    if (data.isNew) {
      dispatch(addRssList(response));
    } else {
      dispatch(updateRssList(response));
    }

    return response;
  };

  /**
   * yearEvent
   */
  const saveYearEvent = async (data: YearEventWithNew): Promise<null | YearEvent> => {
    const table = 'yearEvent';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const name = handleValidateText(data.name, 'イベント名', 100);
    const date = handleValidateDate(data.date, '日付');
    if (!id || !name || !date) return null;

    // 保存処理
    const response = await putRequest<YearEvent>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data: {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      },
    });
    if (!response) return null;

    if (data.isNew) {
      dispatch(addYearEvent(response));
    } else {
      dispatch(updateYearEvent(response));
    }

    return { ...response, date: data.date };
  };

  /**
   * foodDB
   */
  const saveFoodDB = async (data: FoodDBWithNew): Promise<FoodDB | null> => {
    const table = 'foodDB';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const name = handleValidateText(data.name, '名称', 100);
    const energy = handleValidateNonNegativeNumber(data.energy, '熱量');
    const protein = handleValidateNullableNonNegativeNumber(data.protein, 'たんぱく質');
    const fat = handleValidateNullableNonNegativeNumber(data.fat, '脂質');
    const carb = handleValidateNullableNonNegativeNumber(data.carb, '炭水化物');
    const salt = handleValidateNullableNonNegativeNumber(data.salt, '食塩相当量');
    if (!id || !name || !energy || !protein || !fat || !carb || !salt) return null;

    // 保存処理
    const response = await putRequest<FoodDB>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data: {
        ...data,
        perItem: data.perItem ? 1 : 0, // booleanから0と1に変換
      },
    });
    if (!response) return null;

    if (data.isNew) {
      dispatch(addFoodDB({ ...response, perItem: data.perItem }));
    } else {
      dispatch(updateFoodDB({ ...response, perItem: data.perItem }));
    }

    return { ...response, perItem: data.perItem };
  };

  /**
   * nutrition
   */
  const saveNutrition = async (data: Nutrition): Promise<null | Nutrition> => {
    const table = 'nutrition';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const energy = handleValidateNonNegativeNumber(data.energy, '熱量');
    const protein = handleValidateNonNegativeNumber(data.protein, 'たんぱく質');
    const fat = handleValidateNonNegativeNumber(data.fat, '脂質');
    const carb = handleValidateNonNegativeNumber(data.carb, '炭水化物');
    const salt = handleValidateNonNegativeNumber(data.salt, '食塩相当量');
    if (!id || !energy || !protein || !fat || !carb || !salt) return null;

    // 保存処理
    const response = await putRequest<Nutrition>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    dispatch(updateNutrition(response));

    return response;
  };

  /**
   * healthCategory
   */
  const saveHealthCategory = async (data: HealthCategoryWithNew): Promise<HealthCategory | null> => {
    const table = 'healthCategory';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const icon = handleValidateText(data.icon, 'アイコン', 50);
    const name = handleValidateText(data.name, 'カテゴリー名', 50);
    if (!id || !icon || !name) return null;

    // 保存処理
    const response = await putRequest<HealthCategory>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    if (data.isNew) {
      dispatch(addHealthCategory(response));
    } else {
      dispatch(updateHealthCategory(response));
    }

    return response;
  };

  /**
   * incomeCategory
   */
  const saveIncomeCategory = async (data: IncomeCategoryWithNew): Promise<IncomeCategory | null> => {
    const table = 'incomeCategory';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const icon = handleValidateText(data.icon, 'アイコン', 50);
    const name = handleValidateText(data.name, 'カテゴリー名', 50);
    if (!id || !icon || !name) return null;

    // 保存処理
    const response = await putRequest<IncomeCategory>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    if (data.isNew) {
      dispatch(addMoneyCategory({ category: response, type: 'income' }));
    } else {
      dispatch(updateMoneyCategory({ category: response, type: 'income' }));
    }

    return response;
  };

  /**
   * expenseCategory
   */
  const saveExpenseCategory = async (data: ExpenseCategoryWithNew): Promise<ExpenseCategory | null> => {
    const table = 'expenseCategory';

    // バリデーション
    const id = handleValidatePositiveInteger(data.id, 'id');
    const icon = handleValidateText(data.icon, 'アイコン', 50);
    const name = handleValidateText(data.name, 'カテゴリー名', 50);
    if (!id || !icon || !name) return null;

    // 保存処理
    const response = await putRequest<ExpenseCategory>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    if (data.isNew) {
      dispatch(addMoneyCategory({ category: response, type: 'expense' }));
    } else {
      dispatch(updateMoneyCategory({ category: response, type: 'expense' }));
    }

    return response;
  };

  return {
    saveExpenseCategory,
    saveFoodDB,
    saveHealthCategory,
    saveIncomeCategory,
    saveNutrition,
    saveRssList,
    saveYearEvent,
  };
};
