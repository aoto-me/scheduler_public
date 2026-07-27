import { expect, test } from '@playwright/test';
import { DataTableSection } from '../../pages/SettingPage.js';
import { runDataTableCommonTests } from '../../utils/helpers/settingTestHelpers.js';

const TEST_URL = 'https://example.com/rss';

test.describe('Settingページ > RSS', () => {
  let rssPage: DataTableSection;

  test.beforeEach(async ({ page }) => {
    rssPage = new DataTableSection(page, 'RSS', 'siteName');
    await page.goto('/setting');
    await rssPage.expectLoaded();
  });

  runDataTableCommonTests(() => rssPage, {
    defaultRow: { url: TEST_URL },
    nameField: 'siteName',
    uniquePrefix: 'rss',
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await rssPage.expectLoaded();
  });

  test('バリデーション：サイト名が空の場合', async () => {
    await rssPage.rowExpectingValidationError({ url: TEST_URL }, '【サイト名】内容を入力してください。');
  });

  test('バリデーション：サイト名が201文字以上の場合', async () => {
    await rssPage.rowExpectingValidationError(
      { siteName: 'a'.repeat(201), url: TEST_URL },
      '【サイト名】200文字以内で入力してください。'
    );
  });

  test('バリデーション：URLが空の場合', async () => {
    await rssPage.rowExpectingValidationError({ siteName: 'バリデーションテスト' }, '【URL】内容を入力してください。');
  });
});
