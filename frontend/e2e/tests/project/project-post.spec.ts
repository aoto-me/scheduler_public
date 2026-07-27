import { test } from '../../fixtures/projectFixture.js';
import type { ProjectPage } from '../../pages/ProjectPage.js';
import { runTabTests } from '../../utils/helpers/tabTestHelpers.js';
import { runTitleTests } from '../../utils/helpers/titleTestHelpers.js';

let projectPostPage: ProjectPage;

test.beforeEach(({ projectPostPage: currentPage }) => {
  projectPostPage = currentPage;
});

test.describe('ProjectPost', () => {
  test('パンくずリストが表示される', async ({ projectPostPage }) => {
    await projectPostPage.expectBreadcrumbsVisible();
  });
});

test.describe('ProjectPost > Tabs', () => {
  runTabTests(test, () => projectPostPage.tabs, {
    arrowLeft: { expectedTab: 'タスク', startTab: 'メモ' },
    arrowRight: { expectedTab: 'メモ' },
    clickableTabs: ['メモ', 'テーブル', 'ファイル'],
    defaultTab: 'タスク',
  });
});

test.describe('ProjectPost > EndDate', () => {
  test('終了日を入力すると変更できる（リロード/DB反映を確認）', async ({ page, projectPostPage }) => {
    await projectPostPage.expectEndDateVisible();
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/project/end/') && resp.status() === 200
    );
    await projectPostPage.selectEndDate('2025-01-01');
    await responsePromise;
    await page.reload();
    await projectPostPage.tabs.expectVisible();
    await projectPostPage.expectEndDateValue('2025-01-01');
  });

  test('終了日を入力すると残り日数が表示される', async ({ page, projectPostPage }) => {
    const endDate = '2030-01-01';
    const today = new Date();
    const expectedDays = Math.max(
      Math.floor(
        (Date.UTC(2030, 0, 1) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86_400_000
      ),
      0
    );

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/project/end/') && resp.status() === 200
    );
    await projectPostPage.selectEndDate(endDate);
    await responsePromise;
    await projectPostPage.expectRemainingDays(expectedDays);
  });
});

test.describe('ProjectPost > Title', () => {
  runTitleTests(
    test,
    () => ({
      expectReady: async () => projectPostPage.tabs.expectVisible(),
      title: projectPostPage.title,
    }),
    { newTitle: 'E2Eテスト用タイトル変更' }
  );
});
