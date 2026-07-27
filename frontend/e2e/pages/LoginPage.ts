import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  private readonly page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectRedirectedToHome() {
    await expect(this.page).toHaveURL('/');
  }

  async fillPassword(value: string) {
    await this.page.locator('#password').fill(value);
  }

  async fillUserName(value: string) {
    await this.page.locator('#userName').fill(value);
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(userName: string, password: string) {
    await this.fillUserName(userName);
    await this.fillPassword(password);
    await this.submit();
  }

  async logout() {
    await this.page.getByRole('button', { name: 'logout' }).click();
  }

  async submit() {
    await this.page.getByRole('button', { name: 'ログイン' }).click();
  }
}
