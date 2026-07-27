import { test as base, type Browser } from '@playwright/test';
import { FilePostPage } from '../pages/FilePostPage.js';

const LIFECYCLE_FOLDER = 'e2e-test-folder';

// テスト用フォルダを作成し、そのURL（/file/test/:folderName）を返す
const setupFilePost = async (browser: Browser, baseURL: string): Promise<string> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const filePage = new FilePostPage(page);

  // 前回テストで残ったフォルダを削除
  for (const folderBase of [LIFECYCLE_FOLDER, '新規フォルダ']) {
    // フォルダ名に番号付けがある場合もあるので、最大(5)まで想定
    for (let i = 0; i <= 5; i++) {
      const name = i === 0 ? folderBase : `${folderBase}(${String(i)})`;
      await page.goto(`/file/${name}`);
      await page.waitForLoadState('networkidle');
      const btn = page.getByRole('button', { name: 'フォルダを削除' });
      if (await btn.isVisible()) {
        page.once('dialog', dialog => dialog.accept());
        await btn.click();
        await page.waitForURL('/file');
      }
    }
  }

  // 新規フォルダ作成 + リネーム
  await page.goto('/file');
  await filePage.expectDirectoryTreeVisible();
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/backend/api/file/folder/') && resp.request().method() === 'POST'
  );
  await filePage.clickAddFolderButton();
  const apiResp = await responsePromise;
  const { result: createdFolderName } = (await apiResp.json()) as { result: string };
  await filePage.expectNewFolderVisible();
  await filePage.getTreeItem(createdFolderName).click();
  await page.waitForURL(/\/file\/.+/);
  await filePage.clickEditFolderName();
  await filePage.fillFolderNameField(LIFECYCLE_FOLDER);
  await filePage.pressSaveFolderName();
  await page.waitForURL(`**/file/${LIFECYCLE_FOLDER}`);

  await context.close();
  return `/file/${LIFECYCLE_FOLDER}`;
};

// テスト用フォルダを削除する後処理
const teardownFilePost = async (browser: Browser, url: string, baseURL: string) => {
  if (!url) return;
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const btn = page.getByRole('button', { name: 'フォルダを削除' });
  if (await btn.isVisible()) {
    page.once('dialog', dialog => dialog.accept());
    await btn.click();
    await page.waitForURL('/file');
  }
  await context.close();
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    filePage: FilePostPage;
    filePostPage: FilePostPage;
  },
  {
    filePostUrl: string;
  }
>({
  filePage: async ({ page }, use) => {
    const filePage = new FilePostPage(page);
    await filePage.goto();
    await filePage.expectDirectoryTreeVisible();
    await use(filePage);
  },

  filePostPage: async ({ filePostUrl, page }, use) => {
    await page.goto(filePostUrl);
    const filePostPage = new FilePostPage(page);
    await filePostPage.expectFolderNameVisible(LIFECYCLE_FOLDER);
    await use(filePostPage);
  },

  filePostUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupFilePost(browser, baseURL);
      await use(url);
      await teardownFilePost(browser, url, baseURL);
    },
    { scope: 'worker' },
  ],
});
