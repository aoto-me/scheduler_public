import { API_ENDPOINTS } from '@/configs';
import { addFood, addHealth, updateFood, updateHealth, useAppDispatch } from '@/redux';
import type { Food, HealthItem, HealthSaveRequest, HealthSaveResponse } from '@/types';
import { base64Encode } from '@/utils';
import { useHttpRequest } from '../useHttpRequest';

export const useSaveHealth = () => {
  const { putRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * health
   */
  const saveHealth = async (data: HealthSaveRequest): Promise<HealthSaveResponse | null> => {
    const encodeMemo = base64Encode(data.memo);

    const response = await putRequest<{
      healthItem: HealthItem[];
      id: number;
    }>({
      apiUrl: `${API_ENDPOINTS.health}${String(data.id)}/`,
      data: { ...data, memo: encodeMemo },
    });
    if (!response) return null;

    const { addItems: _, delItems: __, ...rest } = data;
    const newHealth = {
      ...rest,
      id: response.id,
    };
    const newHealthItem = response.healthItem;

    if (data.id === 0) {
      dispatch(addHealth({ health: newHealth, healthItem: newHealthItem }));
    } else {
      dispatch(updateHealth({ health: newHealth, healthItem: newHealthItem }));
    }

    return response;
  };

  /**
   * food
   */
  const saveFood = async (data: Food): Promise<null | number> => {
    const response = await putRequest<number>({
      apiUrl: `${API_ENDPOINTS.food}${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    const newFood = {
      ...data,
      id: response,
    };

    if (data.id === 0) {
      dispatch(addFood(newFood));
    } else {
      dispatch(updateFood(newFood));
    }

    return response;
  };

  return { saveFood, saveHealth };
};
