import { test } from '../../fixtures/memoFixture.js';
import type { MemoPage } from '../../pages/MemoPage.js';
import { runTabTests } from '../../utils/helpers/tabTestHelpers.js';
import { runTitleTests } from '../../utils/helpers/titleTestHelpers.js';

let memoPostPage: MemoPage;

test.beforeEach(({ memoPostPage: currentPage }) => {
  memoPostPage = currentPage;
});

test.describe('MemoPost', () => {
  test('パンくずリストが表示される', async ({ memoPostPage }) => {
    await memoPostPage.expectBreadcrumbsVisible();
  });
});

test.describe('MemoPost > Tabs', () => {
  runTabTests(test, () => memoPostPage.tabs, {
    arrowLeft: { expectedTab: 'メモ', startTab: 'テーブル' },
    arrowRight: { expectedTab: 'テーブル' },
    clickableTabs: ['テーブル', 'ファイル'],
    defaultTab: 'メモ',
  });
});

test.describe('MemoPost > Title', () => {
  runTitleTests(
    test,
    () => ({
      expectReady: async () => memoPostPage.tabs.expectVisible(),
      title: memoPostPage.title,
    }),
    { newTitle: 'E2Eテスト用タイトル変更' }
  );
});
