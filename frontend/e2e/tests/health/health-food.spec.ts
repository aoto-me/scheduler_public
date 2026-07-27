import { expect } from '@playwright/test';
import { FIXTURE_FOOD_NAME, test } from '../../fixtures/healthFixture.js';
import { uniqueContent } from '../../utils/testUtils.js';

test.describe('Healthページ > 食事記録', () => {
  test.beforeEach(async ({ healthPage }) => {
    await healthPage.expectFoodSectionVisible();
    await healthPage.food.expectTableVisible();
  });

  test('新規データを追加できる（リロード/DB反映を確認）', async ({ healthPage, page }) => {
    const name = uniqueContent('Food新規追加テスト');
    await healthPage.addFoodRecord(name, '100', '500');

    await page.reload();
    await healthPage.food.expectTableVisible();
    await healthPage.food.expectRowVisible(name);

    // cleanup
    await healthPage.food.deleteFromTable(name);
    await healthPage.food.expectRowNotVisible(name);
  });

  test('データを更新できる（リロード/DB反映を確認）', async ({ healthPage, page }) => {
    const name = uniqueContent('Food更新テスト');
    const update = `${name}-update`;
    await healthPage.addFoodRecord(name, '100', '500');
    // 更新
    await healthPage.food.clickEditRow(name);
    await healthPage.foodForm.expectDialogVisible();
    await healthPage.foodForm.fillAndSubmit({ name: update });
    await healthPage.food.expectRowVisible(update);
    await page.reload();
    await healthPage.food.expectTableVisible();
    await healthPage.food.expectRowVisible(update);
    // cleanup
    await healthPage.food.deleteFromTable(update);
    await healthPage.food.expectRowNotVisible(update);
  });

  test('フォームから削除できる', async ({ healthPage }) => {
    const name = uniqueContent('Foodフォーム削除テスト');
    await healthPage.addFoodRecord(name, '100', '500');
    await healthPage.food.clickEditRow(name);
    await healthPage.foodForm.expectDialogVisible();
    await healthPage.foodForm.deleteFoodFromForm();
    await healthPage.food.expectRowNotVisible(name);
  });

  test('表から削除できる', async ({ healthPage }) => {
    const name = uniqueContent('Food表削除テスト');
    await healthPage.addFoodRecord(name, '200', '300');
    await healthPage.food.deleteFromTable(name);
    await healthPage.food.expectRowNotVisible(name);
  });

  test('表示月以外の日付でデータを登録した際に当月に表示されない', async ({ healthPage }) => {
    const name = uniqueContent('Food翌月データテスト');
    // 翌月に移動してデータを追加
    await healthPage.monthSelector.clickNextMonth();
    await healthPage.food.expectTableVisible();
    await healthPage.addFoodRecord(name, '150', '400');
    // 当月に戻り、翌月のデータが表示されないことを確認
    await healthPage.monthSelector.clickPrevMonth();
    await healthPage.food.expectTableVisible();
    await healthPage.food.expectRowNotVisible(name);
    // cleanup（翌月に戻って削除）
    await healthPage.monthSelector.clickNextMonth();
    await healthPage.food.deleteFromTable(name);
  });

  test('データ更新で別月の日付に変更した際に当月から消える', async ({ healthPage, page }) => {
    const name = uniqueContent('Food月変更テスト');
    // 当月にデータを追加
    await healthPage.addFoodRecord(name, '50', '200');
    // 編集して日付の月を翌月に変更
    await healthPage.food.clickEditRow(name);
    await healthPage.foodForm.expectDialogVisible();
    const modal = page.getByRole('dialog');
    // 月セクション（nth(1): yyyy/MM/dd 順）をクリックしてフォーカスし翌月にインクリメント
    const dateSections = modal.locator('.MuiPickersSectionList-section');
    await dateSections.nth(1).click();
    await page.keyboard.press('ArrowUp');
    await healthPage.foodForm.clickSubmit();
    // 当月テーブルから消えていることを確認
    await healthPage.food.expectRowNotVisible(name);
    // cleanup（翌月に移動して削除）
    await healthPage.monthSelector.clickNextMonth();
    await healthPage.food.expectRowVisible(name);
    await healthPage.food.deleteFromTable(name);
    await healthPage.food.expectRowNotVisible(name);
  });

  test('バリデーション：名称が空の場合エラーが表示される', async ({ healthPage }) => {
    await healthPage.clickFoodAddButton();
    await healthPage.foodForm.expectDialogVisible();
    await healthPage.foodForm.fillAndSubmit({ energy: '500', quantity: '100' });
    await healthPage.foodForm.expectFieldError('name', '内容を入力してください');
    await healthPage.foodForm.close();
  });

  test('バリデーション：量が空の場合エラーが表示される', async ({ healthPage }) => {
    await healthPage.clickFoodAddButton();
    await healthPage.foodForm.expectDialogVisible();
    await healthPage.foodForm.fillAndSubmit({ energy: '500', name: 'バリデーションテスト食品' });
    await healthPage.foodForm.expectFieldError('quantity', '量を入力してください');
    await healthPage.foodForm.close();
  });

  test('バリデーション：熱量が空の場合エラーが表示される', async ({ healthPage }) => {
    await healthPage.clickFoodAddButton();
    await healthPage.foodForm.expectDialogVisible();
    await healthPage.foodForm.fillAndSubmit({ name: 'バリデーションテスト食品', quantity: '100' });
    await healthPage.foodForm.expectFieldError('energy', '熱量を入力してください');
    await healthPage.foodForm.close();
  });

  test('Autocompleteで FoodDB 名称の候補が表示される', async ({ healthPage, page }) => {
    await healthPage.clickFoodAddButton();
    await healthPage.foodForm.expectDialogVisible();
    const modal = page.getByRole('dialog');
    const nameInput = modal.getByLabel('名称を選択 or 入力');
    await nameInput.fill('あ');
    await expect(modal.getByRole('listbox')).toBeVisible();
    await healthPage.foodForm.close();
  });

  test('Autocompleteから選択後、自動入力ボタンで栄養素が入力される', async ({ healthPage, page }) => {
    await healthPage.clickFoodAddButton();
    await healthPage.foodForm.expectDialogVisible();
    const modal = page.getByRole('dialog');
    const nameInput = modal.getByLabel('名称を選択 or 入力');

    await nameInput.fill('あ');
    const listbox = modal.getByRole('listbox');
    await listbox.waitFor({ state: 'visible' });
    await listbox.getByRole('option').first().click();

    await healthPage.foodForm.fillFoodQuantity('100');

    const autoFillBtn = page.getByRole('button', { name: 'データベースから自動入力' });
    await expect(autoFillBtn).toBeEnabled();
    await healthPage.foodForm.clickAutoFill();

    const energyValue = await modal.locator('#energy').inputValue();
    expect(Number(energyValue)).toBeGreaterThan(0);

    await healthPage.foodForm.close();
  });

  test('検索フォームで絞り込みができる', async ({ foodRecordPage }) => {
    const rowCountBefore = await foodRecordPage.food.grid.getByRole('row').count();

    await foodRecordPage.food.search(FIXTURE_FOOD_NAME);
    await foodRecordPage.food.expectRowVisible(FIXTURE_FOOD_NAME);

    await foodRecordPage.food.search('存在しないデータ');
    await foodRecordPage.food.expectRowNotVisible(FIXTURE_FOOD_NAME);
    await expect(foodRecordPage.food.grid.getByText('結果がありません。')).toBeVisible();

    await foodRecordPage.food.clearSearch();
    const rowCountCleared = await foodRecordPage.food.grid.getByRole('row').count();
    expect(rowCountCleared).toBe(rowCountBefore);
  });

  test('CSVダウンロードができる', async ({ healthPage, page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), healthPage.food.downloadCsv()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
