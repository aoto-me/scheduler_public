import { test as base, type Browser } from '@playwright/test';
import { DrawerMenu } from '../components/DrawerMenu.js';
import { ProjectPage } from '../pages/ProjectPage.js';

// テスト用の「プロジェクト詳細ページ」を1つ作成し、そのURL（/project/:id）を返す
const setupProjectPost = async (browser: Browser, baseURL: string): Promise<string> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto('/project');
  const menu = new DrawerMenu(page, 'プロジェクト一覧');
  await menu.expectVisible();
  const link = await menu.addPage();
  const href = await link.getAttribute('href');
  await context.close();
  return href ?? '';
};

// setupで作ったプロジェクトを削除する後処理
const teardownProjectPost = async (browser: Browser, url: string, baseURL: string) => {
  if (!url) return;

  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();

  await page.goto('/project');

  const menu = new DrawerMenu(page, 'プロジェクト一覧');
  await menu.expectVisible();

  await menu.deletePage(page.locator(`a[href="${url}"]`));

  await context.close();
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    projectPage: ProjectPage;
    projectPostPage: ProjectPage;
  },
  {
    projectPostUrl: string;
  }
>({
  projectPage: async ({ page }, use) => {
    const projectPage = new ProjectPage(page);
    await projectPage.goto();
    await projectPage.menu.expectVisible();
    await use(projectPage);
  },

  projectPostPage: async ({ page, projectPostUrl }, use) => {
    await page.goto(projectPostUrl);

    const projectPage = new ProjectPage(page);
    await projectPage.tabs.expectVisible();

    await use(projectPage);
  },

  projectPostUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupProjectPost(browser, baseURL);
      await use(url);
      await teardownProjectPost(browser, url, baseURL);
    },
    { scope: 'worker' },
  ],
});
