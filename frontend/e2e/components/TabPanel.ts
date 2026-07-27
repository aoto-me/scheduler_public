import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class TabPanel {
  private readonly tabList;

  constructor(page: Page, ariaLabel: string) {
    this.tabList = page.getByRole('tablist', { name: ariaLabel });
  }

  async clickTab(label: string) {
    await this.tabList.getByRole('tab', { name: label }).click();
  }

  async expectTabActive(label: string) {
    await expect(this.tabList.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
  }

  // タブリスト自体が表示されていることを確認する（ページのロード完了の判定にも利用）
  async expectVisible() {
    await expect(this.tabList).toBeVisible();
  }

  // アクティブなタブにフォーカスを当て、ArrowLeft キーを押して前のタブへ移動する
  async pressArrowLeftOnActiveTab() {
    const activeTab = this.tabList.locator('[role="tab"][aria-selected="true"]');
    await activeTab.focus();
    await activeTab.press('ArrowLeft');
  }

  // アクティブなタブにフォーカスを当て、ArrowRight キーを押して次のタブへ移動する
  async pressArrowRightOnActiveTab() {
    const activeTab = this.tabList.locator('[role="tab"][aria-selected="true"]');
    await activeTab.focus();
    await activeTab.press('ArrowRight');
  }
}
