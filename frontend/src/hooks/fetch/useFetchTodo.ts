import { API_ENDPOINTS } from '@/configs';
import { setTodoData, useAppDispatch } from '@/redux';
import type { TaskTime, Todo } from '@/types';
import { formatDateToKey } from '@/utils';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchTodo = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * 1ヶ月分のTodoを取得
   */
  const fetchTodo = async (
    date: Date
  ): Promise<null | {
    taskTime: TaskTime[];
    todo: Todo[];
  }> => {
    const response = await getRequest<{
      taskTime: TaskTime[];
      todo: Todo[];
    }>({
      apiUrl: API_ENDPOINTS.todo,
      queryParams: {
        end: format(endOfMonth(date), 'yyyy-MM-dd'),
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
      },
    });

    if (!response) return null;

    dispatch(setTodoData({ data: response.todo, key: formatDateToKey(date), taskTimes: response.taskTime }));

    return { taskTime: response.taskTime, todo: response.todo };
  };

  return { fetchTodo };
};
