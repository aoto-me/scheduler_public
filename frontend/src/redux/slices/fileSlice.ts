import type { DirectoryStructure, FileItem } from '@/types/file';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface FileState {
  directories: DirectoryStructure | null; // アップロードフォルダのディレクトリ階層
  fetched: boolean;
  filesByDirectory: Record<
    string,
    | undefined
    | {
        fetched: boolean;
        files: FileItem[];
      }
  >;
  invalidDirectoryPath: string[]; // 次回のページ読み込み時に削除予定のディレクトリ
  selectedDirectory: null | string;
}

const initialState: FileState = {
  directories: null,
  fetched: false,
  filesByDirectory: {},
  invalidDirectoryPath: [],
  selectedDirectory: null,
};

export const fileSlice = createSlice({
  initialState,
  name: 'file',
  reducers: {
    /**
     * ディレクトリの追加
     */
    addDirectory: (state, action: PayloadAction<{ name: string; path: string }>) => {
      const { name, path } = action.payload;

      const pathArray = path.split('/').filter(Boolean);

      if (!state.directories) return;

      let target = state.directories;
      for (const folder of pathArray) {
        // まだフォルダが存在しなければ空オブジェクトを作成
        target[folder] ??= {};
        // 一段下に潜る
        target = target[folder];
      }

      // 新しいディレクトリを追加
      target[name] ??= {};
    },

    /**
     * ディレクトリの削除
     */
    removeDirectory: (state, action: PayloadAction<string>) => {
      const path = action.payload;

      if (!state.directories) return;

      const splitPath = path.split('/').filter(Boolean);
      const folderName = splitPath[splitPath.length - 1];
      const parentPath = splitPath.slice(0, -1);

      // 1. directoriesから対象のフォルダを削除
      let target = state.directories;
      // 削除ディレクトリの親ディレクトリを探す
      for (const folder of parentPath) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!target[folder]) return; // 指定したpathが存在しない
        target = target[folder]; // 1つ下の階層へ下がる
      }
      delete target[folderName];

      // 2. filesByDirectory の削除予定にパスをセット
      state.invalidDirectoryPath.push(path);
    },

    /**
     * 特定のディレクトリを FilesByDirectory から削除
     */
    removeFilesByDirectory: (state, action: PayloadAction<string[]>) => {
      const pathes = action.payload;

      for (const targetPath of pathes) {
        state.filesByDirectory = Object.fromEntries(
          Object.entries(state.filesByDirectory).filter(
            ([path]) => path !== targetPath && !path.startsWith(`${targetPath}/`)
          )
        );
      }

      state.invalidDirectoryPath = [];
    },

    /**
     * Directories の登録
     */
    setDirectories: (state, action: PayloadAction<DirectoryStructure>) => {
      const { tmp: _, tmp_zip: __, ...filteredDirectories } = action.payload;

      state.directories = filteredDirectories;
      state.fetched = true;
    },

    /**
     * 取得したファイル一覧を filesByDirectory に追加
     */
    setDirectoryFiles: (state, action: PayloadAction<{ files: FileItem[]; path: string }>) => {
      const { files, path } = action.payload;
      state.filesByDirectory[path] = {
        fetched: true,
        files,
      };
    },

    /**
     * 次回削除予定のディレクトリを登録
     */
    setInvalidDirectoryPath: (state, action: PayloadAction<null | string>) => {
      const path = action.payload;
      if (path) state.invalidDirectoryPath.push(path);
    },

    /**
     * 選択中のディレクトリの登録
     */
    setSelectedDirectory: (state, action: PayloadAction<string>) => {
      const directory = action.payload;
      state.selectedDirectory = directory;
    },

    /**
     * ディレクトリ階層の再取得のための fetched の切り替え
     */
    updateDirectoryFetched: (state, action: PayloadAction<boolean>) => {
      state.fetched = action.payload;
    },

    /**
     * 特定のディレクトリのファイル一覧を再取得のための fetched の切り替え
     */
    updateDirectoryFiles: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const entry = state.filesByDirectory[path];
      if (!entry) return;

      entry.fetched = false;
    },
  },
});

export const {
  addDirectory,
  removeDirectory,
  removeFilesByDirectory,
  setDirectories,
  setDirectoryFiles,
  setInvalidDirectoryPath,
  setSelectedDirectory,
  updateDirectoryFetched,
  updateDirectoryFiles,
} = fileSlice.actions;

export default fileSlice.reducer;

export const selectDirectories = (state: RootState) => state.file.directories;

export const selectDirectoryFetched = (state: RootState) => state.file.fetched;

export const selectSelectedDirectory = (state: RootState) => state.file.selectedDirectory;

export const selectFilesByDirectory = (state: RootState) => state.file.filesByDirectory;

export const selectInvalidDirectoryPath = (state: RootState) => state.file.invalidDirectoryPath;

const emptyFiles = {
  fetched: false,
  files: [] as FileItem[],
} as const;

// 選択中のディレクトリのファイル情報を取得
export const selectDirectoryFiles = (decodedPath: string) => (state: RootState) => {
  return state.file.filesByDirectory[decodedPath] ?? emptyFiles;
};
