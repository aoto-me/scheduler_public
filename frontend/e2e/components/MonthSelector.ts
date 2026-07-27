import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class MonthSelector {
  constructor(private readonly page: Page) {}

  async clickNextMonth() {
    await this.page.getByRole('button', { name: '次の月' }).click();
  }

  async clickPrevMonth() {
    await this.page.getByRole('button', { name: '前の月' }).click();
  }

  async expectVisible() {
    await expect(this.page.getByRole('group', { name: '月選択' })).toBeVisible();
  }

  async getMonthText() {
    return this.page.locator('.MuiPickersSectionList-root').first().textContent();
  }

  // MonthSelector の DatePicker カレンダーアイコンボタンをクリック
  async openMonthPanel() {
    // グループ内のボタンは前月・カレンダー・次月の順
    const group = this.page.getByRole('group', { name: '月選択' });
    await group.getByRole('button').nth(1).click();
  }

  async selectYearMonth(year: number, month: number) {
    await this.openMonthPanel();
    // views=['year', 'month'] では年は role="radio" として描画される
    await this.page.getByRole('radio', { name: String(year) }).click();
    // 年選択後は月ビューに切り替わる。月も role="radio"
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    await this.page.getByRole('radio', { exact: true, name: monthNames[month - 1] }).click();
  }
}
