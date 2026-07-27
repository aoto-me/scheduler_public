import { expect, test } from '@playwright/test';
import { NutritionSettingPage } from '../../pages/SettingPage.js';

test.describe('Settingページ > 1日の目標栄養値', () => {
  let nutritionPage: NutritionSettingPage;

  test.beforeEach(async ({ page }) => {
    nutritionPage = new NutritionSettingPage(page);
    await page.goto('/setting');
    await nutritionPage.expectLoaded();
  });

  test('セクション・グリッドが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/setting');
    await nutritionPage.expectLoaded();
  });

  test('データの追加ボタンが表示されない', async () => {
    await nutritionPage.expectAddButtonNotVisible();
  });

  test('削除ボタンが存在しない', async () => {
    await nutritionPage.expectDeleteButtonNotVisible();
  });

  test('データを更新できる', async () => {
    await nutritionPage.updateNutrition({ energy: '2000' });
    await expect(nutritionPage.row('2,000')).toBeVisible();
    // cleanup
    await nutritionPage.resetDefaultRow();
  });

  test('既存データの編集をキャンセルできる', async () => {
    await nutritionPage.cancelNutritionUpdate({ energy: '9999' });
    await expect(nutritionPage.row('1,800')).toBeVisible();
  });

  test('バリデーション：熱量を空にした場合', async () => {
    await nutritionPage.editNutritionExpectingValidationErrors(
      { energy: '' },
      '【熱量】0以上の数値である必要があります。'
    );
  });

  test('バリデーション：全フィールドを空にした場合', async () => {
    await nutritionPage.editNutritionExpectingValidationErrors(
      { carb: '', energy: '', fat: '', protein: '', salt: '' },
      '【熱量】0以上の数値である必要があります。',
      '【たんぱく質】0以上の数値である必要があります。',
      '【脂質】0以上の数値である必要があります。',
      '【炭水化物】0以上の数値である必要があります。',
      '【食塩相当量】0以上の数値である必要があります。'
    );
  });

  test('バリデーション：マイナス値を入力した場合', async () => {
    await nutritionPage.editNutritionExpectingValidationErrors(
      { energy: '-1' },
      '【熱量】0以上の数値である必要があります。'
    );
  });

  test('リロード後も変更が保持される', async ({ page }) => {
    await nutritionPage.updateNutrition({ protein: '999' });
    await expect(nutritionPage.row('999')).toBeVisible();
    await page.reload();
    await nutritionPage.expectLoaded();
    await expect(nutritionPage.row('999')).toBeVisible();
    // cleanup
    await nutritionPage.resetDefaultRow();
  });

  test('CSVダウンロードができる', async () => {
    const download = await nutritionPage.downloadCsv();
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
