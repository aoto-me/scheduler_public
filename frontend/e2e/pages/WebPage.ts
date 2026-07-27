import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class WebPage {
  private readonly errorSection;
  private readonly page;
  private readonly rssSection;
  private readonly webListSection;

  constructor(page: Page) {
    this.page = page;
    this.rssSection = page.getByRole('heading', { level: 3, name: '新着記事' }).locator('..');
    this.webListSection = page.getByRole('heading', { level: 3, name: 'サイト更新（RSSなし）' }).locator('..');
    this.errorSection = page.getByRole('heading', { level: 3, name: 'データ取得エラー' }).locator('..');
  }

  async expectDateHeaders(dates: string[]) {
    for (const date of dates) {
      await expect(this.webListSection.getByRole('heading', { level: 6, name: date })).toBeVisible();
    }
  }

  async expectErrors(rows: { error: string; siteName: string; url: string }[]) {
    await expect(this.errorSection.getByRole('heading', { level: 3, name: 'データ取得エラー' })).toBeVisible();
    for (const row of rows) {
      await expect(this.errorSection.getByRole('listitem').filter({ hasText: row.siteName })).toBeVisible();
      await expect(this.errorSection.locator(`a[href="${row.url}"]`)).toBeVisible();
      await expect(this.errorSection.getByText(`エラー：${row.error}`)).toBeVisible();
    }
  }

  async expectInitialView() {
    await expect(this.page).toHaveURL('/web');
    await expect(this.page.getByRole('heading', { level: 3, name: '新着記事' })).toBeVisible();
    await expect(this.page.getByRole('heading', { level: 3, name: 'サイト更新（RSSなし）' })).toBeVisible();
  }

  async expectMoreLoadsItems() {
    const before = await this.rssSection.locator('.linkBlockTitle').count();
    await this.rssSection.getByRole('button', { name: 'もっと見る' }).click();
    const after = await this.rssSection.locator('.linkBlockTitle').count();
    expect(after).toBeGreaterThan(before);
  }

  async expectRssError() {
    await expect(this.errorSection.getByText('エラー：RSSの取得が0件でした')).toBeVisible();
  }

  async expectRssItems() {
    const firstLink = this.rssSection.locator('a[href][title]').first();
    await expect(firstLink.locator('.linkBlockTitle')).toBeVisible();
    await expect(firstLink.locator('img')).toBeVisible();
  }

  async expectWebList(rows: { siteName: string; url: string }[]) {
    for (const row of rows) {
      await expect(this.webListSection.locator('.linkBlockTitle', { hasText: row.siteName })).toBeVisible();
      await expect(this.webListSection.locator(`a[href="${row.url}"]`)).toBeVisible();
    }
  }

  async goto() {
    await this.page.goto('/web');
  }

  async waitForRssLoaded() {
    await this.rssSection.locator('.linkBlockTitle').first().waitFor({ state: 'visible', timeout: 90_000 });
  }

  async waitForWebListLoaded() {
    await this.webListSection.getByRole('heading', { level: 6 }).first().waitFor({ state: 'visible' });
  }
}
