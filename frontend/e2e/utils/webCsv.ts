import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface WebCsvRow {
  date: string;
  error: string;
  siteName: string;
  url: string;
}

export const errorRows = (rows: WebCsvRow[]): WebCsvRow[] => rows.filter(r => !!r.error);

export const loadWebCsv = (): WebCsvRow[] => {
  const csvPath = path.resolve('public/web/user1/url.csv');
  const lines = readFileSync(csvPath, 'utf8').trim().split('\n').slice(1); // ヘッダー除去
  return lines.map(line => {
    const parts = line.split(',');
    return {
      date: parts[5],
      error: (parts[6] ?? '').trim(),
      siteName: parts[1],
      url: parts[0],
    };
  });
};

export const normalRows = (rows: WebCsvRow[]): WebCsvRow[] => rows.filter(r => !r.error);

// 日付を yyyy年MM月dd日 形式で返す
export const uniqueDates = (rows: WebCsvRow[]): string[] => {
  const dates = normalRows(rows).map(r => {
    const [year, month, day] = r.date.split('-');
    return `${year}年${month}月${day}日`;
  });
  return [...new Set(dates)];
};
