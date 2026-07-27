import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class HealthForm {
  constructor(private readonly page: Page) {}

  // 症状セクションの最初のカテゴリーチェックボックスにチェックを入れ、そのカテゴリー名を返す
  async checkFirstHealthCategoryAndGetCategoryName(): Promise<string> {
    const modal = this.page.getByRole('dialog');
    // MuiFormControlLabel-root の最初の要素（運動チェックボックスより前にある症状カテゴリー）
    const firstLabel = modal.locator('label.MuiFormControlLabel-root').first();
    const name = ((await firstLabel.locator('.MuiFormControlLabel-label').textContent()) ?? '').trim();
    await firstLabel.getByRole('checkbox').click();
    return name;
  }

  async checkHealthExercise() {
    await this.page.getByRole('dialog').getByRole('checkbox', { name: '運動' }).check();
  }

  async clickDelete() {
    await this.page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
  }

  async clickSubmit() {
    await this.page.getByRole('dialog').locator('button[type="submit"]').click();
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }

  async deleteHealthFromForm() {
    await this.clickDelete();
    await this.expectDialogHidden();
  }

  async expectDialogHidden() {
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  async expectDialogVisible() {
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }

  async expectFieldError(fieldId: string, message: string) {
    await expect(this.page.getByRole('dialog').locator(`#${fieldId}-helper-text`)).toContainText(message);
  }

  async fillAndSubmit(options?: {
    checkFirstCategory?: boolean;
    day?: number;
    exercise?: boolean;
    memo?: string;
    mental?: number;
    other?: string;
  }): Promise<string | undefined> {
    const categoryName = options?.checkFirstCategory
      ? await this.checkFirstHealthCategoryAndGetCategoryName()
      : undefined;
    if (options?.day !== undefined) await this.fillHealthDay(options.day);
    if (options?.mental !== undefined) await this.fillHealthMental(options.mental);
    if (options?.memo) await this.fillHealthMemo(options.memo);
    if (options?.other) await this.fillHealthOther(options.other);
    if (options?.exercise) await this.checkHealthExercise();
    await this.clickSubmit();
    return categoryName;
  }

  async fillHealthDay(day: number) {
    // DatePicker の日セクション（nth(2): yyyy/MM/dd 順）に数字を入力して日を設定
    const modal = this.page.getByRole('dialog');
    await modal.locator('.MuiPickersSectionList-section').nth(2).click();
    await this.page.keyboard.type(String(day).padStart(2, '0'));
  }

  async fillHealthMemo(memo: string) {
    await this.page.getByRole('dialog').locator('#memo').fill(memo);
  }

  async fillHealthMental(value: number) {
    // MUI Rating（id="mental"）は label > icon の構造のため、label をクリックして選択する
    const modal = this.page.getByRole('dialog');
    await modal
      .locator('[id="mental"] label')
      .nth(value - 1)
      .click();
  }

  async fillHealthOther(other: string) {
    await this.page.getByRole('dialog').locator('#other').fill(other);
  }
}
