import { API_ENDPOINTS } from '@/configs';
import {
  addDirectory,
  addGallery,
  addGalleryFolder,
  addMemo,
  addMemoFolder,
  addProject,
  addProjectFolder,
  selectDirectories,
  selectGalleryMenu,
  selectMemoMenu,
  selectProjectMenu,
  updateGalleryFolderName,
  updateGalleryFolderSort,
  updateGalleryTreeSort,
  updateMemoFolderName,
  updateMemoFolderSort,
  updateMemoTreeSort,
  updateProjectFolderName,
  updateProjectFolderSort,
  updateProjectTreeSort,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import type { Project, TreeNode } from '@/types';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { Action } from '@reduxjs/toolkit';
import type { JSONContent } from '@tiptap/core';
import { useHttpRequest } from '../useHttpRequest';

export const useSaveMenu = () => {
  const { patchRequest, postRequest } = useHttpRequest();
  const dispatch = useAppDispatch();
  const directories = useAppSelector(selectDirectories);
  const memoMenu = useAppSelector(selectMemoMenu);
  const galleryMenu = useAppSelector(selectGalleryMenu);
  const projectMenu = useAppSelector(selectProjectMenu);

  /**
   * ツリー全体の並び替えを保存
   * ペイロード削減のため、sort または parentId が変わったノードのみ送信する。
   * 変更ノードが多い場合（初回移行時など）はチャンク分割して送信する。
   */
  const sortTree = async ({ nodes, pathname }: { nodes: TreeNode[]; pathname: string }): Promise<null | string> => {
    const CHUNK_SIZE = 50;

    const menuByPathname: Partial<Record<string, TreeNode[] | undefined>> = {
      gallery: galleryMenu?.nodes,
      memo: memoMenu?.nodes,
      project: projectMenu?.nodes,
    };
    const currentNodes = menuByPathname[pathname] ?? null;

    // Redux の現在状態（更新前）と比較して変化があったノードのみに絞る
    const changedNodes = currentNodes
      ? nodes.filter(newNode => {
          const old = currentNodes.find(n => n.id === newNode.id);
          return old?.sort !== newNode.sort || old.parentId !== newNode.parentId;
        })
      : nodes;

    const payload = changedNodes.map(n => ({ id: n.id, nodeType: n.type, parentId: n.parentId, sort: n.sort }));

    // チャンク分割して順次送信（WAF のリクエストサイズ制限対策）
    let lastResponse: null | string = null;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      const response = await patchRequest<string>({
        apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
        data: { nodes: chunk, target: 'sortTree' },
      });
      if (!response) return null;
      lastResponse = response;
    }

    if (!lastResponse) return null;

    switch (pathname) {
      case 'gallery': {
        dispatch(updateGalleryTreeSort(nodes));
        break;
      }
      case 'memo': {
        dispatch(updateMemoTreeSort(nodes));
        break;
      }
      case 'project': {
        dispatch(updateProjectTreeSort(nodes));
        break;
      }
    }

    return lastResponse;
  };

  /**
   * フォルダの作成
   */
  const createFolder = async ({
    folderId,
    pathname,
    sort,
  }: {
    folderId: string;
    pathname: string;
    sort: number;
  }): Promise<null | string> => {
    const response = await postRequest<string>({
      apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
      data: {
        folderId,
        name: '新規フォルダ',
        sort,
        type: 'folder',
      },
    });
    if (!response) return null;

    const newFolder = {
      folderId,
      name: '新規フォルダ',
      sort,
    };
    const newSort = {
      id: 'noCategory',
      sort: sort + 1,
    };
    switch (pathname) {
      case 'gallery': {
        dispatch(addGalleryFolder(newFolder));
        dispatch(updateGalleryFolderSort(newSort));
        break;
      }
      case 'memo': {
        dispatch(addMemoFolder(newFolder));
        dispatch(updateMemoFolderSort(newSort));
        break;
      }
      case 'project': {
        dispatch(addProjectFolder(newFolder));
        dispatch(updateProjectFolderSort(newSort));
        break;
      }
      default: {
        break;
      }
    }
    return response;
  };

  /**
   * アイテムの作成
   */
  const createItem = async ({
    page,
    pathname,
    sort,
  }: {
    page: string;
    pathname: string;
    sort: number;
  }): Promise<null | number> => {
    const response = await postRequest<number>({
      apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
      data: {
        sort,
        title: `新規${page}ページ`,
        type: 'item',
      },
    });
    if (!response) return null;

    const newItemOrder = {
      folderId: 'noCategory',
      itemId: response,
      sort,
    };

    switch (pathname) {
      case 'gallery': {
        const newGallery = {
          id: response,
          title: `新規${page}ページ`,
        };
        dispatch(addGallery({ data: newGallery, itemOrder: newItemOrder }));
        break;
      }
      case 'memo': {
        const newMemo = {
          content: JSON.parse('{"type":"doc","content":[]}') as JSONContent,
          id: response,
          title: `新規${page}ページ`,
        };
        dispatch(addMemo({ data: newMemo, itemOrder: newItemOrder }));
        break;
      }
      case 'project': {
        const newProject: Project = {
          content: JSON.parse('{"type":"doc","content":[]}') as JSONContent,
          end: null,
          id: response,
          title: `新規${page}ページ`,
        };
        dispatch(addProject({ data: newProject, itemOrder: newItemOrder }));
        break;
      }
      default: {
        break;
      }
    }
    // directoriesに追加
    if (directories) dispatch(addDirectory({ name: String(response), path: pathname }));

    return response;
  };

  /**
   * フォルダ名の変更
   */
  const renameFolder = async ({
    folderId,
    name,
    pathname,
  }: {
    folderId: UniqueIdentifier;
    name: string;
    pathname: string;
  }): Promise<null | string> => {
    const response = await patchRequest<string>({
      apiUrl: `${API_ENDPOINTS.menu}${pathname}/`,
      data: { folderId, name, target: 'edit', type: 'folder' },
    });
    if (!response) return null;

    const actionMap: Partial<Record<string, ({ folderId, name }: { folderId: string; name: string }) => Action>> = {
      gallery: updateGalleryFolderName,
      memo: updateMemoFolderName,
      project: updateProjectFolderName,
    };
    const action = actionMap[pathname];
    if (action) dispatch(action({ folderId: String(folderId), name }));

    return response;
  };

  return { createFolder, createItem, renameFolder, sortTree };
};
