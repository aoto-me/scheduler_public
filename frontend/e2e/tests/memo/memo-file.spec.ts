import type { Page } from '@playwright/test';
import { test } from '../../fixtures/memoFixture.js';
import { MemoPage } from '../../pages/MemoPage.js';
import {
  deleteSampleFile,
  runFileGridBulkTests,
  runFileGridItemTests,
  runFileUploaderTests,
  uploadSampleFile,
} from '../../utils/helpers/fileTestHelpers.js';
import type { FilePage } from '../../utils/helpers/fileTestHelpers.js';

let memoPostPage: MemoPage;

test.beforeEach(({ memoPostPage: currentPage }) => {
  memoPostPage = currentPage;
});

const getPage = (): FilePage => ({
  fileGrid: memoPostPage.fileGrid,
  fileUploader: memoPostPage.fileUploader,
});

// beforeAll でアップロード/削除する際、タブ切り替えを含めてページを準備する
const prepareMemoFilePage = async (page: Page): Promise<FilePage> => {
  const memoPage = new MemoPage(page);
  await memoPage.tabs.expectVisible();
  await memoPage.tabs.clickTab('ファイル');
  return { fileGrid: memoPage.fileGrid, fileUploader: memoPage.fileUploader };
};

// アップロード後の共通後処理（ボタン非表示確認 → リロード → タブ再選択）
const afterUpload = async (page: Page): Promise<void> => {
  await memoPostPage.fileUploader.expectUploadButtonHidden();
  await page.reload();
  await memoPostPage.tabs.expectVisible();
  await memoPostPage.tabs.clickTab('ファイル');
};

test.describe.serial('MemoPost > FileUploader', () => {
  test.beforeEach(async () => {
    await memoPostPage.tabs.clickTab('ファイル');
    await memoPostPage.tabs.expectTabActive('ファイル');
  });

  runFileUploaderTests(test, getPage, { afterUpload });
});

test.describe.serial('MemoPost > FileGrid > 操作ボタン', () => {
  test.beforeAll(async ({ browser, memoPostUrl }, workerInfo) => {
    await uploadSampleFile(browser, memoPostUrl, workerInfo.project.use.baseURL ?? '', prepareMemoFilePage);
  });

  test.afterAll(async ({ browser, memoPostUrl }, workerInfo) => {
    await deleteSampleFile(browser, memoPostUrl, workerInfo.project.use.baseURL ?? '', prepareMemoFilePage);
  });

  test.beforeEach(async () => {
    await memoPostPage.tabs.clickTab('ファイル');
    await memoPostPage.tabs.expectTabActive('ファイル');
  });

  runFileGridBulkTests(test, getPage, { afterUpload });
});

test.describe.serial('MemoPost > FileGrid > 個別ファイル操作', () => {
  test.beforeAll(async ({ browser, memoPostUrl }, workerInfo) => {
    await uploadSampleFile(browser, memoPostUrl, workerInfo.project.use.baseURL ?? '', prepareMemoFilePage);
  });

  test.beforeEach(async () => {
    await memoPostPage.tabs.clickTab('ファイル');
    await memoPostPage.tabs.expectTabActive('ファイル');
  });

  runFileGridItemTests(test, getPage, { afterUpload });
});
