import path from 'node:path';
import { test } from '../../fixtures/memoFixture.js';
import type { MemoPage } from '../../pages/MemoPage.js';
import { runTableEmptyTests, runTableOperationTests } from '../../utils/helpers/tableTestHelpers.js';

const XLSX_PATH = path.join(import.meta.dirname, '../../files/sample.xlsx');

let memoPostPage: MemoPage;

test.beforeEach(({ memoPostPage: currentPage }) => {
  memoPostPage = currentPage;
});

test.describe('MemoPost > Table > テーブル未作成', () => {
  runTableEmptyTests(test, () => memoPostPage);
});

test.describe('MemoPost > Table > テーブル操作', () => {
  runTableOperationTests(test, () => memoPostPage, { apiPath: '/backend/api/table/memo', xlsxPath: XLSX_PATH });
});
