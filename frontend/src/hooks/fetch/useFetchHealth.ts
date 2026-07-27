import { API_ENDPOINTS } from '@/configs';
import { setFoodData, setFoodDBStandard, setHealthData, useAppDispatch } from '@/redux';
import type { Food, FoodDB, Health, HealthItem } from '@/types';
import { formatDateToKey } from '@/utils';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchHealth = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * 1か月分のHealthデータを取得
   */
  const fetchHealth = async (
    date: Date
  ): Promise<null | {
    health: Health[];
    healthItem: HealthItem[];
  }> => {
    const response = await getRequest<{
      health: Health[];
      healthItem: HealthItem[];
    }>({
      apiUrl: API_ENDPOINTS.health,
      queryParams: {
        end: format(endOfMonth(date), 'yyyy-MM-dd'),
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
      },
    });

    if (!response) return null;

    dispatch(setHealthData({ health: response.health, healthItem: response.healthItem, key: formatDateToKey(date) }));

    return response;
  };

  /**
   * 1か月分のFoodデータを取得
   */
  const fetchFood = async (date: Date): Promise<Food[] | null> => {
    const response = await getRequest<Food[]>({
      apiUrl: API_ENDPOINTS.food,
      queryParams: {
        end: format(endOfMonth(date), 'yyyy-MM-dd'),
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
      },
    });

    if (!response) return null;

    dispatch(setFoodData({ data: response, key: formatDateToKey(date) }));

    return response;
  };

  /**
   * foodDB_standard の全件取得
   */
  const fetchFoodDBStandard = async (): Promise<FoodDB[] | null> => {
    const response = await getRequest<FoodDB[]>({ apiUrl: API_ENDPOINTS.food + 'standard', queryParams: {} });
    if (response) {
      dispatch(setFoodDBStandard(response));
    }
    return response;
  };

  return { fetchFood, fetchFoodDBStandard, fetchHealth };
};
