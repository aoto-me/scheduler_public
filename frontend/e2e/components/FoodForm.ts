import { expect, type Page } from '@playwright/test';

export interface FoodNutrition {
  carb?: string;
  fat?: string;
  protein?: string;
  salt?: string;
}

export class FoodForm {
  constructor(private readonly page: Page) {}

  async clickAutoFill() {
    await this.page.getByRole('button', { name: 'データベースから自動入力' }).click();
  }

  async clickDelete() {
    await this.page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
  }

  async clickSubmit() {
    // 新規: '保存'、更新: '更新' ボタン（同一 button[type="submit"]）
    await this.page.getByRole('dialog').locator('button[type="submit"]').click();
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }

  async deleteFoodFromForm() {
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
    carb?: string;
    energy?: string;
    fat?: string;
    name?: string;
    protein?: string;
    quantity?: string;
    salt?: string;
  }): Promise<void> {
    if (options?.name !== undefined) await this.fillFoodName(options.name);
    if (options?.quantity !== undefined) await this.fillFoodQuantity(options.quantity);
    if (options?.energy !== undefined) await this.fillFoodEnergy(options.energy);
    if (options?.protein) await this.fillFoodProtein(options.protein);
    if (options?.fat) await this.fillFoodFat(options.fat);
    if (options?.carb) await this.fillFoodCarb(options.carb);
    if (options?.salt) await this.fillFoodSalt(options.salt);
    await this.clickSubmit();
  }

  async fillFoodCarb(carb: string) {
    await this.page.getByRole('dialog').locator('#carb').fill(carb);
  }

  async fillFoodEnergy(energy: string) {
    await this.page.getByRole('dialog').locator('#energy').fill(energy);
  }

  async fillFoodFat(fat: string) {
    await this.page.getByRole('dialog').locator('#fat').fill(fat);
  }

  async fillFoodName(name: string) {
    // Autocomplete（freeSolo）の入力フィールド
    await this.page.getByRole('dialog').getByLabel('名称を選択 or 入力').fill(name);
  }

  async fillFoodProtein(protein: string) {
    await this.page.getByRole('dialog').locator('#protein').fill(protein);
  }

  async fillFoodQuantity(quantity: string) {
    await this.page.getByRole('dialog').locator('#quantity').fill(quantity);
  }

  async fillFoodSalt(salt: string) {
    await this.page.getByRole('dialog').locator('#salt').fill(salt);
  }
}
