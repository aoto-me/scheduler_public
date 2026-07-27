import { expect, test } from '@playwright/test';
import { DataTableSection } from '../../pages/SettingPage.js';
import { runDataTableCommonTests } from '../../utils/helpers/settingTestHelpers.js';
import { uniqueContent } from '../../utils/testUtils.js';

const TEST_ICON = 'mail-fill';

test.describe('Settingページ > 体調カテゴリー', () => {
  let healthCategoryPage: DataTableSection;

  test.beforeEach(async ({ page }) => {
    healthCategoryPage = new DataTableSection(page, '体調カテゴリー');
    await page.goto('/setting');
    await healthCategoryPage.expectLoaded();
  });

  runDataTableCommonTests(() => healthCategoryPage, {
    defaultRow: { icon: TEST_ICON },
    uniquePrefix: 'health',
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await healthCategoryPage.expectLoaded();
  });

  test('使用中のカテゴリーを削除しようとするとエラートーストが表示される', async ({ page }) => {
    await healthCategoryPage.deleteFirstRow();
    await expect(page.getByText('【409】このカテゴリーは使用中のため、削除できませんでした')).toBeVisible();
    await expect(healthCategoryPage.firstRow).toBeVisible();
  });

  test('バリデーション：アイコンが空の場合', async () => {
    await healthCategoryPage.rowExpectingValidationError(
      { name: uniqueContent('health') },
      '【アイコン】内容を入力してください。'
    );
  });

  test('バリデーション：カテゴリー名が空の場合', async () => {
    await healthCategoryPage.rowExpectingValidationError(
      { icon: TEST_ICON },
      '【カテゴリー名】内容を入力してください。'
    );
  });

  test('バリデーション：アイコンが51文字以上の場合', async () => {
    await healthCategoryPage.rowExpectingValidationError(
      { icon: 'a'.repeat(51), name: uniqueContent('health') },
      '【アイコン】50文字以内で入力してください。'
    );
  });

  test('バリデーション：カテゴリー名が51文字以上の場合', async () => {
    await healthCategoryPage.rowExpectingValidationError(
      { icon: TEST_ICON, name: 'a'.repeat(51) },
      '【カテゴリー名】50文字以内で入力してください。'
    );
  });
});
