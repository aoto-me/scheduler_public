/**
 * カードのサムネイル情報
 */
export interface CardThumbnail {
  cardId: number;
  file: string;
}

/**
 * Diaryのカード情報
 */
export interface DiaryCard {
  date: string;
  id: number;
  title: string;
  updated: string;
}

/**
 * Galleryのカード情報
 */
export interface GalleryCard {
  date: null | string;
  galleryId: number;
  id: number;
  sort: number;
  title: string;
  updated: string;
}

export type GalleryType = 'card' | 'diary' | 'img' | 'unselect';
export type GalleryTypeWithNull = GalleryType | null;

/**
 * 画像アイテムの情報
 * - cardId: null | number
 * - extension: string ("." なし)
 * - name: string (拡張子を除いたファイル名)
 */
export interface ImageItem {
  cardId: null | number;
  extension: string;
  id: number;
  name: string;
  sort: number;
  url: string;
}

/**
 * DBから取得した画像アイテムの情報
 * - cardId: number | null
 * - file: string (ファイル名)
 */
export interface ResponseGalleryItem {
  cardId: null | number;
  file: string;
  galleryId: number;
  id: number;
  sort: number;
}
