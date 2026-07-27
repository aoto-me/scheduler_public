import { API_ENDPOINTS, thumbExtensions } from '@/configs';
import { setDirectories, setDirectoryFiles, useAppDispatch } from '@/redux';
import type { DirectoryStructure, FileItem } from '@/types';
import { normalizePath } from '@/utils';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchFile = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * アップロードフォルダ全体のフォルダ階層を取得
   */
  const fetchDirectories = async (): Promise<DirectoryStructure | null> => {
    const table = 'directories';

    const response = await getRequest<DirectoryStructure>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setDirectories(response));

    return response;
  };

  /**
   * 対象ディレクトリのファイル一覧を取得
   */
  const fetchFolderFiles = async (path: string): Promise<FileItem[] | null> => {
    const table = 'folder';

    const response = await getRequest<FileItem[]>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      queryParams: {
        path: normalizePath(path, { endSlash: 'keep' }),
      },
    });

    if (!response) return null;

    // PHP側で生成した'_thumb'末尾の画像も表示させると、同じ画像が2つ表示されるため、
    // thumbExtensionsに拡張子が一致 かつ ファイル末尾が'_thumb'のものは除外する
    const filteredFileList: FileItem[] = [];
    for (const file of response) {
      const isThumb = thumbExtensions.includes(file.extension.toLowerCase()) && file.name.endsWith('_thumb');
      if (!isThumb) {
        filteredFileList.push(file);
      }
    }

    dispatch(setDirectoryFiles({ files: filteredFileList, path: normalizePath(path) }));

    return filteredFileList;
  };

  /**
   * 検索ワードにファイル名が一致するファイルを取得
   */
  const searchFiles = async (word: string): Promise<FileItem[] | null> => {
    const table = 'search';

    const response = await getRequest<FileItem[]>({
      apiUrl: `${API_ENDPOINTS.file}${table}/`,
      queryParams: {
        word,
      },
    });

    if (!response) return null;

    // PHP側で生成した'_thumb'末尾の画像も表示させると、同じ画像が2つ表示されるため、
    // thumbExtensionsに拡張子が一致 かつ ファイル末尾が'_thumb'のものは除外する
    const filteredFileList: FileItem[] = [];
    for (const file of response) {
      const isThumb = thumbExtensions.includes(file.extension.toLowerCase()) && file.name.endsWith('_thumb');
      if (!isThumb) {
        filteredFileList.push(file);
      }
    }

    return filteredFileList;
  };

  return {
    fetchDirectories,
    fetchFolderFiles,
    searchFiles,
  };
};
