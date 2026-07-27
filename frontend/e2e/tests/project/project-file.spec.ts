import type { Page } from '@playwright/test';
import { test } from '../../fixtures/projectFixture.js';
import { ProjectPage } from '../../pages/ProjectPage.js';
import {
  deleteSampleFile,
  runFileGridBulkTests,
  runFileGridItemTests,
  runFileUploaderTests,
  uploadSampleFile,
} from '../../utils/helpers/fileTestHelpers.js';
import type { FilePage } from '../../utils/helpers/fileTestHelpers.js';

let projectPostPage: ProjectPage;

test.beforeEach(({ projectPostPage: currentPage }) => {
  projectPostPage = currentPage;
});

const getPage = (): FilePage => ({
  fileGrid: projectPostPage.fileGrid,
  fileUploader: projectPostPage.fileUploader,
});

// beforeAll でアップロード/削除する際、タブ切り替えを含めてページを準備する
const prepareProjectFilePage = async (page: Page): Promise<FilePage> => {
  const projectPage = new ProjectPage(page);
  await projectPage.tabs.expectVisible();
  await projectPage.tabs.clickTab('ファイル');
  return { fileGrid: projectPage.fileGrid, fileUploader: projectPage.fileUploader };
};

// アップロード後の共通後処理（ボタン非表示確認 → リロード → タブ再選択）
const afterUpload = async (page: Page): Promise<void> => {
  await projectPostPage.fileUploader.expectUploadButtonHidden();
  await page.reload();
  await projectPostPage.tabs.expectVisible();
  await projectPostPage.tabs.clickTab('ファイル');
};

test.describe.serial('ProjectPost > FileUploader', () => {
  test.beforeEach(async () => {
    await projectPostPage.tabs.clickTab('ファイル');
    await projectPostPage.tabs.expectTabActive('ファイル');
  });

  runFileUploaderTests(test, getPage, { afterUpload });
});

test.describe.serial('ProjectPost > FileGrid > 操作ボタン', () => {
  test.beforeAll(async ({ browser, projectPostUrl }, workerInfo) => {
    await uploadSampleFile(browser, projectPostUrl, workerInfo.project.use.baseURL ?? '', prepareProjectFilePage);
  });

  test.afterAll(async ({ browser, projectPostUrl }, workerInfo) => {
    await deleteSampleFile(browser, projectPostUrl, workerInfo.project.use.baseURL ?? '', prepareProjectFilePage);
  });

  test.beforeEach(async () => {
    await projectPostPage.tabs.clickTab('ファイル');
    await projectPostPage.tabs.expectTabActive('ファイル');
  });

  runFileGridBulkTests(test, getPage, { afterUpload });
});

test.describe.serial('ProjectPost > FileGrid > 個別ファイル操作', () => {
  test.beforeAll(async ({ browser, projectPostUrl }, workerInfo) => {
    await uploadSampleFile(browser, projectPostUrl, workerInfo.project.use.baseURL ?? '', prepareProjectFilePage);
  });

  test.beforeEach(async () => {
    await projectPostPage.tabs.clickTab('ファイル');
    await projectPostPage.tabs.expectTabActive('ファイル');
  });

  runFileGridItemTests(test, getPage, { afterUpload });
});
