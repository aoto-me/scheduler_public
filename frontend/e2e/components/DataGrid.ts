import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class DataGrid {
  constructor(
    private readonly page: Page,
    readonly grid: Locator,
    readonly container: Locator
  ) {}

  async clearSearch() {
    await this.container.getByLabel('検索リセット').click();
    await this.page.waitForTimeout(500);
  }

  async clickEditRow(keyword: string) {
    await this.grid.getByRole('row').filter({ hasText: keyword }).getByRole('menuitem', { name: '編集' }).click();
  }

  async deleteFromTable(keyword: string) {
    this.page.once('dialog', d => d.accept());
    await this.grid.getByRole('row').filter({ hasText: keyword }).getByRole('menuitem', { name: '削除' }).click();
  }

  async downloadCsv() {
    await this.container.getByLabel('CSVダウンロード').click();
  }

  async expectRowNotVisible(keyword: string) {
    await expect(this.grid.getByRole('row').filter({ hasText: keyword })).not.toBeVisible();
  }

  async expectRowVisible(keyword: string) {
    await expect(this.grid.getByRole('row').filter({ hasText: keyword })).toBeVisible();
  }

  async expectTableVisible() {
    await expect(this.grid).toBeVisible();
  }

  async search(keyword: string) {
    await this.container.getByLabel('Search').locator('input').fill(keyword);
    await this.page.waitForTimeout(500);
  }
}
