import { API_ENDPOINTS } from '@/configs';
import {
  setFoodDB,
  setHealthCategory,
  setMoneyCategory,
  setNutrition,
  setRssList,
  setYearEvent,
  useAppDispatch,
} from '@/redux';
import type { ExpenseCategory, FoodDB, HealthCategory, IncomeCategory, Nutrition, RSSList, YearEvent } from '@/types';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchSettings = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * yearEvent
   */
  const fetchYearEvent = async (): Promise<null | YearEvent[]> => {
    const table = 'yearEvent';

    const response = await getRequest<YearEvent[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setYearEvent(response));

    return response;
  };

  /**
   * nutrition
   */
  const fetchNutrition = async (): Promise<null | Nutrition[]> => {
    const table = 'nutrition';

    const response = await getRequest<Nutrition[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setNutrition(response));

    return response;
  };

  /**
   * healthCategory
   */
  const fetchHealthCategory = async (): Promise<HealthCategory[] | null> => {
    const table = 'healthCategory';

    const response = await getRequest<HealthCategory[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setHealthCategory(response));

    return response;
  };

  /**
   * incomeCategory
   */
  const fetchIncomeCategory = async (): Promise<IncomeCategory[] | null> => {
    const table = 'incomeCategory';

    const response = await getRequest<IncomeCategory[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setMoneyCategory({ data: response, type: 'income' }));

    return response;
  };

  /**
   * expenseCategory
   */
  const fetchExpenseCategory = async (): Promise<ExpenseCategory[] | null> => {
    const table = 'expenseCategory';

    const response = await getRequest<ExpenseCategory[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setMoneyCategory({ data: response, type: 'expense' }));

    return response;
  };

  /**
   * foodDB
   */
  const fetchFoodDB = async (): Promise<FoodDB[] | null> => {
    const table = 'foodDB';

    const response = await getRequest<FoodDB[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    const normalizedData = response.map(item => ({
      ...item,
      perItem: item.perItem !== 0, // 0と1からbooleanに変換
    }));

    dispatch(setFoodDB(normalizedData));

    return normalizedData;
  };

  /**
   * rssList
   */
  const fetchRssList = async (): Promise<null | RSSList[]> => {
    const table = 'rssList';

    const response = await getRequest<RSSList[]>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setRssList(response));

    return response;
  };

  return {
    fetchExpenseCategory,
    fetchFoodDB,
    fetchHealthCategory,
    fetchIncomeCategory,
    fetchNutrition,
    fetchRssList,
    fetchYearEvent,
  };
};
