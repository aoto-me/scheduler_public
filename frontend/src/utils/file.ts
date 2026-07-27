/**
 * ファイル名を 名前 と 拡張子 に分割する
 * - 拡張子は.なし
 */
export const splitFileName = (fileName: string): { extension: string; name: string } => {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return { extension: '', name: fileName };
  }

  const name = fileName.slice(0, lastDotIndex);
  const extension = fileName.slice(lastDotIndex + 1);

  return { extension, name };
};

interface ExtensionFormat {
  lowerCase?: boolean;
  withDot?: boolean;
}

/**
 * 拡張子の正規化
 * @param extension
 * @param options - 出力形式の指定
 * - lowerCase：小文字で返す(default:false)
 * - withDot：. をつける(default:false)
 */
export const normalizeExtension = (extension: null | string | undefined, options: ExtensionFormat = {}): string => {
  if (!extension) return '';

  const { lowerCase = false, withDot = false } = options;

  let result = extension.replace(/^\./, '');

  if (lowerCase) {
    result = result.toLowerCase();
  }

  if (withDot) {
    result = `.${result}`;
  }

  return result;
};

/**
 * バイトの単位を変換する
 */
export const formatFileSize = (bytes: number, decimalPlaces = 2): string => {
  if (bytes === 0) return '0 KB'; // 0バイトも "0 KB" として扱う

  const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(1024)) - 1); // 最低でも KB (i=0) になるように調整
  const size = (bytes / 1024 ** (i + 1)).toFixed(decimalPlaces);

  return `${size} ${units[i]}`;
};

interface NormalizePathOptions {
  endSlash?: 'keep' | 'remove';
  removeFilePrefix?: boolean;
}

/**
 * パスの正規化
 * @param path
 * @param options - 出力形式の指定
 * - 日本語のデコード & 先頭のスラッシュなしは固定
 * - endSlash：末尾スラッシュの有無(default:'remove')
 * - removeFilePrefix：先頭の'/file' や '/file/' を消すか(default:true)
 */
export const normalizePath = (path: string, options: NormalizePathOptions = {}): string => {
  const { endSlash = 'remove', removeFilePrefix = true } = options;

  if (!path) return '';

  let result = path;

  // URLデコード（日本語対応）
  try {
    result = decodeURIComponent(result);
  } catch {
    // デコードできないなら元のpathをそのまま使う
  }

  // 先頭の / を削除
  result = result.replace(/^\/+/, '');

  // file プレフィックスを削除
  if (removeFilePrefix) {
    result = result.replace(/^file\/?/, '');
  }

  // 連続スラッシュ対策
  result = result.replaceAll(/\/+/g, '/');

  // 末尾スラッシュの扱い
  if (endSlash === 'remove') {
    result = result.replace(/\/$/, '');
  } else if (result !== '') {
    result = result.replace(/\/?$/, '/');
  }

  return result;
};

/**
 * ファイル表示用のURLを生成
 */
export const createFileUrl = (file: string, path = ''): string => {
  const fileApi = '/backend/public/getFile.php';
  const normalizedPath = normalizePath(path, { endSlash: 'keep' });
  const params = new URLSearchParams({ file, path: normalizedPath });
  return `${fileApi}?${params.toString()}`;
};
