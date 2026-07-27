import { expect } from '@playwright/test';
import { FIXTURE_CONTENT, test } from '../../fixtures/moneyFixture.js';
import { uniqueContent } from '../../utils/testUtils.js';

test.describe('Moneyページ > MonthSelector', () => {
  test.beforeEach(async ({ moneyPage }) => {
    await moneyPage.monthSelector.expectVisible();
  });

  test('前月ボタンで月が変わる', async ({ moneyPage }) => {
    const before = await moneyPage.monthSelector.getMonthText();
    await moneyPage.monthSelector.clickPrevMonth();
    const after = await moneyPage.monthSelector.getMonthText();
    expect(after).not.toBe(before);
  });

  test('翌月ボタンで月が変わる', async ({ moneyPage }) => {
    const before = await moneyPage.monthSelector.getMonthText();
    await moneyPage.monthSelector.clickNextMonth();
    const after = await moneyPage.monthSelector.getMonthText();
    expect(after).not.toBe(before);
  });

  test('パネルから年月移動ができる', async ({ moneyPage }) => {
    const before = await moneyPage.monthSelector.getMonthText();

    const currentYear = new Date().getFullYear();
    await moneyPage.monthSelector.selectYearMonth(currentYear - 1, 1);

    const after = await moneyPage.monthSelector.getMonthText();
    expect(after).not.toBe(before);

    // テスト後に当月に戻す
    await moneyPage.monthSelector.selectYearMonth(currentYear, new Date().getMonth() + 1);
  });

  test('前月移動後に当月の収支データが表示されない', async ({ moneyRecordPage, page }) => {
    // フィクスチャの収支データが当月に存在することを確認してから前月に移動
    await moneyRecordPage.dataGrid.expectRowVisible(FIXTURE_CONTENT);
    await moneyRecordPage.monthSelector.clickPrevMonth();
    await page.waitForTimeout(500); // 判定が早すぎるとローディング段階でクリアしまうため
    await moneyRecordPage.dataGrid.expectRowNotVisible(FIXTURE_CONTENT);
  });
});

/**
 * MEMO：
 * 凡例やラベルのチェックはできるが、SVGで描画されるグラフを直接E2Eでチェックするのは難しい
 * そのため、BalanceBarChartのデータに伴うテストはなし、CategoryPieChartも凡例を確認している
 */
test.describe('Moneyページ > Summary', () => {
  test('年間収支サマリーが表示される', async ({ moneyPage }) => {
    await moneyPage.expectYearlySummaryVisible();
  });

  test('CategoryPieChartが表示される', async ({ moneyRecordPage }) => {
    await moneyRecordPage.expectPieChartVisible();
  });

  test('BalanceBarChartが表示される', async ({ moneyRecordPage }) => {
    await moneyRecordPage.expectBarChartVisible();
  });

  test('データを追加するとCategoryPieChartの凡例に新カテゴリーが表示される', async ({ moneyRecordPage }) => {
    // フィクスチャでは、index=1のカテゴリーの支出データ登録済み
    // index=2（別カテゴリー）を追加して凡例に反映されることを確認する
    const content = uniqueContent('E2Eパイチャートテスト');
    const categoryName = await moneyRecordPage.addRecord(content, 500, 2);
    await moneyRecordPage.expectPieChartLegendVisible(categoryName);
    // cleanup
    await moneyRecordPage.dataGrid.deleteFromTable(content);
    await moneyRecordPage.dataGrid.expectRowNotVisible(content);
  });

  test('CategoryPieChartの支出/収入切り替えができる', async ({ moneyPage, page }) => {
    await moneyPage.expectPieChartVisible();
    await moneyPage.selectPieChartType('収入');
    await expect(page.locator('#type-select')).toContainText('収入');
    await moneyPage.selectPieChartType('支出');
    await expect(page.locator('#type-select')).toContainText('支出');
  });

  test('データ追加・削除に合わせて年間収支サマリーが正しく増減する', async ({ moneyPage }) => {
    const expenseContent = uniqueContent('E2E支出テスト');
    const incomeContent = uniqueContent('E2E収入テスト');
    const beforeExpense = await moneyPage.getYearlySummaryAmount('支出');
    const beforeIncome = await moneyPage.getYearlySummaryAmount('収入');
    const beforeBalance = await moneyPage.getYearlySummaryAmount('収支');

    // 支出を追加して支出・収支が変化することを確認
    await moneyPage.addRecord(expenseContent, 1000);
    expect(await moneyPage.getYearlySummaryAmount('支出')).toBe(beforeExpense + 1000);
    expect(await moneyPage.getYearlySummaryAmount('収支')).toBe(beforeBalance - 1000);

    // 収入を追加して収入・収支が変化することを確認
    await moneyPage.addRecord(incomeContent, 2000, 1, '収入');
    expect(await moneyPage.getYearlySummaryAmount('収入')).toBe(beforeIncome + 2000);
    expect(await moneyPage.getYearlySummaryAmount('収支')).toBe(beforeBalance - 1000 + 2000);

    // 支出を削除して元の値に戻ることを確認
    await moneyPage.dataGrid.deleteFromTable(expenseContent);
    await moneyPage.dataGrid.expectRowNotVisible(expenseContent);
    expect(await moneyPage.getYearlySummaryAmount('支出')).toBe(beforeExpense);
    expect(await moneyPage.getYearlySummaryAmount('収支')).toBe(beforeBalance + 2000);

    // 収入を削除してすべて元の値に戻ることを確認
    await moneyPage.dataGrid.deleteFromTable(incomeContent);
    await moneyPage.dataGrid.expectRowNotVisible(incomeContent);
    expect(await moneyPage.getYearlySummaryAmount('収入')).toBe(beforeIncome);
    expect(await moneyPage.getYearlySummaryAmount('収支')).toBe(beforeBalance);
  });
});
