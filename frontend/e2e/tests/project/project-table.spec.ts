import path from 'node:path';
import { test } from '../../fixtures/projectFixture.js';
import type { ProjectPage } from '../../pages/ProjectPage.js';
import { runTableEmptyTests, runTableOperationTests } from '../../utils/helpers/tableTestHelpers.js';

const XLSX_PATH = path.join(import.meta.dirname, '../../files/sample.xlsx');

let projectPostPage: ProjectPage;

test.beforeEach(({ projectPostPage: currentPage }) => {
  projectPostPage = currentPage;
});

test.describe('ProjectPost > Table > テーブル未作成', () => {
  runTableEmptyTests(test, () => projectPostPage);
});

test.describe('ProjectPost > Table > テーブル操作', () => {
  runTableOperationTests(test, () => projectPostPage, { apiPath: '/backend/api/table/project', xlsxPath: XLSX_PATH });
});
