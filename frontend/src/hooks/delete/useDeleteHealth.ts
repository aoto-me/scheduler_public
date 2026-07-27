import { API_ENDPOINTS } from '@/configs';
import { removeFood, removeHealth, useAppDispatch } from '@/redux';
import { useHttpRequest } from '../useHttpRequest';

export const useDeleteHealth = () => {
  const { deleteRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * health
   */
  const deleteHealth = async (id: number): Promise<null | string> => {
    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.health}${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') {
      dispatch(removeHealth(id));
    }

    return response;
  };

  /**
   * food
   */
  const deleteFood = async (id: number): Promise<null | string> => {
    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.food}${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') {
      dispatch(removeFood(id));
    }

    return response;
  };

  return { deleteFood, deleteHealth };
};
