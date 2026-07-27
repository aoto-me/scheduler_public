/**
 * 取得したRSSの1記事
 */
export interface RSSItem {
  description: string;
  id: number;
  link: string;
  ogp: string;
  pubDate: string;
  siteName: string;
  title: string;
}

/**
 * RSSを取得したいサイト情報
 */
export interface RSSList {
  id: number;
  siteName: string;
  url: string;
}

export type RSSListWithNew = RSSList & {
  isNew: boolean;
};

/**
 * url.csvから取得したサイトの更新情報
 */
export interface WebCSV {
  date: string;
  error: string;
  ogp: string;
  siteName: string;
  url: string;
}
