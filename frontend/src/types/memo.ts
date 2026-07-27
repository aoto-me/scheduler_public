import type { JSONContent } from '@tiptap/core';

/**
 * Memoデータ
 */
export interface Memo {
  content: JSONContent | string;
  id: number;
  title: string;
}
