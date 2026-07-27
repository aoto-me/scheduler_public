import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class PageTitle {
  private readonly titleInput;

  constructor(
    private readonly page: Page,
    private readonly apiPath: string
  ) {
    this.titleInput = page.locator('#title');
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectValue(value: string) {
    await expect(this.titleInput).toHaveValue(value);
  }

  async expectVisible() {
    await expect(this.titleInput).toBeVisible();
  }

  // fill('') だと、空の場合イベントが発火しないため、わざと' 'にしている
  async fill(value: string) {
    await this.titleInput.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Delete');
    await (value ? this.page.keyboard.type(value) : this.titleInput.fill(' '));
  }

  async getValue(): Promise<string> {
    return this.titleInput.inputValue();
  }

  async waitForSaved() {
    await this.page.waitForResponse(resp => resp.url().includes(this.apiPath) && resp.request().method() === 'PATCH');
  }
}
