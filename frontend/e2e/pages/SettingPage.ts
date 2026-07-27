import { Download, expect, type Locator, type Page } from '@playwright/test';

type NutritionField = 'carb' | 'energy' | 'fat' | 'protein' | 'salt';

export class DataTableSection {
  get editInput(): Locator {
    return this.grid.locator(`[data-field="${this.editField}"] input`);
  }

  get firstRow(): Locator {
    return this.grid.getByRole('row').nth(1);
  }

  protected readonly container;
  protected readonly grid;

  constructor(
    protected readonly page: Page,
    private readonly sectionTitle: string,
    private readonly editField = 'name'
  ) {
    this.grid = page.getByRole('grid', { name: sectionTitle });
    this.container = this.grid.locator('..');
  }

  async addRow(fields: Record<string, string>): Promise<void> {
    await this.clickAddButton();
    await this.fillFields(fields);
    await this.clickSaveButton();
  }

  async cancelDelete(rowText: string): Promise<void> {
    this.handleDialog(false);
    await this.row(rowText).getByRole('menuitem', { name: '削除' }).click();
  }

  async cancelEdit(rowText: string, fields: Record<string, string>): Promise<void> {
    await this.clickEditButton(rowText);
    await this.fillFields(fields);
    await this.clickCancelButton();
  }

  async clearSearch(): Promise<void> {
    await this.container.getByLabel('検索リセット').click();
    await this.page.waitForTimeout(500); // 反映待ち
  }

  async clickAddButton(): Promise<void> {
    await this.container.getByRole('button', { name: 'データの追加' }).click();
  }

  async clickCancelButton(): Promise<void> {
    await this.grid.getByRole('menuitem', { name: 'キャンセル' }).click();
  }

  async deleteFirstRow(): Promise<void> {
    this.handleDialog(true);
    await this.firstRow.getByRole('menuitem', { name: '削除' }).click();
  }

  async deleteRow(rowText: string): Promise<void> {
    this.handleDialog(true);
    await this.row(rowText).getByRole('menuitem', { name: '削除' }).click();
  }

  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.container.getByLabel('CSVダウンロード').click(),
    ]);
    return download;
  }

  async expectLoaded(): Promise<void> {
    await expect(this.grid).toBeVisible();
  }

  row(text: string): Locator {
    return this.grid.getByRole('row').filter({
      has: this.page.locator(`[data-field="${this.editField}"]`, { hasText: text }),
    });
  }

  async rowExpectingValidationError(fields: Record<string, string>, errorMessage: string): Promise<void> {
    await this.addRow(fields);
    await expect(this.page.getByText(errorMessage)).toBeVisible();
    await this.clickCancelButton();
  }

  async search(keyword: string): Promise<void> {
    await this.container.getByRole('searchbox', { name: '検索...' }).fill(keyword);
    await this.page.waitForTimeout(500); // 反映待ち
  }

  async updateRow(rowText: string, fields: Record<string, string>): Promise<void> {
    await this.clickEditButton(rowText);
    await this.fillFields(fields);
    await this.clickSaveButton();
  }

  protected async clickEditButton(rowText: string): Promise<void> {
    await this.row(rowText).getByRole('menuitem', { name: '編集' }).click();
  }

  protected async clickSaveButton(): Promise<void> {
    await this.grid.getByRole('menuitem', { name: '保存' }).click();
  }

  protected async fillField(field: string, value: string): Promise<void> {
    await this.grid.locator(`[data-field="${field}"] input`).fill(value);
  }

  protected async fillFields(fields: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(fields)) {
      await this.fillField(field, value);
    }
  }

  private handleDialog(accept: boolean): void {
    this.page.once('dialog', d => (accept ? d.accept() : d.dismiss()));
  }
}

export class NutritionSettingPage extends DataTableSection {
  constructor(page: Page) {
    super(page, '1日の目標栄養値', 'energy');
  }

  async cancelNutritionUpdate(fields: Partial<Record<NutritionField, string>>): Promise<void> {
    await this.openEditForm();
    await this.fillFields(fields);
    await this.clickCancelButton();
    await expect(this.editInput).not.toBeVisible();
  }

  async editNutritionExpectingValidationErrors(
    fields: Partial<Record<NutritionField, string>>,
    ...messages: string[]
  ): Promise<void> {
    await this.openEditForm();
    await this.fillFields(fields);
    await this.clickSaveButton();
    for (const message of messages) {
      await expect(this.page.getByText(message)).toBeVisible();
    }
  }

  async expectAddButtonNotVisible(): Promise<void> {
    await expect(this.container.getByRole('button', { name: 'データの追加' })).not.toBeVisible();
  }

  async expectDeleteButtonNotVisible(): Promise<void> {
    await expect(this.grid.getByRole('menuitem', { name: '削除' })).not.toBeVisible();
  }

  async resetDefaultRow(): Promise<void> {
    await this.openEditForm();
    await this.fillFields({ carb: '250', energy: '1800', fat: '50', protein: '50', salt: '6.5' });
    await this.clickSaveButton();
  }

  // Nutritionは1行しかないので、列を限定せず含まれる文字列で行を検索する
  override row(text: string): Locator {
    return this.grid.getByRole('row').filter({ hasText: text });
  }

  async updateNutrition(fields: Partial<Record<NutritionField, string>>): Promise<void> {
    await this.openEditForm();
    await this.fillFields(fields);
    await this.clickSaveButton();
  }

  private async openEditForm(): Promise<void> {
    await this.grid.locator('[role="gridcell"][data-field="energy"]').dblclick();
  }
}

export class PrivateModeSettingPage {
  private readonly switchLocator;

  constructor(private readonly page: Page) {
    this.switchLocator = page.getByRole('switch', { name: 'プライベートモード' });
  }

  async expectChecked(): Promise<void> {
    await expect(this.switchLocator).toBeChecked();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.switchLocator).toBeVisible();
  }

  async expectPrivateModeMessageNotVisible(): Promise<void> {
    await expect(this.page.getByText('プライベートモードです')).not.toBeVisible({ timeout: 30_000 });
  }

  async expectPrivateModeMessageVisible(): Promise<void> {
    await expect(this.page.getByText('プライベートモードです')).toBeVisible({ timeout: 30_000 });
  }

  async expectUnchecked(): Promise<void> {
    await expect(this.switchLocator).not.toBeChecked();
  }

  async goto(path = '/setting'): Promise<void> {
    await this.page.goto(path);
  }

  async setPrivateMode(on: boolean): Promise<void> {
    const isChecked = await this.switchLocator.isChecked();
    if (isChecked !== on) {
      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/user') && r.request().method() === 'PATCH'),
        this.switchLocator.click(),
      ]);
    }
  }
}
