import { expect } from '@playwright/test';
import { FIXTURE_CONTENT, test } from '../../fixtures/moneyFixture.js';
import { uniqueContent } from '../../utils/testUtils.js';

const TEST_AMOUNT = 1000;

test.describe('Money > DataGrid', () => {
  test.beforeEach(async ({ moneyPage }) => {
    await moneyPage.dataGrid.expectTableVisible();
  });

  test('新規データを追加できる（リロード/DB反映を確認）', async ({ moneyPage, page }) => {
    const content = uniqueContent('E2E新規追加');
    await moneyPage.addRecord(content, TEST_AMOUNT);
    await page.reload();
    await moneyPage.dataGrid.expectTableVisible();
    await moneyPage.dataGrid.expectRowVisible(content);
    // cleanup
    await moneyPage.dataGrid.deleteFromTable(content);
    await moneyPage.dataGrid.expectRowNotVisible(content);
  });

  test('データを更新できる（リロード/DB反映を確認）', async ({ moneyPage, page }) => {
    const content = uniqueContent('E2E更新テスト');
    const update = `${content}-update`;
    await moneyPage.addRecord(content, TEST_AMOUNT);
    // 更新
    await moneyPage.dataGrid.clickEditRow(content);
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ content: update });
    await moneyPage.moneyForm.expectDialogHidden();
    await moneyPage.dataGrid.expectRowVisible(update);
    // リロード後も確認
    await page.reload();
    await moneyPage.dataGrid.expectTableVisible();
    await moneyPage.dataGrid.expectRowVisible(update);
    // cleanup
    await moneyPage.dataGrid.deleteFromTable(update);
    await moneyPage.dataGrid.expectRowNotVisible(update);
  });

  test('フォームからデータを削除できる', async ({ moneyPage }) => {
    const content = uniqueContent('E2Eフォーム削除テスト');
    await moneyPage.addRecord(content, TEST_AMOUNT);

    await moneyPage.dataGrid.clickEditRow(content);
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.deleteFromForm();
    await moneyPage.dataGrid.expectRowNotVisible(content);
  });

  test('表からデータを削除できる', async ({ moneyPage }) => {
    const content = uniqueContent('E2E表削除テスト');
    await moneyPage.addRecord(content, TEST_AMOUNT);
    await moneyPage.dataGrid.deleteFromTable(content);
    await moneyPage.dataGrid.expectRowNotVisible(content);
  });

  test('表示月以外の日付でデータを登録した際に当月に表示されない', async ({ moneyPage }) => {
    const content = uniqueContent('E2E翌月テスト');

    // 翌月に移動
    await moneyPage.monthSelector.clickNextMonth();
    await moneyPage.dataGrid.expectTableVisible();
    const rowsBeforeInNextMonth = await moneyPage.dataGrid.grid.getByRole('row').count();

    // 翌月の5日にデータを追加
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ amount: 200, category: 1, content, day: 5 });
    await moneyPage.moneyForm.expectDialogHidden();

    // 翌月のテーブルに行が増えたことを確認
    const rowsAfterInNextMonth = await moneyPage.dataGrid.grid.getByRole('row').count();
    expect(rowsAfterInNextMonth).toBeGreaterThan(rowsBeforeInNextMonth);

    // 当月に戻る
    await moneyPage.monthSelector.clickPrevMonth();
    await moneyPage.dataGrid.expectTableVisible();

    // 当月のテーブルに翌月のデータが表示されないことを確認
    await moneyPage.dataGrid.expectRowNotVisible(content);

    // cleanup（翌月に移動して削除）
    await moneyPage.monthSelector.clickNextMonth();
    await moneyPage.dataGrid.expectTableVisible();
    await moneyPage.dataGrid.deleteFromTable(content);
    await moneyPage.dataGrid.expectRowNotVisible(content);
  });

  test('データ更新で別月の日付に変更した際に当月から消える', async ({ moneyPage, page }) => {
    const content = uniqueContent('E2E月変更テスト');
    // 当月にデータを追加
    await moneyPage.addRecord(content, TEST_AMOUNT);

    // 編集して日付の月を翌月に変更
    await moneyPage.dataGrid.clickEditRow(content);
    await moneyPage.moneyForm.expectDialogVisible();
    // 月セクション（nth(1): yyyy/MM/dd 順）をクリックしてフォーカスし翌月にインクリメント
    const dateSections = page.getByRole('dialog').locator('.MuiPickersSectionList-section');
    await dateSections.nth(1).click();
    await page.keyboard.press('ArrowUp');
    await moneyPage.moneyForm.clickSubmit();

    // 当月テーブルから消えていることを確認
    await moneyPage.dataGrid.expectRowNotVisible(content);

    // cleanup（翌月に移動して削除）
    await moneyPage.monthSelector.clickNextMonth();
    await moneyPage.dataGrid.expectRowVisible(content);
    await moneyPage.dataGrid.deleteFromTable(content);
  });

  test('バリデーション：金額が空のときエラーが出る', async ({ moneyPage }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ category: 1, content: 'テスト' });
    await moneyPage.moneyForm.expectFieldError('amount', '金額を入力してください');
    await moneyPage.moneyForm.closeDialog();
  });

  test('バリデーション：金額が負数のときエラーが出る', async ({ moneyPage }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ amount: -1, category: 1, content: 'テスト' });
    await moneyPage.moneyForm.expectFieldError('amount', '金額を入力してください');
    await moneyPage.moneyForm.closeDialog();
  });

  test('バリデーション：カテゴリーが未選択のときエラーが出る', async ({ moneyPage }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ amount: 100, content: 'テスト' });
    await moneyPage.moneyForm.expectFieldError('category', 'カテゴリーを選択してください');
    await moneyPage.moneyForm.closeDialog();
  });

  test('バリデーション：内容が空のときエラーが出る', async ({ moneyPage }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ amount: 100, category: 1 });
    await moneyPage.moneyForm.expectFieldError('content', '内容を入力してください');
    await moneyPage.moneyForm.closeDialog();
  });

  test('バリデーション：内容が101文字以上のときエラーが出る', async ({ moneyPage }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ amount: 100, category: 1, content: 'あ'.repeat(101) });
    await moneyPage.moneyForm.expectFieldError('content', '100文字以内で入力してください');
    await moneyPage.moneyForm.closeDialog();
  });

  test('バリデーション：日付が空のときエラーが出る', async ({ moneyPage }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();
    await moneyPage.moneyForm.fillAndSubmit({ amount: 100, category: 1, clearDate: true, content: 'テスト' });
    await moneyPage.moneyForm.expectFieldError('date', '日付を選択してください');
    await moneyPage.moneyForm.closeDialog();
  });

  test('収支タイプ切り替えでカテゴリー一覧が変わる', async ({ moneyPage, page }) => {
    await moneyPage.clickAddMoneyButton();
    await moneyPage.moneyForm.expectDialogVisible();

    // 支出（デフォルト）の最初のカテゴリー名を取得してドロップダウンを閉じる
    await page.getByRole('dialog').getByRole('combobox').click();
    const expenseFirstOption = ((await page.getByRole('option').nth(1).textContent()) ?? '').trim();
    await page.getByRole('option').nth(0).click();

    // 収入に切り替えて最初のカテゴリー名を取得してドロップダウンを閉じる
    await moneyPage.moneyForm.selectType('収入');
    await page.getByRole('dialog').getByRole('combobox').click();
    const incomeFirstOption = ((await page.getByRole('option').nth(1).textContent()) ?? '').trim();
    await page.getByRole('option').nth(0).click();

    expect(expenseFirstOption).not.toBe(incomeFirstOption);

    await moneyPage.moneyForm.closeDialog();
  });

  test('検索フォームで絞り込みができる', async ({ moneyRecordPage, page }) => {
    const rowCountBefore = await moneyRecordPage.dataGrid.grid.getByRole('row').count();

    await moneyRecordPage.dataGrid.search(FIXTURE_CONTENT);
    const rowCountAfter = await moneyRecordPage.dataGrid.grid.getByRole('row').count();
    expect(rowCountAfter).toBeLessThanOrEqual(rowCountBefore);

    await moneyRecordPage.dataGrid.clearSearch();
    await moneyRecordPage.dataGrid.search('存在しないデータ');
    await expect(page.getByText('結果がありません。')).toBeVisible();

    await moneyRecordPage.dataGrid.clearSearch();
    const rowCountCleared = await moneyRecordPage.dataGrid.grid.getByRole('row').count();
    expect(rowCountCleared).toBe(rowCountBefore);
  });

  test('CSVダウンロードができる', async ({ moneyPage, page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), moneyPage.dataGrid.downloadCsv()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
