import { expect, type Locator } from '@playwright/test';

export class TodoCard {
  constructor(readonly locator: Locator) {}

  async click() {
    await this.locator.locator('button').first().click();
  }

  async clickCheckbox() {
    const responsePromise = this.locator
      .page()
      .waitForResponse(
        resp => resp.url().includes('/backend/api/todo/completed') && resp.request().method() === 'PATCH'
      );
    await this.locator.getByRole('checkbox').click({ force: true });
    await responsePromise;
  }

  async expectCheckboxChecked(checked: boolean) {
    await expect(this.locator.getByRole('checkbox')).toBeChecked({ checked });
  }

  async expectContainText(text: string) {
    await expect(this.locator).toContainText(text);
  }

  async expectEstimated(time: string) {
    await expect(this.locator).toContainText(time);
  }

  async expectNotVisible() {
    await expect(this.locator).not.toBeVisible();
  }

  async expectTaskTime(time: string) {
    await expect(this.locator).toContainText(time);
  }

  async expectVisible() {
    await expect(this.locator).toBeVisible();
  }
}
