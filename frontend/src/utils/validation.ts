import { excludeExtensions } from '@/configs';
import type { FileError } from 'react-dropzone';

/**
 * 正の整数かどうか（0はfalse）
 * @param value - 任意の値
 * @returns true: 正の整数 / false: 正の整数以外
 */
export const validatePositiveInteger = (value: unknown): boolean => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

/**
 * 0以上の数値かどうか（0はtrue, 小数はtrue）
 * @param value - 任意の値
 * @returns true: 0以上の数値 / false: それ以外
 */
export const validateNonNegativeNumber = (value: unknown): boolean => {
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  return value >= 0;
};

/**
 * 空文字またはスペースのみでないか
 * @param value - 文字列
 * @returns true: テキストあり / false: 空白のみ
 */
export const validateNonBlank = (value: string): boolean => {
  if (value.trim().length === 0) return false;
  return true;
};

/**
 * 空白でないか、また文字数制限内か
 * @param value - 入力文字列
 * @param maxLength - 最大文字数（省略可）
 * @returns true: 問題なし / false: 空白もしくは文字数オーバー
 */
export const validateText = (value: string, maxLength?: number): boolean => {
  if (!validateNonBlank(value)) return false;
  if (maxLength !== undefined && value.length > maxLength) {
    return false;
  }

  return true;
};

/**
 * Date型かつ有効な日付かどうか
 * @param value - 任意の値
 * @returns true: Dateで有効 / false: それ以外
 */
export const validateDate = (value: unknown): boolean => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

/**
 * 無効なファイル名かどうか
 * - 禁止文字（/, \, *, ?, ", <, >, |, `）
 * - 空白や改行を含む
 * - 空文字やスペースのみ
 * - 末尾が_thumb
 * - .から始まる
 *
 * @param value - ファイル名の文字列
 * @returns true: 問題なし / false: 問題あり
 */
export const validateFileName = (value: string): boolean => {
  const invalidChars = /[/\\:*?"<>|`\r\n]/;
  const hasWhitespace = /\s/;

  if (
    invalidChars.test(value) ||
    hasWhitespace.test(value) ||
    value.trim() === '' ||
    value.endsWith('_thumb') ||
    value.startsWith('.')
  ) {
    return false;
  }

  return true;
};

/**
 * 無効なフォルダ名かどうか
 * - 禁止文字（/, \, :, *, ?, ", <, >, |, .）
 * - 半角・全角・改行などすべての空白
 * - 空文字・スペースのみ
 * - tmp と tmp_zip は利用不可
 *
 * @param value - フォルダ名
 * @returns true: 問題なし / false: 問題あり
 */
export const validateFolderName = (value: string): boolean => {
  const invalidChars = /[/\\:*?"<>|.]/;
  const hasWhitespace = /\s/;

  if (
    value.trim() === '' ||
    invalidChars.test(value) ||
    hasWhitespace.test(value) ||
    value.trim() === 'tmp' ||
    value.trim() === 'tmp_zip'
  ) {
    return false;
  }

  return true;
};

/**
 * アップロードファイルのバリデーションチェック
 * @param file - File
 * @returns null: 問題なし / {code, message}: 問題あり
 * - code：react-dropzone のエラーコード
 * - message：アラートへの表示用のテキスト
 */
export const uploadFileValidator = (file: File): FileError | null => {
  if (!file.name) {
    return {
      code: 'invalid-file',
      message: '無効なファイルが選択されました',
    };
  }

  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

  if (fileNameWithoutExt.endsWith('_thumb')) {
    return {
      code: 'invalid-file',
      message: '末尾が_thumbのファイルはアップロードできません',
    };
  }

  if (file.name.startsWith('.')) {
    return {
      code: 'invalid-file',
      message: '.から始まるファイルはアップロードできません',
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && excludeExtensions.includes(extension)) {
    return {
      code: 'dangerous-extension',
      message: `.${extension} の拡張子のファイルはアップロードできません`,
    };
  }

  return null;
};
