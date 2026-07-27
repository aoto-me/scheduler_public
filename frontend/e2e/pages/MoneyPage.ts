import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { DataGrid } from '../components/DataGrid.js';
import { MoneyForm } from '../components/MoneyForm.js';
import { MonthSelector } from '../components/MonthSelector.js';

export class MoneyPage {
  readonly dataGrid: DataGrid;
  readonly moneyForm: MoneyForm;
  readonly monthSelector: MonthSelector;

  constructor(private readonly page: Page) {
    this.monthSelector = new MonthSelector(page);
    this.moneyForm = new MoneyForm(page);
    const grid = page.getByRole('grid');
    this.dataGrid = new DataGrid(page, grid, grid.locator('..'));
  }

  // モーダルを開いてレコードを1件追加し、行が表示されるまで待つ
  // categoryOptionIndex: category選択肢の位置（1 = 最初の有効な選択肢、2 = 2番目）
  // type: デフォルトは '支出'
  async addRecord(
    content: string,
    amount: number,
    categoryOptionIndex = 1,
    type: '収入' | '支出' = '支出'
  ): Promise<string> {
    await this.clickAddMoneyButton();
    await this.moneyForm.expectDialogVisible();
    const categoryName = await this.moneyForm.fillAndSubmit({
      amount,
      category: categoryOptionIndex,
      content,
      type: type === '支出' ? undefined : type,
    });
    await this.moneyForm.expectDialogHidden();
    await this.dataGrid.expectRowVisible(content);
    return categoryName ?? '';
  }

  async clickAddMoneyButton() {
    await this.page.getByRole('button', { name: '家計簿データを追加' }).click();
  }

  async expectBarChartVisible() {
    await expect(this.page.locator('[data-testid="balance-bar-chart"]')).toBeVisible();
  }

  // CategoryPieChart の凡例に指定ラベルが表示されていることを確認する
  async expectPieChartLegendVisible(label: string) {
    await expect(this.page.getByText(label).first()).toBeVisible();
  }

  async expectPieChartVisible() {
    await expect(this.page.locator('[data-testid="category-pie-chart"]')).toBeVisible();
  }

  // 年間収支一覧の見出し（"YYYY年 収支一覧"）が表示されていることを確認する
  async expectYearlySummaryVisible() {
    await expect(this.page.getByText(/\d{4}年 収支一覧/)).toBeVisible();
  }

  // 年間サマリーカードの金額を数値で返す（"¥ 1,000" → 1000）
  async getYearlySummaryAmount(type: '収入' | '収支' | '支出'): Promise<number> {
    const h6 = this.page.getByText(`年間${type}`).locator('..').locator('h6');
    await h6.waitFor({ state: 'visible' });
    const text = await h6.textContent();
    return Number((text ?? '').replaceAll(/[¥\s,]/g, ''));
  }

  async goto() {
    await this.page.goto('/money');
  }

  // CategoryPieChart の収支タイプセレクトを切り替える
  async selectPieChartType(type: '収入' | '支出') {
    await this.page.locator('#type-select').locator('..').click(); // #type-select自体ではなく親要素をクリックして開く
    await this.page.getByRole('option', { exact: true, name: type }).click();
  }
}
