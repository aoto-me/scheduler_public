import { API_ENDPOINTS } from '@/configs';
import { useErrorContext } from '@/contexts';
import {
  addDirectory,
  setInvalidDirectoryPath,
  updateDirectoryFetched,
  updateDirectoryFiles,
  useAppDispatch,
} from '@/redux';
import type { FileRequestResult } from '@/types';
import { normalizePath } from '@/utils';
import { useFileRequest } from '../useFileRequest';
import { useHttpRequest } from '../useHttpRequest';

export const useSaveFile = () => {
  const { setErrors } = useErrorContext();
  const { patchRequest, postRequest } = useHttpRequest();
  const fileRequest = useFileRequest();
  const dispatch = useAppDispatch();

  /**
   * 新規フォルダの作成
   */
  const createFolder = async (path: string): Promise<null | { name: string; path: string }> => {
    const table = 'folder';

    const normalizedPath = normalizePath(path, { endSlash: 'keep' });

    // 'memo/', 'project/', 'gallery/', 'diary/' 配下にはフォルダを追加できない
    const excludedPrefixes = ['memo/', 'project/', 'gallery/', 'diary/'];
    if (excludedPrefixes.some(prefix => normalizedPath.startsWith(prefix))) {
      const currentFolder = normalizedPath.replace(/\/$/, '');
      const errorMessage = `${currentFolder}の下にはフォルダを追加できません`;
      setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
      return null;
    }

    const response = await postRequest<string>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      data: {
        name: '新規フォルダ',
        path: normalizedPath,
      },
    });
    if (!response) return null;

    dispatch(addDirectory({ name: response, path: normalizedPath }));

    return { name: response, path: normalizedPath };
  };

  /**
   * フォルダ名の変更
   */
  const renameFolder = async (name: string, path: string): Promise<null | string> => {
    const table = 'folder';

    const response = await patchRequest<string>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      data: {
        name,
        path: normalizePath(path, { endSlash: 'keep' }),
      },
    });
    if (!response) return null;

    const parentPath = path.split('/').filter(Boolean).slice(0, -1).join('/');
    const newPath = parentPath === '' ? response : `${parentPath}/${response}`;

    // 削除予定のディレクトリにパスを登録
    dispatch(setInvalidDirectoryPath(normalizePath(path)));
    // ディレクトリを再取得
    dispatch(updateDirectoryFetched(false));

    return newPath;
  };

  /**
   * ファイル名の変更
   */
  const renameFile = async ({
    extension,
    newName,
    oldName,
    path,
  }: {
    extension: string;
    newName: string;
    oldName: string;
    path: string;
  }): Promise<null | { name: string; url: string }> => {
    const table = 'file';

    const response = await patchRequest<{ name: string; url: string }>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      data: {
        extension,
        newName,
        oldName,
        path: normalizePath(path, { endSlash: 'keep' }),
      },
    });
    if (!response) return null;

    // 対象ディレクトリのファイル一覧を再取得
    dispatch(updateDirectoryFiles(normalizePath(path)));

    return response;
  };

  /**
   * ファイルのアップロード
   */
  const uploadFile = async ({ files, path }: { files: File[]; path: string }): Promise<FileRequestResult | null> => {
    const response = await fileRequest({
      files,
      path,
    });
    if (!response) return null;

    // 対象ディレクトリのファイル一覧を再取得
    dispatch(updateDirectoryFiles(normalizePath(path)));

    return response;
  };

  return {
    createFolder,
    renameFile,
    renameFolder,
    uploadFile,
  };
};
