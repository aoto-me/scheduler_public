import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BlockEditor } from '../components/BlockEditor.js';
import { ImageSlider } from '../components/ImageSlider.js';
import { PageTitle } from '../components/PageTitle.js';

export class GalleryCardDetailPage {
  readonly editor: BlockEditor;
  readonly slider: ImageSlider;
  readonly title: PageTitle;

  constructor(private readonly page: Page) {
    this.editor = new BlockEditor(page, '/backend/api/gallery/cardContent');
    this.slider = new ImageSlider(page);
    this.title = new PageTitle(page, '/backend/api/gallery/cardTitle');
  }

  async clickDeleteCardButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'カードの削除' }).click();
  }

  async expectBreadcrumbsVisible(): Promise<void> {
    await expect(this.page.getByLabel('パンくずリスト')).toBeVisible();
  }

  async expectDateValue(value: string): Promise<void> {
    const [year, month, day] = value.split('-');
    const group = this.page.getByRole('group', { name: '日付' });
    await expect(group.getByRole('spinbutton', { name: 'Year' })).toHaveText(year);
    await expect(group.getByRole('spinbutton', { name: 'Month' })).toHaveText(month);
    await expect(group.getByRole('spinbutton', { name: 'Day' })).toHaveText(day);
  }

  async expectDateVisible(): Promise<void> {
    await expect(this.page.getByRole('group', { name: '日付' })).toBeVisible();
  }

  // カード削除後にカード一覧ページ（/gallery/:id）にリダイレクトされることを確認する
  async expectRedirectedToCardList(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/gallery\/[^/]+\/\d+/);
  }

  // 日付を入力する（'YYYY-MM-DD' 形式）
  // MUI X DatePicker は Year / Month / Day を個別の spinbutton として持つため各々を操作する
  async selectDate(value: string): Promise<void> {
    const [year, month, day] = value.split('-');
    const group = this.page.getByRole('group', { name: '日付' });
    await group.getByRole('spinbutton', { name: 'Year' }).click();
    await this.page.keyboard.type(year, { delay: 100 });
    await group.getByRole('spinbutton', { name: 'Month' }).click();
    await this.page.keyboard.type(month, { delay: 100 });
    await group.getByRole('spinbutton', { name: 'Day' }).click();
    await this.page.keyboard.type(day, { delay: 100 });
    await this.page.keyboard.press('Tab');
  }
}
