import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface VirtualFile {
  buffer: Buffer;
  mimeType: string;
  name: string;
}

export class GalleryImageGrid {
  private readonly items;

  // リネームフィールドは isEdit=true のアイテム内にのみ存在する（同時に1つのみ）
  private get renameField() {
    return this.page.locator('[data-testid="image-item"] input[type="text"]');
  }

  private get uploadInput() {
    return this.page.locator('li:not([data-testid="image-item"]) input[type="file"]');
  }

  constructor(private readonly page: Page) {
    this.items = page.locator('[data-testid="image-item"]');
  }

  async attachImageFile(filePath: string): Promise<void> {
    const countBefore = await this.items.count();
    await this.uploadInput.setInputFiles(filePath);
    await expect(this.items).toHaveCount(countBefore + 1);
  }

  async attachVirtualImageFile(file: VirtualFile | VirtualFile[]): Promise<void> {
    await this.uploadInput.setInputFiles(file);
  }

  async blurRenameField(): Promise<void> {
    await this.renameField.blur();
  }

  // 先頭の画像アイテムをクリックしてモーダルを開く
  async clickFirstGridImage(): Promise<void> {
    // ImgButton（画像を囲む button）は各アイテム内の最初の button 要素
    await this.items.first().getByRole('button').first().click();
  }

  // 指定インデックスのアイテムのファイル操作メニューを開く
  async clickImageMenu(index: number): Promise<void> {
    await this.items.nth(index).getByRole('button', { name: 'ファイル操作メニュー' }).click();
  }

  async clickMenuAndFillRenameField({ index, name }: { index?: number; name: string }): Promise<void> {
    await this.clickImageMenu(index ?? 0);
    await this.clickMenuItemRename();
    await this.expectRenameFieldVisible();
    await this.fillRenameField(name);
  }

  async clickMenuItemCopyUrl(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'URLのコピー' }).click();
  }

  async clickMenuItemDelete(): Promise<void> {
    await this.page.getByRole('menuitem', { name: '削除' }).click();
  }

  async clickMenuItemDownload(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'ダウンロード' }).click();
  }

  async clickMenuItemOpen(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'ファイルを開く' }).click();
  }

  async clickMenuItemRename(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'ファイル名の変更' }).click();
  }

  async confirmRename(): Promise<void> {
    await this.renameField.press('Enter');
  }

  async expectDialogVisible(): Promise<void> {
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async expectFileCount(count: number): Promise<void> {
    await expect(this.items).toHaveCount(count);
  }

  // 指定インデックスのアイテムのファイル名（拡張子付き）を確認する
  async expectItemFileName(index: number, name: string): Promise<void> {
    await expect(this.items.nth(index).locator('p')).toContainText(name);
  }

  async expectRenameFieldNotVisible(): Promise<void> {
    await expect(this.renameField).not.toBeVisible();
  }

  async expectRenameFieldVisible(): Promise<void> {
    await expect(this.renameField).toBeVisible();
  }

  async expectRenameHelperText(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectUploadError(message: string): Promise<void> {
    await expect(this.page.getByRole('alert').filter({ hasText: message })).toBeVisible();
  }

  // アップローダーの input がDOMに存在することを確認する（ImageGrid が表示状態の判定）
  // react-dropzone v19以降、input自体はwidth/height:0で隠されるためtoBeVisible()は使えない
  async expectVisible(): Promise<void> {
    await expect(this.uploadInput).toBeAttached();
  }

  async fillRenameField(value: string): Promise<void> {
    await expect(this.renameField).toBeVisible();
    await this.renameField.clear();
    await this.renameField.fill(value);
  }

  async getFileCount(): Promise<number> {
    return this.items.count();
  }
}
