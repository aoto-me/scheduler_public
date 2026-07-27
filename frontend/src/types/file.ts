/**
 * 削除に失敗したファイルの情報
 */
export interface DeleteFilesResponse {
  extension: string;
  message: string;
  name: string;
}

/**
 * フォルダ構造を表現する再帰的なオブジェクト
 * 各キーはフォルダ名であり、値は同様の構造のサブディレクトリ
 *
 * @example
 * {
 *   folderA: {
 *     folderB: {}
 *   },
 *   folderC: {}
 * }
 */
export interface DirectoryStructure {
  [folderName: string]: DirectoryStructure;
}

/**
 * ファイル情報
 * - date: string (最終更新日時/Y-m-d H:i:s)
 * - extension: string (.なしの拡張子/存在しない場合は空文字)
 * - id: number
 * - name: string (拡張子を除いたファイル名)
 * - path: string (ディレクトリのパスのみ)
 * - size: number | null (ファイルサイズ/バイト単位)
 * - url: string (ファイルURL)
 */
export interface FileItem {
  date: string;
  extension: string;
  id: number;
  name: string;
  path: string;
  size: null | number;
  url: string;
}

/**
 * アップロードしたファイルの結果のレスポンス
 */
export interface FileRequestResult {
  failedFiles: {
    error: string;
    name: string;
  }[];
  uploadedFiles: string[];
}
