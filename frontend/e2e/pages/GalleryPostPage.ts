import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { GalleryCardList } from '../components/GalleryCardList.js';
import { GalleryImageGrid } from '../components/GalleryImageGrid.js';
import { PageTitle } from '../components/PageTitle.js';

export class GalleryPostPage {
  readonly cardList: GalleryCardList;
  readonly imageGrid: GalleryImageGrid;
  readonly title: PageTitle;
  private readonly breadcrumbs;
  private readonly selectTypeText;

  constructor(private readonly page: Page) {
    this.breadcrumbs = page.getByLabel('パンくずリスト');
    this.cardList = new GalleryCardList(page);
    this.imageGrid = new GalleryImageGrid(page);
    this.selectTypeText = page.getByText('ページタイプを選択');
    this.title = new PageTitle(page, '/backend/api/gallery/title');
  }

  async clickCardTypeButton(): Promise<void> {
    await this.page.getByRole('button', { name: '画像とテキスト' }).click();
  }

  async clickImgTypeButton(): Promise<void> {
    await this.page.getByRole('button', { name: '画像のみ' }).click();
  }

  async expectBreadcrumbsVisible(): Promise<void> {
    await expect(this.breadcrumbs).toBeVisible();
  }

  async expectSelectTypeNotVisible(): Promise<void> {
    await expect(this.selectTypeText).not.toBeVisible();
  }

  async expectSelectTypeVisible(): Promise<void> {
    await expect(this.selectTypeText).toBeVisible();
  }
}
