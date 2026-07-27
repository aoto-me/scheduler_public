import { API_ENDPOINTS } from '@/configs';
import { setProjectData, setProjectMenu, setSectionData, setTodoDataWithoutKey, useAppDispatch } from '@/redux';
import type { Folder, MenuItem, MenuItemOrder, Project, Section, TaskTime, Todo } from '@/types';
import type { JSONContent } from '@tiptap/core';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchProject = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * sectionの全件データを取得
   */
  const fetchSection = async (): Promise<null | Section[]> => {
    const response = await getRequest<Section[]>({
      apiUrl: API_ENDPOINTS.section,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setSectionData(response));

    return response;
  };

  /**
   * projectに紐づくTodoを取得
   */
  const fetchTodoByProject = async (
    postId: string
  ): Promise<null | {
    taskTime: TaskTime[];
    todo: Todo[];
  }> => {
    const response = await getRequest<{
      taskTime: TaskTime[];
      todo: Todo[];
    }>({
      apiUrl: `${API_ENDPOINTS.project}todo/${postId}/`,
      queryParams: {},
    });

    if (!response) return null;
    dispatch(setTodoDataWithoutKey({ data: response.todo, taskTime: response.taskTime }));

    return response;
  };

  /**
   * projectの全件データを取得（メニューと共通）
   */
  const fetchProject = async (): Promise<null | {
    folders: Folder[];
    itemOrder: MenuItemOrder[];
    items: MenuItem[];
  }> => {
    const response = await getRequest<{
      folders: Folder[];
      itemOrder: MenuItemOrder[];
      items: MenuItem[];
    }>({
      apiUrl: `${API_ENDPOINTS.menu}project/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(
      setProjectMenu({
        folder: response.folders,
        item: response.items,
        itemOrder: response.itemOrder,
      })
    );

    return response;
  };

  /**
   * プロジェクトの詳細データを取得
   */
  const fetchProjectData = async (postId: string): Promise<null | Project> => {
    const response = await getRequest<Project>({
      apiUrl: `${API_ENDPOINTS.project}${postId}`,
      queryParams: {},
    });

    if (!response) return null;

    const parsed: Project = { ...response, content: JSON.parse(response.content as string) as JSONContent };
    dispatch(setProjectData(parsed));

    return parsed;
  };

  return { fetchProject, fetchProjectData, fetchSection, fetchTodoByProject };
};
