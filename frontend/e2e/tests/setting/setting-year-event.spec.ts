import { expect, test } from '@playwright/test';
import { DataTableSection } from '../../pages/SettingPage.js';
import { runDataTableCommonTests } from '../../utils/helpers/settingTestHelpers.js';
import { uniqueContent } from '../../utils/testUtils.js';

const TEST_DATE = '2000-01-01';

test.describe('Settingページ > 年間イベント', () => {
  let yearEventPage: DataTableSection;

  test.beforeEach(async ({ page }) => {
    yearEventPage = new DataTableSection(page, '年間イベント');
    await page.goto('/setting');
    await yearEventPage.expectLoaded();
  });

  runDataTableCommonTests(() => yearEventPage, {
    defaultRow: { date: TEST_DATE },
    uniquePrefix: 'yearEvent',
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await yearEventPage.expectLoaded();
  });

  test('バリデーション：日付が空の場合', async () => {
    await yearEventPage.rowExpectingValidationError(
      { name: uniqueContent('yearEvent') },
      '【日付】日付が正しく設定されていません。'
    );
  });

  test('バリデーション：イベント名が空の場合', async () => {
    await yearEventPage.rowExpectingValidationError({ date: TEST_DATE }, '【イベント名】内容を入力してください。');
  });

  test('バリデーション：イベント名が101文字以上の場合', async () => {
    await yearEventPage.rowExpectingValidationError(
      { date: TEST_DATE, name: 'a'.repeat(101) },
      '【イベント名】100文字以内で入力してください。'
    );
  });
});
