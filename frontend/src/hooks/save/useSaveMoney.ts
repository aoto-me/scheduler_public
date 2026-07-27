import { API_ENDPOINTS } from '@/configs';
import { addMoney, updateMoney, useAppDispatch } from '@/redux';
import type { Money } from '@/types';
import { useHttpRequest } from '../useHttpRequest';

export const useSaveMoney = () => {
  const { putRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * money
   */
  const saveMoney = async (data: Money): Promise<null | number> => {
    const response = await putRequest<number>({
      apiUrl: `${API_ENDPOINTS.money}${String(data.id)}/`,
      data,
    });
    if (!response) return null;

    const newMoney = {
      ...data,
      id: response,
    };

    if (data.id === 0) {
      dispatch(addMoney(newMoney));
    } else {
      dispatch(updateMoney(newMoney));
    }

    return response;
  };

  return { saveMoney };
};
