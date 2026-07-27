import { expect } from '@playwright/test';
import { addMonths, format } from 'date-fns';
import { FIXTURE_HEALTH_DISPLAY, FIXTURE_HEALTH_MEMO, test } from '../../fixtures/healthFixture.js';

// 体調テーブルの表示日付フォーマット（yyyy/M/dd）月はゼロなし
const toDisplay = (day: number): string => `${format(new Date(), 'yyyy/M/')}${String(day).padStart(2, '0')}`;

// 各テストが使用する専用の日付（フィクスチャの20日・health.spec.tsの5日～8日と衝突しない）
const DAY_ADD = 15;
const DAY_UPDATE = 16;
const DAY_FORM_DELETE = 17;
const DAY_TABLE_DELETE = 18;
const DAY_ALL_FIELDS = 19;

test.describe('Healthページ > 体調', () => {
  test.beforeEach(async ({ healthPage }) => {
    await healthPage.expectHealthSectionVisible();
    await healthPage.health.expectTableVisible();
  });

  test('新規データを追加できる（リロード/DB反映を確認）', async ({ healthPage, page }) => {
    const rowsBefore = await healthPage.health.grid.getByRole('row').count();

    await healthPage.addHealthRecord(DAY_ADD, 3);
    await expect(healthPage.health.grid.getByRole('row')).toHaveCount(rowsBefore + 1);

    await page.reload();
    await healthPage.health.expectTableVisible();
    await healthPage.health.expectRowVisible(toDisplay(DAY_ADD));

    // cleanup
    await healthPage.health.deleteFromTable(toDisplay(DAY_ADD));
    await healthPage.health.expectRowNotVisible(toDisplay(DAY_ADD));
  });

  test('全項目を入力して登録したデータが表に正しく反映される', async ({ healthPage }) => {
    const testOther = 'その他の症状テスト';
    const testMemo = 'E2E全項目テストメモ';

    // 全項目を入力
    const categoryName =
      (await healthPage.addHealthRecord(DAY_ALL_FIELDS, 4, {
        checkFirstCategory: true,
        exercise: true,
        memo: testMemo,
        other: testOther,
      })) ?? '';

    // 対象行に日付・症状・その他・メモが表示されていることを確認
    // 調子（mental）・運動（exercise）はアイコン描画のためテキスト検証対象外
    const row = healthPage.health.grid.getByRole('row').filter({ hasText: toDisplay(DAY_ALL_FIELDS) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(categoryName);
    await expect(row).toContainText(testOther);
    await expect(row).toContainText(testMemo);

    // cleanup
    await healthPage.health.deleteFromTable(toDisplay(DAY_ALL_FIELDS));
    await healthPage.health.expectRowNotVisible(toDisplay(DAY_ALL_FIELDS));
  });

  test('データを更新できる（リロード/DB反映を確認）', async ({ healthPage, page }) => {
    const testMemo = 'E2E更新テストメモ';
    // テスト用データを追加してから更新する
    await healthPage.addHealthRecord(DAY_UPDATE, 3);

    await healthPage.health.clickEditRow(toDisplay(DAY_UPDATE));
    await healthPage.healthForm.expectDialogVisible();
    await healthPage.healthForm.fillAndSubmit({ memo: testMemo });

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(healthPage.health.grid.getByRole('row').filter({ hasText: testMemo })).toBeVisible();

    await page.reload();
    await healthPage.health.expectTableVisible();
    await expect(healthPage.health.grid.getByRole('row').filter({ hasText: testMemo })).toBeVisible();

    // cleanup
    await healthPage.health.deleteFromTable(toDisplay(DAY_UPDATE));
    await healthPage.health.expectRowNotVisible(toDisplay(DAY_UPDATE));
  });

  test('フォームから削除できる', async ({ healthPage }) => {
    await healthPage.addHealthRecord(DAY_FORM_DELETE, 2);
    await healthPage.health.clickEditRow(toDisplay(DAY_FORM_DELETE));
    await healthPage.healthForm.expectDialogVisible();
    await healthPage.healthForm.deleteHealthFromForm();
    await healthPage.health.expectRowNotVisible(toDisplay(DAY_FORM_DELETE));
  });

  test('表から削除できる', async ({ healthPage }) => {
    await healthPage.addHealthRecord(DAY_TABLE_DELETE, 2);
    const rowsBefore = await healthPage.health.grid.getByRole('row').count();
    await healthPage.health.deleteFromTable(toDisplay(DAY_TABLE_DELETE));
    await expect(healthPage.health.grid.getByRole('row')).toHaveCount(rowsBefore - 1);
  });

  test('表示月以外の日付でデータを登録した際に当月に表示されない', async ({ healthPage, page }) => {
    const currentMonthRowCount = await healthPage.health.grid.getByRole('row').count();
    // 翌月に移動してデータを追加
    await healthPage.monthSelector.clickNextMonth();
    await healthPage.health.expectTableVisible();
    const nextMonthRowCountBefore = await healthPage.health.grid.getByRole('row').count();

    await healthPage.clickHealthAddButton();
    await healthPage.healthForm.expectDialogVisible();
    await healthPage.healthForm.fillHealthDay(5);
    await healthPage.healthForm.fillHealthMental(1);
    await healthPage.healthForm.clickSubmit();
    await healthPage.healthForm.expectDialogHidden();

    const nextMonthRowCountAfter = await healthPage.health.grid.getByRole('row').count();
    expect(nextMonthRowCountAfter).toBeGreaterThan(nextMonthRowCountBefore);

    // 当月に戻り、翌月データが含まれていないことを確認
    await healthPage.monthSelector.clickPrevMonth();
    await healthPage.health.expectTableVisible();
    await page.waitForTimeout(500); // ローディング段階でクリアしないため
    const currentMonthRowCountAfter = await healthPage.health.grid.getByRole('row').count();
    expect(currentMonthRowCountAfter).toBe(currentMonthRowCount);

    // cleanup（翌月に戻って削除）
    await healthPage.monthSelector.clickNextMonth();
    const nextMonthDay5Display = `${format(addMonths(new Date(), 1), 'yyyy/M/')}05`;
    await healthPage.health.deleteFromTable(nextMonthDay5Display);
    await healthPage.health.expectRowNotVisible(nextMonthDay5Display);
  });

  test('同じ日付で2件目登録するとエラーになる', async ({ healthRecordPage, page }) => {
    // フィクスチャ記録の日付（20日）と同じ日付で追加を試みる
    const expectedDate = `${format(new Date(), 'yyyy-MM-')}20`;

    // beforeEach の healthPage フィクスチャが goto() を再実行するため、
    // ヘルスデータが完全にロードされた状態を確認してからボタンをクリックする
    await healthRecordPage.health.expectRowVisible(FIXTURE_HEALTH_DISPLAY);

    await healthRecordPage.clickHealthAddButton();
    await healthRecordPage.healthForm.expectDialogVisible();
    await healthRecordPage.healthForm.fillAndSubmit({ day: 20, mental: 4 });
    await expect(page.getByText(`${expectedDate}は既に登録済みです`)).toBeVisible();

    if (await page.getByRole('dialog').isVisible()) {
      await healthRecordPage.healthForm.close();
    }
  });

  test('バリデーション：メモが500文字超のとき「500文字以内で入力してください」エラー', async ({ healthPage }) => {
    await healthPage.clickHealthAddButton();
    await healthPage.healthForm.expectDialogVisible();
    await healthPage.healthForm.fillAndSubmit({ memo: 'あ'.repeat(501) });
    await healthPage.healthForm.expectFieldError('memo', '500文字以内で入力してください');
    await healthPage.healthForm.close();
  });

  test('バリデーション：その他が50文字超のとき「50文字以内で入力してください」エラー', async ({ healthPage }) => {
    await healthPage.clickHealthAddButton();
    await healthPage.healthForm.expectDialogVisible();
    await healthPage.healthForm.fillAndSubmit({ other: 'あ'.repeat(51) });
    await healthPage.healthForm.expectFieldError('other', '50文字以内で入力してください');
    await healthPage.healthForm.close();
  });

  test('検索フォームで絞り込みができる', async ({ healthRecordPage }) => {
    const rowCountBefore = await healthRecordPage.health.grid.getByRole('row').count();

    await healthRecordPage.health.search(FIXTURE_HEALTH_MEMO);
    await healthRecordPage.health.expectRowVisible(FIXTURE_HEALTH_DISPLAY);

    await healthRecordPage.health.search('存在しないデータ');
    await healthRecordPage.health.expectRowNotVisible(FIXTURE_HEALTH_DISPLAY);
    await expect(healthRecordPage.health.grid.getByText('結果がありません。')).toBeVisible();

    await healthRecordPage.health.clearSearch();
    const rowCountCleared = await healthRecordPage.health.grid.getByRole('row').count();
    expect(rowCountCleared).toBe(rowCountBefore);
  });

  test('CSV ダウンロードができる', async ({ healthPage, page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), healthPage.health.downloadCsv()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
