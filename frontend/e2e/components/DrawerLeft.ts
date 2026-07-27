import { expect, type Locator, type Page } from '@playwright/test';

export class DrawerLeft {
  get menuLinks(): Locator {
    return this.drawer.getByRole('link');
  }

  private readonly closeButton: Locator;
  private readonly drawer: Locator;
  private readonly openButton: Locator;

  constructor(page: Page) {
    this.drawer = page.locator('#drawer');
    this.openButton = page.getByRole('button', { name: 'ドロワーを開く' });
    this.closeButton = page.getByRole('button', { name: 'ドロワーを閉じる' });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.expectClosed();
  }

  async expectClosed(): Promise<void> {
    await expect(this.drawer).toHaveAttribute('inert');
  }

  async expectOpened(): Promise<void> {
    await expect(this.drawer).toBeVisible();
    await expect(this.drawer).not.toHaveAttribute('inert');
  }

  async open(): Promise<void> {
    await this.openButton.click();
    await this.expectOpened();
  }
}
