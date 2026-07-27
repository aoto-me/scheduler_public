import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { FoodForm } from '../components/FoodForm.js';
import { HealthForm } from '../components/HealthForm.js';
import { MoneyForm } from '../components/MoneyForm.js';
import { TodoCard } from '../components/TodoCard.js';
import { TodoForm } from '../components/TodoForm.js';

export class HomePage {
  readonly foodForm: FoodForm;
  readonly healthForm: HealthForm;
  readonly moneyForm: MoneyForm;
  readonly todoForm: TodoForm;

  constructor(private readonly page: Page) {
    this.foodForm = new FoodForm(page);
    this.healthForm = new HealthForm(page);
    this.moneyForm = new MoneyForm(page);
    this.todoForm = new TodoForm(page);
  }

  async clearMonthlyMemoTextField() {
    await this.page.locator('#monthlyMemo').click({ clickCount: 3 });
    await this.page.keyboard.press('Backspace');
  }

  async clickAddFoodButton() {
    await this.page.getByRole('button', { name: '食事記録を追加' }).click();
  }

  async clickAddMemoButton() {
    await this.page.getByRole('button', { name: 'メモを追加' }).click();
  }

  async clickAddMoneyButton() {
    await this.page.getByRole('button', { name: '収支を追加' }).click();
  }

  async clickAddTodoButton() {
    await this.page.getByRole('button', { name: 'ToDoを追加' }).click();
  }

  // カレンダー上の日付セルをクリックする(dayNumberは1～31)
  async clickDate(dayNumber: number) {
    const titleText = (await this.getCalendarTitleText()) ?? '';
    // 2026年3月 → 2026-03 に変換
    const match = /(\d{4})年(\d{1,2})月/.exec(titleText);
    if (!match) throw new Error(`カレンダータイトルのパースに失敗: ${titleText}`);
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    // セル左上(y=5)をクリックして日付数字エリアクリックする
    // ⇒ セル中央をクリックするとイベント要素に当たりeventClickハンドラが起動してモーダルが開くため
    await this.page.locator(`.fc-daygrid-day[data-date="${dateStr}"]`).click({ position: { x: 10, y: 5 } });
  }

  async clickEditDiaryButton() {
    await this.page.getByRole('button', { name: '日記を編集' }).click();
  }

  async clickFilterButton(type: 'diary' | 'health' | 'money' | 'todo') {
    await this.page.locator(`.fc-filter-buttons .fc-${type}Button-button`).click();
  }

  async clickFoodCard(name: string) {
    await this.page
      .locator('[data-testid="food-card"]')
      .filter({ hasText: new RegExp(String.raw`^${name}\s`) })
      .locator('button')
      .click();
  }

  async clickMoneyCard(content: string) {
    await this.page.locator('[data-testid="money-card"]').filter({ hasText: content }).locator('button').click();
  }

  async clickNextMonth() {
    await this.page.locator('.fc-next-button').click();
  }

  async clickPrevMonth() {
    await this.page.locator('.fc-prev-button').click();
  }

  async clickRecordHealthButton() {
    await this.page.getByRole('button', { name: '体調を記録' }).click();
  }

  async clickTodayButton() {
    await this.page.locator('.fc-today-button').click();
  }

  async clickUpdateHealthButton() {
    await this.page.getByRole('button', { name: '体調を更新' }).click();
  }

  async clickWriteDiaryButton() {
    await this.page.getByRole('button', { name: '日記を書く' }).click();
  }

  async expectAddMemoButtonNotVisible() {
    await expect(this.page.getByRole('button', { name: 'メモを追加' })).not.toBeVisible();
  }

  async expectAddMemoButtonVisible() {
    await expect(this.page.getByRole('button', { name: 'メモを追加' })).toBeVisible();
  }

  async expectCalendarEventVisible(dateStr: string) {
    await expect(
      this.page.locator(`.fc-daygrid-day[data-date="${dateStr}"] .fc-daygrid-event-harness`).first()
    ).toBeVisible();
  }

  async expectCalendarVisible() {
    await expect(this.page.locator('.fc-daygrid-body')).toBeVisible({ timeout: 30_000 });
  }

  // DrawerRight の選択日見出しが指定テキストを含むまで待機してチェック
  async expectDiaryTitleVisible(title: string) {
    await expect(this.page.getByRole('heading', { level: 3, name: title })).toBeVisible();
  }

  async expectDrawerRightDateContains(text: string) {
    await expect(this.page.getByRole('heading', { name: '選択日' })).toContainText(text);
  }

  async expectFilterButtonActive(type: 'diary' | 'health' | 'money' | 'todo') {
    await expect(this.page.locator(`.fc-filter-buttons .fc-${type}Button-button`)).toHaveClass(/fc-button-active/);
  }

  async expectFilterButtonsVisible() {
    await expect(this.page.locator('.fc-filter-buttons')).toBeVisible();
  }

  async expectFoodCardNotVisible(name: string) {
    await expect(
      this.page.locator('[data-testid="food-card"]').filter({ hasText: new RegExp(String.raw`^${name}\s`) })
    ).not.toBeVisible();
  }

  async expectFoodCardVisible(name: string) {
    await expect(
      this.page.locator('[data-testid="food-card"]').filter({ hasText: new RegExp(String.raw`^${name}\s`) })
    ).toBeVisible();
  }

  async expectMoneyCardNotVisible(content: string) {
    await expect(this.page.locator('[data-testid="money-card"]').filter({ hasText: content })).not.toBeVisible();
  }

  async expectMoneyCardVisible(content: string) {
    await expect(this.page.locator('[data-testid="money-card"]').filter({ hasText: content })).toBeVisible();
  }

  async expectMonthlyMemoAreaVisible() {
    // カレンダーが表示されるまで待ってからチェック
    await this.expectCalendarVisible();
    // TextField か メモを追加ボタンのどちらかが表示されるか
    await expect(
      this.page
        .locator('#monthlyMemo')
        .or(this.page.getByRole('button', { name: 'メモを追加' }))
        .first()
    ).toBeVisible();
  }

  async expectMonthlyMemoTextFieldVisible() {
    await expect(this.page.locator('#monthlyMemo')).toBeVisible();
  }

  async expectNoHealthRecord() {
    await expect(this.page.getByText('記録がありません')).toBeVisible();
  }

  async expectPieChartLegendContains(type: string) {
    await expect(this.page.getByTestId('daily-pie-chart').locator('ul li').filter({ hasText: type })).toBeVisible();
  }

  async expectTodayButtonDisabled() {
    await expect(this.page.locator('.fc-today-button')).toBeDisabled();
  }

  async expectTodayButtonEnabled() {
    await expect(this.page.locator('.fc-today-button')).not.toBeDisabled();
  }

  async getCalendarDateStr(dayNumber: number): Promise<string> {
    const titleText = (await this.getCalendarTitleText()) ?? '';
    const match = /(\d{4})年(\d{1,2})月/.exec(titleText);
    if (!match) throw new Error(`カレンダータイトルのパースに失敗: ${titleText}`);
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getCalendarTitleText() {
    return this.page.locator('.fc-toolbar-title').textContent();
  }

  getTodoCard(title: string): TodoCard {
    return new TodoCard(this.page.locator('[data-testid="todo-card"]').filter({ hasText: title }));
  }

  async goto() {
    await this.page.goto('/');
  }

  async selectCurrentDay(day: number) {
    await this.clickDate(day);
    await this.expectDrawerRightDateContains(`${String(day)}日`);
  }
}
