import { test as base, type Browser } from '@playwright/test';
import { DrawerMenu } from '../components/DrawerMenu.js';
import { MemoPage } from '../pages/MemoPage.js';

// テスト用の「メモ詳細ページ」を1つ作成し、そのURL（/memo/:id）を返す
// baseURLを受け取る：
// browser.newContext() はplaywright.config.tsの設定を引き継がないため、
// 相対URL（/memo など）を使うには baseURL を明示的に渡す必要がある
const setupMemoPost = async (browser: Browser, baseURL: string): Promise<string> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto('/memo');
  const menu = new DrawerMenu(page, 'メモ一覧');
  await menu.expectVisible();
  // 新規メモ作成
  const link = await menu.addPage();
  const href = await link.getAttribute('href');
  // コンテキストはもう不要なので閉じる
  await context.close();
  // URLを返す
  return href ?? '';
};

// setupで作ったメモを削除する後処理
const teardownMemoPost = async (browser: Browser, url: string, baseURL: string) => {
  // URLがない場合は何もしない
  if (!url) return;

  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();

  await page.goto('/memo');

  const menu = new DrawerMenu(page, 'メモ一覧');
  await menu.expectVisible();

  // URLに対応するメモを削除
  await menu.deletePage(page.locator(`a[href="${url}"]`));

  await context.close();
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    memoPage: MemoPage;
    memoPostPage: MemoPage;
  },
  {
    memoPostUrl: string;
  }
>({
  memoPage: async ({ page }, use) => {
    const memoPage = new MemoPage(page);
    await memoPage.goto();
    await memoPage.menu.expectVisible();
    await use(memoPage);
  },

  memoPostPage: async ({ memoPostUrl, page }, use) => {
    await page.goto(memoPostUrl);

    const memoPage = new MemoPage(page);
    await memoPage.tabs.expectVisible();

    await use(memoPage);
  },

  memoPostUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupMemoPost(browser, baseURL);
      await use(url);
      await teardownMemoPost(browser, url, baseURL);
    },
    { scope: 'worker' },
  ],
});
