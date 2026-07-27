import { expect, test } from '@playwright/test';
import { DataTableSection } from '../../pages/SettingPage.js';
import { runDataTableCommonTests } from '../../utils/helpers/settingTestHelpers.js';
import { uniqueContent } from '../../utils/testUtils.js';

const TEST_ICON = 'mail-fill';

test.describe('Settingページ > 収入カテゴリー', () => {
  let incomeCategoryPage: DataTableSection;

  test.beforeEach(async ({ page }) => {
    incomeCategoryPage = new DataTableSection(page, '収入カテゴリー');
    await page.goto('/setting');
    await incomeCategoryPage.expectLoaded();
  });

  runDataTableCommonTests(() => incomeCategoryPage, {
    defaultRow: { icon: TEST_ICON },
    uniquePrefix: 'income',
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await incomeCategoryPage.expectLoaded();
  });

  test('使用中のカテゴリーを削除しようとするとエラートーストが表示される', async ({ page }) => {
    await incomeCategoryPage.deleteFirstRow();
    await expect(page.getByText('【409】このカテゴリーは使用中のため、削除できませんでした')).toBeVisible();
    await expect(incomeCategoryPage.firstRow).toBeVisible();
  });

  test('バリデーション：アイコンが空の場合', async () => {
    await incomeCategoryPage.rowExpectingValidationError(
      { name: uniqueContent('income') },
      '【アイコン】内容を入力してください。'
    );
  });

  test('バリデーション：カテゴリー名が空の場合', async () => {
    await incomeCategoryPage.rowExpectingValidationError(
      { icon: TEST_ICON },
      '【カテゴリー名】内容を入力してください。'
    );
  });

  test('バリデーション：アイコンが51文字以上の場合', async () => {
    await incomeCategoryPage.rowExpectingValidationError(
      { icon: 'a'.repeat(51), name: uniqueContent('income') },
      '【アイコン】50文字以内で入力してください。'
    );
  });

  test('バリデーション：カテゴリー名が51文字以上の場合', async () => {
    await incomeCategoryPage.rowExpectingValidationError(
      { icon: TEST_ICON, name: 'a'.repeat(51) },
      '【カテゴリー名】50文字以内で入力してください。'
    );
  });
});
