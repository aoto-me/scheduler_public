import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class DiaryCardList {
  private readonly addCardButton;
  private readonly cards;

  constructor(private readonly page: Page) {
    this.cards = page.locator('[data-testid="diary-card-item"]');
    this.addCardButton = page.getByRole('button', { name: 'カードを追加' });
  }

  // 「カードを追加」ボタンをクリックして日付を入力し、カードを追加する
  async addCard(date: string): Promise<void> {
    await this.addCardButton.click();
    await expect(this.page.getByRole('group', { name: '日付' })).toBeVisible();
    await this.selectDateInModal(date);
    await this.page.getByRole('button', { name: '日付のカードを追加' }).click();
    // モーダルが閉じるまで待つ
    await expect(this.page.getByRole('group', { name: '日付' })).not.toBeVisible();
    // DiaryList のタイトル形式は yyyy/MM/dd
    const [year, month, day] = date.split('-');
    const formattedDate = `${year}/${month}/${day}`;
    await expect(this.cards.filter({ hasText: formattedDate })).toBeVisible();
  }

  // 「カードを追加」ボタンをクリックしてモーダルを開く（追加はしない）
  async clickAddCard(): Promise<void> {
    await this.addCardButton.click();
    await expect(this.page.getByRole('group', { name: '日付' })).toBeVisible();
  }

  // 日付文字列（yyyy/MM/dd）でカードをクリックして詳細ページへ遷移する
  async clickCardByDate(formattedDate: string): Promise<void> {
    await this.cards.filter({ hasText: formattedDate }).first().click();
  }

  async clickFirstCard(): Promise<void> {
    await this.cards.first().click();
  }

  async expectAddCardButtonVisible(): Promise<void> {
    await expect(this.addCardButton).toBeVisible();
  }

  async expectBreadcrumbsVisible(): Promise<void> {
    await expect(this.page.getByLabel('パンくずリスト')).toBeVisible();
  }

  async expectCardsVisible(): Promise<void> {
    await expect(this.cards.first()).toBeVisible({ timeout: 10_000 });
  }

  // モーダル内の DatePicker に YYYY-MM-DD 形式で日付を入力する
  async selectDateInModal(value: string): Promise<void> {
    const [year, month, day] = value.split('-');
    const group = this.page.getByRole('group', { name: '日付' });
    await group.getByRole('spinbutton', { name: 'Year' }).click();
    await this.page.keyboard.type(year);
    await group.getByRole('spinbutton', { name: 'Month' }).click();
    await this.page.keyboard.type(month);
    await group.getByRole('spinbutton', { name: 'Day' }).click();
    await this.page.keyboard.type(day);
    await this.page.keyboard.press('Tab');
  }
}
