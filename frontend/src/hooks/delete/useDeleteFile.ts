import { API_ENDPOINTS } from '@/configs';
import { useErrorContext } from '@/contexts';
import { removeDirectory, updateDirectoryFiles, useAppDispatch } from '@/redux';
import type { DeleteFilesResponse } from '@/types';
import { normalizeExtension, normalizePath } from '@/utils';
import { useHttpRequest } from '../useHttpRequest';

export const useDeleteFile = () => {
  const { deleteRequest } = useHttpRequest();
  const { setErrors } = useErrorContext();
  const dispatch = useAppDispatch();

  /**
   * フォルダの削除
   */
  const deleteFolder = async (path: string): Promise<null | string> => {
    const table = 'folder';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      data: {
        path: normalizePath(path, { endSlash: 'keep' }),
      },
    });
    if (!response) return null;

    if (response === 'ok') dispatch(removeDirectory(normalizePath(path)));

    return response;
  };

  /**
   * ファイルの削除
   */
  const deleteFile = async ({
    extension,
    name,
    path,
  }: {
    extension: string;
    name: string;
    path: string;
  }): Promise<null | string> => {
    const table = 'file';

    const response = await deleteRequest<string>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      data: {
        extension,
        name,
        path: normalizePath(path, { endSlash: 'keep' }),
      },
    });
    if (!response) return null;

    if (response === 'ok') dispatch(updateDirectoryFiles(normalizePath(path)));

    return response;
  };

  /**
   * 複数ファイルの削除
   */
  const deleteFiles = async ({
    files,
    path,
  }: {
    files: {
      extension: string;
      name: string;
    }[];
    path: string;
  }): Promise<DeleteFilesResponse[] | null | string> => {
    const table = 'files';

    const response = await deleteRequest<DeleteFilesResponse[] | string>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      data: {
        files,
        path: normalizePath(path, { endSlash: 'keep' }),
      },
    });
    if (!response) return null;

    dispatch(updateDirectoryFiles(normalizePath(path)));

    if (response !== 'ok') {
      for (const file of response as DeleteFilesResponse[]) {
        const dotExtension = normalizeExtension(file.extension, {
          withDot: true,
        });
        const errorMessage = `【${file.name}${dotExtension}】${file.message}`;
        setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
      }
    }

    return response;
  };

  return {
    deleteFile,
    deleteFiles,
    deleteFolder,
  };
};
