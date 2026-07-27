import { API_ENDPOINTS } from '@/configs';
import {
  removeDirectory,
  removeGallery,
  removeGalleryFolder,
  removeMemo,
  removeMemoFolder,
  removeProject,
  removeProjectFolder,
  selectDirectories,
  updateTodoProject,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { type UniqueIdentifier } from '@dnd-kit/core';
import type { Action } from '@reduxjs/toolkit';
import { useHttpRequest } from '../useHttpRequest';

export const useDeleteMenu = () => {
  const { deleteRequest } = useHttpRequest();
  const dispatch = useAppDispatch();
  const directories = useAppSelector(selectDirectories);

  /**
   * folder
   */
  const deleteFolder = async ({
    folderId,
    pathname,
  }: {
    folderId: UniqueIdentifier;
    pathname: string;
  }): Promise<null | string> => {
    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
      data: { folderId, type: 'folder' },
    });
    if (!response) return null;

    if (response === 'ok') {
      const actionMap: Partial<Record<string, (containerID: UniqueIdentifier) => Action>> = {
        gallery: removeGalleryFolder,
        memo: removeMemoFolder,
        project: removeProjectFolder,
      };
      const action = actionMap[pathname];
      if (action) dispatch(action(folderId));
    }

    return response;
  };

  /**
   * item
   */
  const deleteItem = async ({
    folderId,
    itemId,
    pathname,
  }: {
    folderId: UniqueIdentifier;
    itemId: UniqueIdentifier;
    pathname: string;
  }): Promise<null | { result: string; sectionId?: string[]; todoId?: number[] }> => {
    const response = await deleteRequest<{ result: string; sectionId?: string[]; todoId?: number[] }>({
      apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
      data: { folderId, itemId, type: 'item' },
    });
    if (!response) return null;
    if (response.result === 'ok') {
      switch (pathname) {
        case 'gallery': {
          dispatch(removeGallery({ folderId, itemId }));
          break;
        }
        case 'memo': {
          dispatch(removeMemo({ folderId, itemId }));
          break;
        }
        case 'project': {
          // const sectionIds = response.sectionId ?? []; もしセクションIDが必要になったら
          const todoIds = response.todoId ?? [];
          dispatch(removeProject({ folderId, itemId }));
          dispatch(updateTodoProject(todoIds));
          break;
        }
        default: {
          break;
        }
      }

      // directoriesから削除
      if (directories) dispatch(removeDirectory(`${pathname}/${String(itemId)}`));
    }

    return response;
  };

  return { deleteFolder, deleteItem };
};
