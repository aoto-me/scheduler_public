import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface VirtualFile {
  buffer: Buffer;
  mimeType: string;
  name: string;
}

export class ImageSlider {
  private readonly container;

  private get renameField() {
    return this.container.locator('input[type="text"]');
  }

  private get uploadInput() {
    return this.container.locator('input[type="file"]');
  }

  constructor(private readonly page: Page) {
    this.container = page.locator('[data-testid="image-slider"]');
  }

  // 画像１枚目のアップロード
  async attachFirstImageFile(filePath: string): Promise<void> {
    await this.uploadInput.setInputFiles(filePath);
  }

  // 2枚目以降のアップロード
  async attachImageFile(filePath: string, expectedItemCount: number): Promise<void> {
    await this.uploadInput.setInputFiles(filePath);
    await this.page.waitForResponse(resp => resp.url().includes('/backend/api/gallery/item/') && resp.status() === 200);
    await expect(this.container.locator('.slick-slide:not(.slick-cloned)')).toHaveCount(expectedItemCount);
  }

  async attachVirtualImageFile(file: VirtualFile | VirtualFile[]): Promise<void> {
    await this.uploadInput.setInputFiles(file);
  }

  async blurRenameField(): Promise<void> {
    await this.renameField.blur();
  }

  async clickMenuAndFillRenameField({ index, name }: { index?: number; name: string }): Promise<void> {
    await this.openImageMenu(index ?? 0);
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

  async clickMenuItemSetThumbnail(): Promise<void> {
    await this.page.getByRole('menuitem', { name: '画像をサムネイルに設定' }).click();
  }

  async confirmRename(): Promise<void> {
    await this.renameField.press('Enter');
  }

  async expectEmptyMessageHidden(): Promise<void> {
    await expect(this.page.getByText('画像/動画の登録がありません')).not.toBeVisible();
  }

  async expectEmptyMessageVisible(): Promise<void> {
    await expect(this.page.getByText('画像/動画の登録がありません')).toBeVisible();
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

  async expectSlideCount(count: number): Promise<void> {
    await expect(this.container.locator('.slick-slide:not(.slick-cloned)')).toHaveCount(count);
  }

  // slick の cloned スライドを除いた非クローンスライド内で一致するファイル名を探す
  async expectSlideFileName(name: string): Promise<void> {
    await expect(
      this.page.locator('.slick-slide:not(.slick-cloned) h6').filter({ hasText: name }).first()
    ).toBeVisible();
  }

  async expectUploadError(message: string): Promise<void> {
    await expect(this.page.getByRole('alert').filter({ hasText: message })).toBeVisible();
  }

  async expectVisible(): Promise<void> {
    await expect(this.container).toBeVisible();
  }

  async fillRenameField(value: string): Promise<void> {
    await this.renameField.clear();
    await this.renameField.fill(value);
  }

  async getSlideCount(): Promise<number> {
    return this.page.locator('.slick-slide:not(.slick-cloned)').count();
  }

  // index 番目のファイル操作メニューを開く
  // slick slider では非アクティブスライドが aria-hidden になるため、
  // サムネイルをクリックしてアクティブにしてからメニューボタンをクリックする
  async openImageMenu(index: number): Promise<void> {
    const open = async () => {
      const thumbnailImgs = this.container.locator('li img[alt*="サムネイル"]');
      const thumbnailCount = await thumbnailImgs.count();

      if (thumbnailCount > index) {
        await thumbnailImgs.nth(index).click();
        await expect(this.container.locator('.slick-slide:not(.slick-cloned)').nth(index)).toHaveClass(/slick-current/);
      }

      const button = this.container
        .locator('.slick-slide.slick-current:not(.slick-cloned)')
        .getByRole('button', { exact: true, name: 'ファイル操作メニュー' });

      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      await button.click();
    };

    const menuItem = this.page.getByRole('menuitem', { name: 'ファイル名の変更' });

    await open();

    // 開いてなければもう一度だけ試す
    if ((await menuItem.count()) === 0) {
      await open();
    }

    // 最終確認（ここで落ちる場合は、バグ）
    await expect(menuItem).toBeVisible();
  }
}
