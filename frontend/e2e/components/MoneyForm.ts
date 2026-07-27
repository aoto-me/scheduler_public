import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class MoneyForm {
  constructor(private readonly page: Page) {}

  // DatePicker の全セクション（年・月・日）をクリアする
  async clearDate() {
    const modal = this.page.getByRole('dialog');
    const sections = modal.locator('.MuiPickersSectionList-section');
    const count = await sections.count();
    for (let i = 0; i < count; i++) {
      await sections.nth(i).click();
      await this.page.keyboard.press('Delete');
    }
  }

  async clickDelete() {
    await this.page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
  }

  async clickSubmit() {
    await this.page.getByRole('dialog').locator('button[type="submit"]').click();
  }

  async closeDialog() {
    await this.page.keyboard.press('Escape');
  }

  async deleteFromForm() {
    await this.clickDelete();
    await this.expectDialogHidden();
  }

  async expectDialogHidden() {
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  async expectDialogVisible() {
    await expect(this.page.getByRole('dialog')).toBeVisible();
    await expect(this.page.getByRole('dialog').locator('#content')).toBeVisible();
  }

  async expectFieldError(fieldId: string, message: string) {
    await expect(this.page.getByRole('dialog').locator(`#${fieldId}-helper-text`)).toContainText(message);
  }

  async fillAmount(amount: number | string) {
    await this.page.getByRole('dialog').locator('#amount').fill(String(amount));
  }

  async fillAndSubmit(
    options: {
      amount?: number | string;
      category?: number;
      clearDate?: boolean;
      content?: string;
      day?: number;
      type?: '収入' | '支出';
    } = {}
  ): Promise<string | undefined> {
    if (options.type !== undefined) await this.selectType(options.type);
    const categoryName =
      options.category === undefined ? undefined : await this.selectCategoryAndGetCategoryName(options.category);
    if (options.content !== undefined) await this.fillContent(options.content);
    if (options.amount !== undefined) await this.fillAmount(options.amount);
    if (options.day !== undefined) await this.fillDay(options.day);
    if (options.clearDate) await this.clearDate();
    await this.clickSubmit();
    return categoryName;
  }

  async fillContent(content: string) {
    await this.page.getByRole('dialog').locator('#content').fill(content);
  }

  // DatePicker の日フィールドに日付を入力する
  // yyyy / MM / dd 順で nth(2) が日セクション
  async fillDay(day: number) {
    const modal = this.page.getByRole('dialog');
    await modal.locator('.MuiPickersSectionList-section').nth(2).click();
    await this.page.keyboard.type(String(day).padStart(2, '0'));
  }

  // カテゴリーセレクトの指定した位置の選択肢を選び、その名前を返す
  // 0は「カテゴリを選択」（value=0）なので index は 1 始まり
  // MUI Select は combobox をクリックして開く
  async selectCategoryAndGetCategoryName(index = 1): Promise<string> {
    await this.page.getByRole('dialog').getByRole('combobox').click();
    const option = this.page.getByRole('option').nth(index);
    const name = (await option.textContent()) ?? '';
    await option.click();
    return name.trim();
  }

  async selectType(type: '収入' | '支出') {
    await this.page.getByRole('dialog').getByRole('button', { name: type }).click();
  }
}
