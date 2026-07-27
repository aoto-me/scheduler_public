import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class WordSearch {
  private readonly button;
  private readonly input;

  constructor(private readonly page: Page) {
    this.input = page.locator('main').getByPlaceholder('検索');
    this.button = page.getByRole('button', { name: '検索' });
  }

  async expectInitialMessage() {
    await expect(this.page.getByText('検索ワードを入力してください')).toBeVisible();
  }

  async expectNoResults() {
    await expect(this.page.getByText('該当するデータは見つかりませんでした')).toBeVisible();
  }

  async expectResultCards() {
    await expect(this.page.locator('main .MuiPaper-outlined').first()).toBeVisible();
  }

  async expectResultVisible(word: string) {
    await expect(this.page.getByText(`検索ワード：${word}`, { exact: false })).toBeVisible();
  }

  async formVisible() {
    await expect(this.input).toBeVisible();
    await expect(this.button).toBeVisible();
  }

  async search(word: string) {
    await this.input.fill(word);
    await this.button.click();
  }
}
