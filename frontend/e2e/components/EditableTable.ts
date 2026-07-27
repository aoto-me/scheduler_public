import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface ColumnFormInput {
  columnId: string;
  columnName: string;
}

export class EditableTable {
  constructor(private readonly page: Page) {}

  async addColumn(input: ColumnFormInput) {
    await this.openColumnForm();
    await this.submitColumnForm(input);
  }

  /**
   * MEMO：
   * AG Gridの行の数え方：
   * ag-grid v36以降、1つのデータ行は単一の .ag-row 要素で描画される
   * （v35以前は pinned-left 用・中央スクロール領域用に分かれ、1行 = .ag-row 2個だった）
   */
  async addRow() {
    const rows = this.page.locator('.ag-row');
    const rowsBefore = await rows.count();
    await this.clickAddRow();
    await expect.poll(async () => await rows.count()).toBeGreaterThan(rowsBefore);
  }

  async attachExcelFile(filePath: string) {
    await this.page.locator('#upload-excel').setInputFiles(filePath);
  }

  async clickAddColumn() {
    await this.page.getByRole('button', { name: '列の追加' }).click();
  }

  async clickAddRow() {
    await this.page.getByRole('button', { name: '行の追加' }).click();
  }

  async clickCreateTableButton() {
    await this.page.getByRole('button', { name: 'テーブルを追加' }).click();
  }

  async clickDeleteColumnInModal() {
    await this.page.getByRole('button', { name: '削除' }).click();
  }

  async clickDeleteRow() {
    await this.page.getByRole('button', { name: '行の削除' }).click();
  }

  async clickFirstRowCheckbox() {
    const cell = this.page.locator('.ag-row').first().locator('.ag-selection-checkbox');
    await expect(cell).toBeVisible();
    await cell.click();
  }

  async clickSubmitColumnForm() {
    await this.page.getByRole('button', { name: /保存|更新/ }).click();
  }

  async clickTableMenuItem(label: string) {
    await this.page.getByRole('menuitem', { name: label }).click();
    await this.page.waitForTimeout(500);
  }

  async createTable() {
    await this.clickCreateTableButton();
    await this.expectVisible();
  }

  async createTableButtonVisible() {
    await expect(this.page.getByRole('button', { name: 'テーブルを追加' })).toBeVisible();
  }

  async expectColumnFormError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectColumnFormVisible() {
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
  }

  async expectVisible() {
    await expect(this.page.locator('.ag-root-wrapper')).toBeVisible();
  }

  async fillColumnId(value: string) {
    const field = this.page.locator('#field');
    await field.clear();
    await field.fill(value);
  }

  async fillColumnName(value: string) {
    const field = this.page.locator('#headerName');
    await field.clear();
    await field.fill(value);
  }

  async fillSearchFilter(value: string) {
    await this.page.locator('#quickFilterForm').fill(value);
  }

  async importExcel(filePath: string) {
    await this.selectTableMenuItem('Excelをインポート');
    await this.attachExcelFile(filePath);
  }

  async openColumnEditMenu(columnName: string) {
    const header = this.page.locator('.ag-header-cell').filter({ hasText: columnName });
    await header.getByRole('button').last().click();
  }

  async openColumnForm() {
    await this.clickAddColumn();
    await this.expectColumnFormVisible();
  }

  async openTableMenu() {
    await this.page.getByRole('button', { name: 'テーブルメニュー' }).click();
  }

  async selectTableMenuItem(label: string) {
    await this.openTableMenu();
    await this.clickTableMenuItem(label);
  }

  async submitColumnForm({ columnId, columnName }: ColumnFormInput) {
    await this.fillColumnId(columnId);
    await this.fillColumnName(columnName);
    await this.clickSubmitColumnForm();
  }
}
