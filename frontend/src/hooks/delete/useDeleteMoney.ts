import { API_ENDPOINTS } from '@/configs';
import { removeMoney, useAppDispatch } from '@/redux';
import { useHttpRequest } from '../useHttpRequest';

export const useDeleteMoney = () => {
  const { deleteRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * money
   */
  const deleteMoney = async (id: number): Promise<null | string> => {
    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.money}${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') {
      dispatch(removeMoney(id));
    }

    return response;
  };

  return { deleteMoney };
};
