import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class BlockEditor {
  private readonly editor;

  constructor(
    private readonly page: Page,
    private readonly apiPath: string
  ) {
    this.editor = page.locator('.ProseMirror');
  }

  async clickCopyMarkdown() {
    await this.page.getByRole('button', { name: 'markdownでコピー' }).click();
  }

  async clickSlashMenuItem(label: string) {
    await this.page.locator('[role="menu"] button').filter({ hasText: label }).first().click();
  }

  async expectSlashMenuVisible() {
    await expect(this.page.getByRole('menu').first()).toBeVisible();
  }

  // テキスト選択時に表示されるバブルメニューツールバーが表示されていることを確認する
  async expectTextMenuVisible() {
    await expect(this.page.getByRole('button', { name: '太字' })).toBeVisible();
  }

  async expectToCHidden() {
    await expect(this.page.getByRole('button', { name: '目次を表示' })).toBeVisible();
  }

  async expectToCVisible() {
    await expect(this.page.getByRole('button', { name: '目次を非表示' })).toBeVisible();
  }

  async expectVisible() {
    await expect(this.editor).toBeVisible();
  }

  // エディター内のテキストを全選択する（Ctrl+A → AllSelection → BubbleMenuは非表示）
  async selectAllText() {
    await this.editor.click();
    await this.page.keyboard.press('Control+a');
  }

  // トリプルクリックで段落全体を選択する（TextSelection + mouseup → BubbleMenu が表示される）
  async selectText() {
    await this.editor.click({ clickCount: 3 });
  }

  async toggleFullWidth() {
    const fullWidthBtn = this.page.getByRole('button', { name: '全幅表示' });
    await (
      (await fullWidthBtn.isVisible()) ? fullWidthBtn : this.page.getByRole('button', { name: '固定幅表示' })
    ).click();
    await this.page.waitForTimeout(500);
  }

  async toggleToC() {
    const showBtn = this.page.getByRole('button', { name: '目次を表示' });
    await ((await showBtn.isVisible()) ? showBtn : this.page.getByRole('button', { name: '目次を非表示' })).click();
    await this.page.waitForTimeout(500);
  }

  // スラッシュコマンドを起動する（行末で Enter → / を入力）
  async triggerSlashCommand() {
    await this.editor.click();
    await this.page.keyboard.press('End');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.type('/');
  }

  async typeText(text: string) {
    await this.editor.click();
    await this.page.keyboard.press('End');
    await this.page.keyboard.type(text);
  }

  async waitForSaved() {
    await this.page.waitForResponse(resp => resp.url().includes(this.apiPath) && resp.request().method() === 'PATCH');
  }
}
