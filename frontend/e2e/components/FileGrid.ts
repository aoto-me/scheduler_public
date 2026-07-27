import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class FileGrid {
  constructor(
    private readonly page: Page,
    private readonly panelId: string
  ) {}

  async blurRenameField() {
    await this.page.locator(this.panelId).getByRole('textbox').blur();
  }

  async clickClearSelection() {
    await this.page.getByRole('button', { name: 'すべての選択を解除' }).click();
  }

  async clickDeleteSelected() {
    await this.page.getByRole('button', { name: '選択中のファイルを削除' }).click();
  }

  async clickDownloadSelected() {
    await this.page.getByRole('button', { name: '選択中のファイルをダウンロード' }).click();
  }

  // ファイルカードをクリックして選択する（name は拡張子込みの完全なファイル名）
  async clickFileCard(name: string) {
    const btn = this.page.getByRole('button', { name: `${name}を選択` });
    await expect(btn).toBeVisible();
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  async clickMenuItemCopyUrl() {
    await this.page.getByRole('menuitem', { name: 'URLのコピー' }).click();
  }

  async clickMenuItemDelete() {
    await this.page.getByRole('menuitem', { name: '削除' }).click();
  }

  async clickMenuItemDownload() {
    await this.page.getByRole('menuitem', { name: 'ダウンロード' }).click();
  }

  async clickMenuItemOpen() {
    await this.page.getByRole('menuitem', { name: 'ファイルを開く' }).click();
  }

  async clickMenuItemRename() {
    await this.page.getByRole('menuitem', { name: 'ファイル名の変更' }).click();
  }

  async clickSelectAll() {
    await this.page.getByRole('button', { name: 'すべて選択' }).click();
  }

  async confirmRename() {
    await this.page.locator(this.panelId).getByRole('textbox').press('Enter');
  }

  async deleteFile(fileName: string) {
    await this.openFileMenu(fileName);
    this.page.once('dialog', dialog => dialog.accept());
    await this.clickMenuItemDelete();
  }

  async expectClearSelectionDisabled() {
    await expect(this.page.getByRole('button', { name: 'すべての選択を解除' })).toBeDisabled();
  }

  async expectDeleteSelectedDisabled() {
    await expect(this.page.getByRole('button', { name: '選択中のファイルを削除' })).toBeDisabled();
  }

  async expectDownloadDisabled() {
    await expect(this.page.getByRole('button', { name: '選択中のファイルをダウンロード' })).toBeDisabled();
  }

  async expectFileCardNotVisible(name: string) {
    await expect(this.page.getByTestId(`file-item-${name}`)).not.toBeVisible();
  }

  async expectFileCardVisible(name: string) {
    await expect(this.page.getByTestId(`file-item-${name}`)).toBeVisible();
  }

  async expectRenameError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectSelectionCount(n: number) {
    await expect(this.page.getByText(`${String(n)}件選択中`, { exact: false })).toBeVisible();
  }

  async fillRenameField(value: string) {
    const field = this.page.locator(this.panelId).getByRole('textbox');
    await expect(field).toBeVisible();
    await field.clear();
    await field.fill(value);
  }

  async getFileCardCount() {
    return this.page.locator('[data-testid^="file-item-"]').count();
  }

  async openFileMenu(fileName: string) {
    const item = this.page.getByTestId(`file-item-${fileName}`);
    await expect(item).toBeVisible();
    await item.getByRole('button', { name: 'ファイル操作メニュー' }).click();
  }
}
