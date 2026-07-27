import { expect, test } from '@playwright/test';
import { DataTableSection } from '../../pages/SettingPage.js';
import { runDataTableCommonTests } from '../../utils/helpers/settingTestHelpers.js';
import { uniqueContent } from '../../utils/testUtils.js';

test.describe('Settingページ > 食品栄養データベース', () => {
  let foodDBPage: DataTableSection;

  test.beforeEach(async ({ page }) => {
    foodDBPage = new DataTableSection(page, '食品栄養データベース');
    await page.goto('/setting');
    await foodDBPage.expectLoaded();
  });

  runDataTableCommonTests(() => foodDBPage, {
    defaultRow: { energy: '150' },
    uniquePrefix: 'food',
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await foodDBPage.expectLoaded();
  });

  test('バリデーション：名称が空の場合', async () => {
    await foodDBPage.rowExpectingValidationError({ energy: '100' }, '【名称】内容を入力してください。');
  });

  test('バリデーション：名称が101文字以上の場合', async () => {
    await foodDBPage.rowExpectingValidationError(
      { energy: '100', name: 'a'.repeat(101) },
      '【名称】100文字以内で入力してください。'
    );
  });

  test('バリデーション：熱量が空の場合', async () => {
    await foodDBPage.rowExpectingValidationError(
      { name: uniqueContent('food') },
      '【熱量】0以上の数値である必要があります。'
    );
  });

  test('バリデーション：熱量がマイナスの場合', async () => {
    await foodDBPage.rowExpectingValidationError(
      { energy: '-1', name: uniqueContent('food') },
      '【熱量】0以上の数値である必要があります。'
    );
  });

  test('バリデーション：たんぱく質がマイナスの場合', async () => {
    await foodDBPage.rowExpectingValidationError(
      { energy: '100', name: uniqueContent('food'), protein: '-1' },
      '【たんぱく質】0以上の数値である必要があります。'
    );
  });

  test('バリデーション：脂質がマイナスの場合', async () => {
    await foodDBPage.rowExpectingValidationError(
      { energy: '100', fat: '-1', name: uniqueContent('food') },
      '【脂質】0以上の数値である必要があります。'
    );
  });

  test('バリデーション：炭水化物がマイナスの場合', async () => {
    await foodDBPage.rowExpectingValidationError(
      { carb: '-1', energy: '100', name: uniqueContent('food') },
      '【炭水化物】0以上の数値である必要があります。'
    );
  });
});
