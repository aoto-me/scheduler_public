import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BlockEditor } from '../components/BlockEditor.js';
import { ImageSlider } from '../components/ImageSlider.js';
import { PageTitle } from '../components/PageTitle.js';

export class DiaryCardDetailPage {
  readonly editor: BlockEditor;
  readonly slider: ImageSlider;
  readonly title: PageTitle;

  constructor(private readonly page: Page) {
    // Gallery と異なる API パス
    this.editor = new BlockEditor(page, '/backend/api/diary/content');
    this.slider = new ImageSlider(page);
    this.title = new PageTitle(page, '/backend/api/diary/title');
  }

  // 2枚目以降のアップロード（DiaryAPI の応答とスライド数で完了確認）
  async attachAdditionalImageFile(filePath: string, expectedItemCount: number): Promise<void> {
    const uploadInput = this.page.locator('[data-testid="image-slider"] input[type="file"]');
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/diary/item/') && resp.status() === 200
    );
    await uploadInput.setInputFiles(filePath);
    await responsePromise;
    await expect(this.page.locator('[data-testid="image-slider"] .slick-slide:not(.slick-cloned)')).toHaveCount(
      expectedItemCount
    );
  }

  async clickDeleteCardButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'カードの削除' }).click();
  }

  async expectBreadcrumbsVisible(): Promise<void> {
    await expect(this.page.getByLabel('パンくずリスト')).toBeVisible();
  }

  // Diary では日付フィールドが disabledになっている
  async expectDateDisabled(): Promise<void> {
    const group = this.page.getByRole('group', { name: '日付' });
    await expect(group.getByRole('spinbutton', { name: 'Year' })).toBeDisabled();
  }

  async expectDateVisible(): Promise<void> {
    await expect(this.page.getByRole('group', { name: '日付' })).toBeVisible();
  }

  // カード削除後に /gallery/diary にリダイレクトされることを確認する
  async expectRedirectedToDiaryList(): Promise<void> {
    await expect(this.page).toHaveURL(/\/gallery\/diary$/);
  }
}
