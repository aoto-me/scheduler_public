import { expect, test } from '@playwright/test';
import { DataTableSection } from '../../pages/SettingPage.js';
import { runDataTableCommonTests } from '../../utils/helpers/settingTestHelpers.js';
import { uniqueContent } from '../../utils/testUtils.js';

const TEST_ICON = 'mail-fill';

test.describe('Settingページ > 支出カテゴリー', () => {
  let expenseCategoryPage: DataTableSection;

  test.beforeEach(async ({ page }) => {
    expenseCategoryPage = new DataTableSection(page, '支出カテゴリー');
    await page.goto('/setting');
    await expenseCategoryPage.expectLoaded();
  });

  runDataTableCommonTests(() => expenseCategoryPage, {
    defaultRow: { icon: TEST_ICON },
    uniquePrefix: 'expense',
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await expenseCategoryPage.expectLoaded();
  });

  test('使用中のカテゴリーを削除しようとするとエラートーストが表示される', async ({ page }) => {
    await expenseCategoryPage.deleteFirstRow();
    await expect(page.getByText('【409】このカテゴリーは使用中のため、削除できませんでした')).toBeVisible();
    await expect(expenseCategoryPage.firstRow).toBeVisible();
  });

  test('バリデーション：アイコンが空の場合', async () => {
    await expenseCategoryPage.rowExpectingValidationError(
      { name: uniqueContent('expense') },
      '【アイコン】内容を入力してください。'
    );
  });

  test('バリデーション：カテゴリー名が空の場合', async () => {
    await expenseCategoryPage.rowExpectingValidationError(
      { icon: TEST_ICON },
      '【カテゴリー名】内容を入力してください。'
    );
  });

  test('バリデーション：アイコンが51文字以上の場合', async () => {
    await expenseCategoryPage.rowExpectingValidationError(
      { icon: 'a'.repeat(51), name: uniqueContent('expense') },
      '【アイコン】50文字以内で入力してください。'
    );
  });

  test('バリデーション：カテゴリー名が51文字以上の場合', async () => {
    await expenseCategoryPage.rowExpectingValidationError(
      { icon: TEST_ICON, name: 'a'.repeat(51) },
      '【カテゴリー名】50文字以内で入力してください。'
    );
  });
});
