import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { test } from '../../fixtures/fileFixture.js';
import { FilePostPage } from '../../pages/FilePostPage.js';
import {
  deleteSampleFile,
  runFileGridBulkTests,
  runFileGridItemTests,
  runFileUploaderTests,
  uploadSampleFile,
} from '../../utils/helpers/fileTestHelpers.js';
import type { FilePage } from '../../utils/helpers/fileTestHelpers.js';

const LIFECYCLE_FOLDER = 'e2e-test-folder';
const LIFECYCLE_URL = `/file/${LIFECYCLE_FOLDER}`;

// モジュールレベルに置くと「FilePost > 削除」テストでもフィクスチャが要求され、
// フォルダ削除後の次テストでセットアップ（expectFolderNameVisible）が失敗する。
let filePostPage: FilePostPage;

const getPage = (): FilePage => ({
  fileGrid: filePostPage.fileGrid,
  fileUploader: filePostPage.fileUploader,
});

// beforeAll でアップロード/削除する際のページ準備（タブなし）
const prepareFilePostPage = (page: Page): Promise<FilePage> => {
  const filePage = new FilePostPage(page);
  return Promise.resolve({ fileGrid: filePage.fileGrid, fileUploader: filePage.fileUploader });
};

// アップロード後の共通後処理（networkidle 待機 → ボタン非表示確認）
const afterUpload = async (page: Page): Promise<void> => {
  await page.waitForLoadState('networkidle');
  await filePostPage.fileUploader.expectUploadButtonHidden();
};

test.describe('FilePost', () => {
  test('パンくずリストが表示される', async ({ filePostPage }) => {
    await filePostPage.expectBreadcrumbsVisible();
  });

  test('フォルダ名が h1 として表示される', async ({ filePostPage }) => {
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });
});

test.describe('FilePost > FolderName', () => {
  test('編集ボタンをクリックすると TextField が表示される', async ({ filePostPage, page }) => {
    await filePostPage.clickEditFolderName();
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('Enterキーでフォルダ名を変更できる', async ({ filePostPage, page }) => {
    const TEMP_NAME = `${LIFECYCLE_FOLDER}-rename`;
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField(TEMP_NAME);
    await filePostPage.pressSaveFolderName();
    await page.waitForURL(`**/file/${TEMP_NAME}`);
    await filePostPage.expectFolderNameVisible(TEMP_NAME);
    // 元に戻す
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField(LIFECYCLE_FOLDER);
    await filePostPage.pressSaveFolderName();
    await page.waitForURL(`**${LIFECYCLE_URL}`);
  });

  test('保存ボタンでフォルダ名を変更できる', async ({ filePostPage, page }) => {
    const TEMP_NAME = `${LIFECYCLE_FOLDER}-rename2`;
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField(TEMP_NAME);
    await filePostPage.clickSaveFolderName();
    await page.waitForURL(`**/file/${TEMP_NAME}`);
    await filePostPage.expectFolderNameVisible(TEMP_NAME);
    // 元に戻す
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField(LIFECYCLE_FOLDER);
    await filePostPage.pressSaveFolderName();
    await page.waitForURL(`**${LIFECYCLE_URL}`);
  });

  test('バリデーション：空文字でエラーが出る', async ({ filePostPage }) => {
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField('');
    await filePostPage.expectFolderNameHelperText('未入力です');
    await filePostPage.pressSaveFolderName();
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });

  test('バリデーション：禁止文字でエラーが出る', async ({ filePostPage }) => {
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField('invalid/name');
    await filePostPage.expectFolderNameHelperText('使用できない文字が含まれています');
    await filePostPage.pressSaveFolderName();
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });

  test('バリデーション：空白のみでエラーが出る', async ({ filePostPage }) => {
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField('   ');
    await filePostPage.expectFolderNameHelperText('未入力です');
    await filePostPage.pressSaveFolderName();
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });

  test('バリデーション：禁止名 tmp でエラーが出る', async ({ filePostPage }) => {
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField('tmp');
    await filePostPage.expectFolderNameHelperText('使用できない文字が含まれています');
    await filePostPage.pressSaveFolderName();
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });

  test('エラー状態で保存ボタンを押すと元の名前に戻る', async ({ filePostPage }) => {
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField('');
    await filePostPage.expectFolderNameHelperText('未入力です');
    await filePostPage.clickSaveFolderName();
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });

  test('エラー状態でEnterキーを押すと元の名前に戻る', async ({ filePostPage }) => {
    await filePostPage.clickEditFolderName();
    await filePostPage.fillFolderNameField('invalid/name');
    await filePostPage.expectFolderNameHelperText('使用できない文字が含まれています');
    await filePostPage.pressSaveFolderName();
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
  });
});

test.describe('FilePost > FileUploader', () => {
  test.beforeEach(({ filePostPage: p }) => {
    filePostPage = p;
  });

  runFileUploaderTests(test, getPage, { afterUpload });
});

test.describe('FilePost > FileGrid > 操作ボタン', () => {
  test.beforeAll(async ({ browser, filePostUrl }, workerInfo) => {
    await uploadSampleFile(browser, filePostUrl, workerInfo.project.use.baseURL ?? '', prepareFilePostPage, page =>
      page.waitForLoadState('networkidle')
    );
  });

  test.afterAll(async ({ browser, filePostUrl }, workerInfo) => {
    await deleteSampleFile(browser, filePostUrl, workerInfo.project.use.baseURL ?? '', prepareFilePostPage);
  });

  test.beforeEach(({ filePostPage: p }) => {
    filePostPage = p;
  });

  runFileGridBulkTests(test, getPage, { afterUpload, selectAllCount: 'dynamic' });
});

test.describe('FilePost > FileGrid > 個別ファイル操作', () => {
  test.beforeAll(async ({ browser, filePostUrl }, workerInfo) => {
    await uploadSampleFile(browser, filePostUrl, workerInfo.project.use.baseURL ?? '', prepareFilePostPage, page =>
      page.waitForLoadState('networkidle')
    );
  });

  test.beforeEach(({ filePostPage: currentPage }) => {
    filePostPage = currentPage;
  });

  runFileGridItemTests(test, getPage, { afterUpload });
});

test.describe('FilePost > 削除', () => {
  test('フォルダを削除すると/fileに遷移する', async ({ filePostPage, page }) => {
    page.once('dialog', dialog => dialog.accept());
    await filePostPage.clickDeleteFolder();
    await page.waitForURL('/file');
    await expect(page).toHaveURL('/file');
  });

  test('diaryでは変更・削除ボタンが非表示', async ({ filePage, page }) => {
    await page.goto('/file/diary');
    await filePage.expectFolderActionsHidden();
  });
});
