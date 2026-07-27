import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { DataGrid } from '../components/DataGrid.js';
import { FoodForm, type FoodNutrition } from '../components/FoodForm.js';
import { HealthForm } from '../components/HealthForm.js';
import { MonthSelector } from '../components/MonthSelector.js';

export class HealthPage {
  readonly food: DataGrid;
  readonly foodForm: FoodForm;
  readonly health: DataGrid;
  readonly healthForm: HealthForm;
  readonly monthSelector: MonthSelector;

  constructor(private readonly page: Page) {
    this.monthSelector = new MonthSelector(page);
    this.healthForm = new HealthForm(page);
    this.foodForm = new FoodForm(page);
    const foodGrid = page.getByRole('grid').first();
    const healthGrid = page.getByRole('grid').nth(1);
    this.food = new DataGrid(page, foodGrid, foodGrid.locator('..'));
    this.health = new DataGrid(page, healthGrid, healthGrid.locator('..'));
  }

  async addFoodRecord(name: string, quantity: string, energy: string, nutrition?: FoodNutrition): Promise<void> {
    await this.clickFoodAddButton();
    await this.foodForm.expectDialogVisible();
    await this.foodForm.fillAndSubmit({ energy, name, quantity, ...nutrition });
    await this.food.expectRowVisible(name);
  }

  async addHealthRecord(
    day: number,
    mental: number,
    options?: { checkFirstCategory?: boolean; exercise?: boolean; memo?: string; other?: string }
  ): Promise<string | undefined> {
    // 前回テスト失敗でデータが残っている場合に備えて事前クリーンアップ
    const dayStr = this.formatHealthDay(day);
    const existing = this.health.grid.getByRole('row').filter({ hasText: dayStr });
    if ((await existing.count()) > 0) {
      await this.health.deleteFromTable(dayStr);
      await this.health.expectRowNotVisible(dayStr);
    }
    await this.clickHealthAddButton();
    await this.healthForm.expectDialogVisible();
    const categoryName = await this.healthForm.fillAndSubmit({ day, mental, ...options });
    await this.health.expectRowVisible(this.formatHealthDay(day));
    return categoryName;
  }

  async clickFoodAddButton() {
    await this.food.container.getByRole('button', { name: '食事記録を追加' }).click();
  }

  async clickHealthAddButton() {
    await this.health.container.getByRole('button', { name: '体調を追加' }).click();
  }

  async expectExerciseSummarySectionVisible() {
    await expect(this.page.getByText('運動した日')).toBeVisible();
  }

  async expectFoodSectionVisible() {
    await expect(this.page.getByRole('heading', { level: 3, name: '食事記録' })).toBeVisible();
  }

  async expectFoodSummarySectionVisible() {
    await expect(this.page.getByTestId('food-summary')).toBeVisible();
  }

  async expectHealthSectionVisible() {
    await expect(this.page.getByRole('heading', { level: 3, name: '体調' })).toBeVisible();
  }

  async expectHealthSummarySectionVisible() {
    await expect(this.page.getByTestId('health-summary')).toBeVisible();
  }

  async getExerciseCountText() {
    return this.page.getByTestId('exercise-count-value').textContent();
  }

  async getFoodCarbAverageText() {
    return this.page.getByTestId('food-carb-average').textContent();
  }

  async getFoodEnergyAverageText() {
    return this.page.getByTestId('food-energy-average').textContent();
  }

  async getFoodFatAverageText() {
    return this.page.getByTestId('food-fat-average').textContent();
  }

  async getFoodProteinAverageText() {
    return this.page.getByTestId('food-protein-average').textContent();
  }

  async getFoodSaltAverageText() {
    return this.page.getByTestId('food-salt-average').textContent();
  }

  async getMentalAverageText() {
    return this.page.getByTestId('mental-average-value').textContent();
  }

  async goto() {
    await this.page.goto('/health');
  }

  private formatHealthDay(day: number): string {
    const now = new Date();
    return `${String(now.getFullYear())}/${String(now.getMonth() + 1)}/${String(day).padStart(2, '0')}`;
  }
}
