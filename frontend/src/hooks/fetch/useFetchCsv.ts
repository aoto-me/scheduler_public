import { useAuthContext, useErrorContext } from '@/contexts';
import { setWebCsv, useAppDispatch } from '@/redux';
import type { WebCSV } from '@/types';
import { normalizeDateStr } from '@/utils';
import * as Papa from 'papaparse';
import type { ParseResult } from 'papaparse';

/**
 * WebCSVを日付別にデータを分類
 */
const groupByDate = (data: WebCSV[]): Record<string, WebCSV[]> => {
  // 日付ごとにまとめるための、分類用の一時的な入れ物
  const grouped: Record<string, WebCSV[]> = {};

  for (const item of data) {
    const normalized = normalizeDateStr(item.date);
    if (!normalized) continue; // 無効な日付は無視
    if (!(normalized in grouped)) grouped[normalized] = []; // 日付がなければ初期化
    grouped[normalized].push(item);
  }

  // キーを新しい日付順に並べて返す
  const sortedDate = Object.entries(grouped).sort(
    ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
  );

  // grouped は分類用なので、日付順に並び替えた新しいオブジェクトを作る
  const sortedGrouped: Record<string, WebCSV[]> = {};
  for (const [date, items] of sortedDate) {
    sortedGrouped[date] = items;
  }

  return sortedGrouped;
};

export const useFetchCsv = () => {
  const { userId } = useAuthContext();
  const { setErrors } = useErrorContext();
  const dispatch = useAppDispatch();
  const isDev = import.meta.env.DEV;

  /**
   * webCsv
   */
  const fetchWebCsv = async (): Promise<null | {
    errorWebCsv: WebCSV[];
    webCsv: Record<string, WebCSV[]>;
  }> => {
    const name = 'webCsv';
    try {
      const response = await fetch(`/web/user${String(userId)}/url.csv`);
      const csvText = await response.text();

      const parsed: ParseResult<WebCSV> = Papa.parse<WebCSV>(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      // errorの有無で分割
      const withError: WebCSV[] = [];
      const withoutError: WebCSV[] = [];
      for (const item of parsed.data) {
        if (item.error.trim() === '') {
          withoutError.push(item);
        } else {
          withError.push(item);
        }
      }

      const groupedWebCsv = groupByDate(withoutError); // 日付ごとにグループ化
      dispatch(setWebCsv({ data: groupedWebCsv, error: withError }));

      if (isDev) console.log(`fetch${name}：${name}の取得`, groupedWebCsv);

      return { errorWebCsv: withError, webCsv: groupedWebCsv };
    } catch (error) {
      const errorMessage = `${name}の取得に失敗しました`;
      setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
      if (isDev) console.error(error);
      return null; // throw せず null を返す
    }
  };

  return {
    fetchWebCsv,
  };
};
