import { API_ENDPOINTS } from '@/configs';
import {
  removeFoodDB,
  removeHealthCategory,
  removeMoneyCategory,
  removeRssList,
  removeYearEvent,
  useAppDispatch,
} from '@/redux';
import { useHttpRequest } from '../useHttpRequest';

export const useDeleteSettings = () => {
  const { deleteRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * rssList
   */
  const deleteRssList = async (id: number): Promise<null | string> => {
    const table = 'rss';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeRssList(id));

    return response;
  };

  /**
   * yearEvent
   */
  const deleteYearEvent = async (id: number): Promise<null | string> => {
    const table = 'yearEvent';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeYearEvent(id));

    return response;
  };

  /**
   * foodDB
   */
  const deleteFoodDB = async (id: number): Promise<null | string> => {
    const table = 'foodDB';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeFoodDB(id));

    return response;
  };

  /**
   * healthCategory
   */
  const deleteHealthCategory = async (id: number): Promise<null | string> => {
    const table = 'healthCategory';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeHealthCategory(id));

    return response;
  };

  /**
   * incomeCategory
   */
  const deleteIncomeCategory = async (id: number): Promise<null | string> => {
    const table = 'incomeCategory';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeMoneyCategory({ id, type: 'income' }));

    return response;
  };

  /**
   * expenseCategory
   */
  const deleteExpenseCategory = async (id: number): Promise<null | string> => {
    const table = 'expenseCategory';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.setting}${table}/${String(id)}/`,
      data: {},
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeMoneyCategory({ id, type: 'expense' }));

    return response;
  };

  return {
    deleteExpenseCategory,
    deleteFoodDB,
    deleteHealthCategory,
    deleteIncomeCategory,
    deleteRssList,
    deleteYearEvent,
  };
};
