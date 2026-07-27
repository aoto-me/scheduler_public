import { expect, Locator, type Page } from '@playwright/test';
import { TodoCard } from './TodoCard.js';

export class KanbanBoard {
  private readonly containers;

  constructor(private readonly page: Page) {
    this.containers = page.locator('[data-testid="section-container"]');
  }

  async addSection() {
    const countBefore = await this.getSectionCount();
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/section') && resp.request().method() === 'POST'
    );
    await this.clickAddSectionButton();
    await responsePromise;
    await this.expectSectionCount(countBefore + 1);
  }

  async clickAddSectionButton() {
    await this.page.getByRole('button', { name: 'セクションを追加' }).click();
  }

  async clickAddTodoButtonInSection(container: Locator) {
    await container.getByRole('button', { name: 'ToDoを追加' }).click();
  }

  async clickDeleteSectionButton(container: Locator) {
    await container.locator('.containerActions').getByRole('button').first().click({ force: true });
  }

  // セクションを削除してDELETE APIの完了を待つ
  async deleteSection(container: Locator) {
    const countBefore = await this.getSectionCount();
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/section') && resp.request().method() === 'DELETE'
    );
    await container.locator('.containerActions').getByRole('button').first().click({ force: true });
    await responsePromise;
    await this.expectSectionCount(countBefore - 1);
  }

  async editSectionName(container: Locator, name: string) {
    const nameInput = this.getSectionNameInput(container);
    await expect(nameInput).toBeVisible();
    await nameInput.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Delete'); // 選択中のテキストを削除してonChangeを発火させる
    await this.page.keyboard.type(name);
  }

  // セクション名を編集してPATCHの完了を待つ
  async editSectionNameAndWaitForSave(container: Locator, name: string) {
    await this.editSectionName(container, name);
    await this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/section/edit') && resp.request().method() === 'PATCH'
    );
  }

  // 最後のセクションが「未分類」であることを確認する
  async expectNoCategoryLastSection() {
    await expect(this.containers.last()).toContainText('未分類');
  }

  async expectSectionCount(count: number) {
    await expect(this.containers).toHaveCount(count);
  }

  async expectSectionNameError(container: Locator, message: string) {
    await expect(container.getByText(message)).toBeVisible();
  }

  // TaskTimeBar のラベルに指定の時間文字列が表示されることを確認する
  async expectTaskTimeBarLabel(time: string) {
    await expect(this.page.locator('.MuiBarChart-label').filter({ hasText: time })).toBeVisible({ timeout: 10_000 });
  }

  // 最後のセクション（未分類）を返す
  getLastSection(): Locator {
    return this.containers.last();
  }

  // 末尾から2番目のセクション（未分類の1つ前）を返す
  async getSecondToLastSection(): Promise<Locator> {
    const count = await this.containers.count();
    return this.containers.nth(count - 2);
  }

  async getSectionCount() {
    return this.containers.count();
  }

  getSectionNameInput(container: Locator): Locator {
    return container.locator('#name');
  }

  getTodoCard(index = 0): TodoCard {
    return new TodoCard(this.page.locator('[data-testid="todo-card"]').nth(index));
  }

  async taskTimeBarVisible() {
    await expect(this.page.getByTestId('task-time-bar')).toBeVisible();
  }
}
