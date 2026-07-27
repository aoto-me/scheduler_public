import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class GalleryCardList {
  private readonly addCardButton;
  private readonly cards;

  constructor(private readonly page: Page) {
    this.cards = page.locator('[data-testid="card-item"]');
    this.addCardButton = page.getByRole('button', { name: 'カードを追加' });
  }

  async addCard(): Promise<void> {
    const countBefore = await this.cards.count();
    await this.addCardButton.click();
    await expect(this.cards).toHaveCount(countBefore + 1);
  }

  async clickFirstCard(): Promise<void> {
    await this.cards.first().click();
  }

  async expectAddCardButtonVisible(): Promise<void> {
    await expect(this.addCardButton).toBeVisible();
  }

  async expectCardCount(count: number): Promise<void> {
    await expect(this.cards).toHaveCount(count);
  }

  async getCardCount(): Promise<number> {
    return this.cards.count();
  }
}
