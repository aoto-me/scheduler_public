import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class TodoForm {
  private readonly dialog;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog');
  }

  async addTaskTimeFrom() {
    await this.clickAddTaskTime();
    await this.expectTaskTimeGroupVisible();
  }

  async clickAddTaskTime() {
    await this.dialog.getByRole('button', { name: '作業時間を追加' }).click();
  }

  async clickDelete() {
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo') && resp.request().method() === 'DELETE'
    );
    await this.dialog.getByRole('button', { name: '削除' }).click();
    await responsePromise;
  }

  // プロジェクト候補をクリックする（名前指定、省略時は先頭候補を選択）
  async clickProjectOption(name?: string) {
    if (name) {
      await expect(this.page.getByRole('option', { name })).toBeVisible();
      await this.page.getByRole('option', { name }).click();
    } else {
      await expect(this.page.getByRole('option').first()).toBeVisible();
      await this.page.getByRole('option').first().click();
    }
  }

  async clickSubmit(label: '保存' | '更新'): Promise<{ id: number }> {
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo') && resp.request().method() === 'PUT'
    );
    await this.dialog.getByRole('button', { name: label }).click();
    const response = await responsePromise;
    const { result } = (await response.json()) as { result: { id: number } };
    return result;
  }

  async closeDialog() {
    await this.page.getByRole('button', { name: '閉じる' }).click();
    await expect(this.dialog).not.toBeVisible();
  }

  // 作業時間を削除（index 省略時は先頭を対象）
  async deleteTaskTime(index = 0) {
    const deleteResponse = this.page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo/taskTime') && resp.request().method() === 'DELETE'
    );
    this.page.once('dialog', dialog => void dialog.accept());
    await this.dialog.getByRole('button', { name: 'delete' }).nth(index).click();
    await deleteResponse;
  }

  async deleteTodo() {
    await this.expectDialogVisible();
    await this.clickDelete();
    await this.expectDialogHidden();
  }

  async expectDialogHidden() {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible();
    await expect(this.dialog.locator('#content')).toBeVisible();
  }

  // フィールドのバリデーションエラーが表示されていることを確認する（MUI の #${fieldId}-helper-text を参照）
  async expectFieldError(fieldId: string, message: string) {
    await expect(this.dialog.locator(`#${fieldId}-helper-text`)).toContainText(message);
  }

  // プロジェクトフィールドの値が期待値と一致することを確認する
  async expectProjectValue(value: string) {
    await expect(this.dialog.locator('#project')).toHaveValue(value);
  }

  // セクションの選択肢が1件以上存在することを確認する（ドロップダウンを開いて確認後に閉じる）
  async expectSectionHasAnyOption() {
    await this.dialog.locator('#section').click();
    await expect(this.page.getByRole('option').first()).toBeVisible();
    await this.page.keyboard.press('Escape');
  }

  // セクションの選択肢が存在しないことを確認する（ドロップダウンを開いて確認後に閉じる）
  async expectSectionHasNoOptions() {
    await this.dialog.locator('#section').click();
    await expect(this.page.getByText('セクションがありません')).toBeVisible();
    await this.page.keyboard.press('Escape');
  }

  // セクション選択肢に指定した名前が含まれることを確認する（確認後はドロップダウンを閉じる）
  async expectSectionHasOption(name: string) {
    await this.dialog.locator('#section').click();
    await expect(this.page.getByRole('option', { name })).toBeVisible();
    await this.page.keyboard.press('Escape');
  }

  // セクション選択肢に指定した名前が含まれないことを確認する（確認後はドロップダウンを閉じる）
  async expectSectionNotHasOption(name: string) {
    await this.dialog.locator('#section').click();
    await expect(this.page.getByRole('option', { name })).not.toBeVisible();
    await this.page.keyboard.press('Escape');
  }

  // 「開始時間」グループ（作業時間行）が表示されていることを確認する
  async expectTaskTimeGroupVisible() {
    await expect(this.dialog.getByRole('group', { name: '開始時間' })).toBeVisible();
  }

  async expectTotalTaskTime(expected: string) {
    await expect(this.dialog.getByText(`合計${expected}`)).toBeVisible();
  }

  // 「更新」ボタンが表示されていることを確認する（既存 Todo 編集時）
  async expectUpdateButtonVisible() {
    await expect(this.dialog.getByRole('button', { name: '更新' })).toBeVisible();
  }

  // タスク名フィールドに入力する（既存値をクリアしてから入力）
  async fillContent(text: string) {
    await this.dialog.locator('#content').click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.type(text);
  }

  // 見積フィールドに入力する（"HH:mm" 形式）
  async fillEstimated(value: string) {
    const [hours, minutes] = value.split(':');
    const group = this.dialog.getByRole('group', { name: '見積' });
    await group.getByRole('spinbutton', { name: 'Hours' }).click();
    await this.page.keyboard.type(hours);
    await group.getByRole('spinbutton', { name: 'Minutes' }).click();
    await this.page.keyboard.type(minutes);
    await this.page.keyboard.press('Tab');
  }

  async fillMemo(text: string) {
    await this.dialog.locator('#memo').click();
    await this.page.keyboard.type(text);
  }

  // プロジェクトフィールドに入力する（オートコンプリート候補が出るまで入力）
  async fillProject(text: string) {
    await this.dialog.locator('#project').fill(text);
  }

  // 作業時間エントリの開始/終了時間を入力する（"yyyy-MM-dd HH:mm" 形式、index 省略時は先頭を対象）
  async fillTaskTime(position: 'end' | 'start', value: string, index = 0) {
    const label = position === 'start' ? '開始時間' : '終了時間';
    const [datePart, timePart] = value.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');
    const group = this.dialog.getByRole('group', { name: label }).nth(index);
    await group.getByRole('spinbutton', { name: 'Year' }).click();
    await this.page.keyboard.type(year);
    await group.getByRole('spinbutton', { name: 'Month' }).click();
    await this.page.keyboard.type(month);
    await group.getByRole('spinbutton', { name: 'Day' }).click();
    await this.page.keyboard.type(day);
    await group.getByRole('spinbutton', { name: 'Hours' }).click();
    await this.page.keyboard.type(hours);
    await group.getByRole('spinbutton', { name: 'Minutes' }).click();
    await this.page.keyboard.type(minutes);
    await this.page.keyboard.press('Tab');
  }
}
