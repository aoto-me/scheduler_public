import type { JSONContent } from '@tiptap/core';

/**
 * Projectデータ
 */
export interface Project {
  content: JSONContent | string;
  end: null | string;
  id: number;
  title: string;
}

/**
 * Sectionデータ
 * - sectionId: string (sec_0, sec_1…)
 */
export interface Section {
  id: number;
  name: string;
  projectId: number;
  sectionId: string;
  sort: number;
}
