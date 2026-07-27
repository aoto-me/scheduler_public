import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class FileUploader {
  constructor(private readonly page: Page) {}

  // ファイルインプットにファイルパスをセットする
  async attachFiles(filePaths: string | string[]) {
    const input = this.page.locator('input[type="file"]');
    await input.setInputFiles(filePaths);
  }

  // ファイルインプットに仮想ファイルをセットする
  async attachVirtualFiles(files: { buffer: Buffer; mimeType: string; name: string }[]) {
    const input = this.page.locator('input[type="file"]');
    await input.setInputFiles(files);
  }

  async clickUploadButton() {
    await this.page.getByRole('button', { name: 'ファイルをアップロード' }).click();
  }

  async dropzoneVisible() {
    await expect(this.page.getByText('ファイルをドラッグ or クリックして選択')).toBeVisible();
  }

  async expectErrorVisible(message: string) {
    await expect(this.page.getByRole('alert').filter({ hasText: message })).toBeVisible();
  }

  async expectFileInList(name: string) {
    await expect(this.page.getByRole('list').getByText(name, { exact: false })).toBeVisible();
  }

  async expectFileNotInList(name: string) {
    await expect(this.page.getByRole('listitem').filter({ hasText: name })).not.toBeVisible();
  }

  async expectUploadButtonHidden() {
    await expect(this.page.getByRole('button', { name: 'ファイルをアップロード' })).not.toBeVisible();
  }

  async expectUploadButtonVisible() {
    await expect(this.page.getByRole('button', { name: 'ファイルをアップロード' })).toBeVisible();
  }

  async filesUpload(filePaths: string | string[]) {
    await this.attachFiles(filePaths);
    await this.clickUploadButton();
  }

  async removeFileFromList(name: string) {
    const item = this.page.getByRole('listitem').filter({ hasText: name });
    await item.getByRole('button', { name: '削除' }).click();
  }
}
