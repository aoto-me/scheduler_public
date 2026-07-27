import { format, isValid, parse, parseISO } from 'date-fns';

/**
 * 日付文字列を受け取り、`yyyy-MM-dd` 形式に正規化する
 *
 * @param rawDate - 日付文字列
 * @returns `yyyy-MM-dd` 形式の文字列、解析できなかった場合は `null`を返す
 */
export const normalizeDateStr = (rawDate: string): null | string => {
  const value = rawDate.trim();
  let date: Date | null = null;

  // 1. ISO形式 (yyyy-MM-ddTHH:mm:ss)
  if (value.includes('T')) {
    const parsed = parseISO(value);
    if (isValid(parsed)) date = parsed;
  }

  // 2. yyyy-MM-dd HH:mm:ss
  if (!date) {
    const parsed = parse(value, 'yyyy-MM-dd HH:mm:ss', new Date());
    if (isValid(parsed)) date = parsed;
  }

  // 3. yyyy-MM-dd
  if (!date) {
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) date = parsed;
  }

  // 4. フォールバック
  if (!date) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }

  if (!date) return null;

  return format(date, 'yyyy-MM-dd');
};

/**
 * 日付文字列をDate型に変換する
 */
export const convertStrToDate = (dateStr: string): Date => {
  // スペース → T に統一
  let normalized = dateStr.trim().replace(' ', 'T');

  // 秒がない場合は :00 を補う（2025-10-25T00:00 → 2025-10-25T00:00:00）
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    normalized += ':00';
  }

  // ISO形式なら new Date
  if (normalized.endsWith('Z')) {
    return new Date(normalized);
  }

  // "yyyy-MM-dd'T'HH:mm:ss" 形式としてパース
  return parse(normalized, "yyyy-MM-dd'T'HH:mm:ss", new Date());
};

/**
 * 秒 ⇒ ○時間○分 に変換する
 */
export const convertSecondsToHourMinuteLabel = (seconds: number): string => {
  if (seconds < 0) {
    throw new Error('秒数は正の値である必要があります');
  }

  const totalMinutes = Math.floor(seconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  let result = '';

  if (hours > 0) {
    result += `${String(hours)}時間`;
  }

  if (remainingMinutes > 0 || result === '') {
    result += `${String(remainingMinutes)}分`;
  }

  return result;
};

/**
 * Dateやyyyy-mm-ddの文字列を年、月、日の文字列に分ける
 */
export const splitDate = (date: unknown): { day: string; month: string; year: string } => {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear()),
    };
  }

  if (typeof date === 'string') {
    const parts = date.split('-');
    const [year, month = '', day = ''] = parts;

    return {
      day: day.padStart(2, '0'),
      month: month.padStart(2, '0'),
      year: year || '',
    };
  }

  // 上記以外（null, undefined, 数値など）のとき
  return { day: '', month: '', year: '' };
};

/**
 * Date 型から キーとして利用する "yyyy-mm" 形式の文字列を返す
 */
export const formatDateToKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${String(year)}-${month}`;
};
