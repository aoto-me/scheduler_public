import { expect } from '@playwright/test';
import type { BlockEditor } from '../../components/BlockEditor.js';

interface EditorPage {
  editor: BlockEditor;
}

export const runEditorCommonTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => EditorPage,
  options: {
    afterReload(): Promise<void>;
    initialToCVisible: boolean;
  }
): void => {
  test('目次の表示非表示を切り替えられる', async () => {
    const { editor } = getPage();
    if (options.initialToCVisible) {
      await editor.expectToCVisible();
      await editor.toggleToC();
      await editor.expectToCHidden();
      await editor.toggleToC();
      await editor.expectToCVisible();
    } else {
      await editor.expectToCHidden();
      await editor.toggleToC();
      await editor.expectToCVisible();
      await editor.toggleToC();
      await editor.expectToCHidden();
    }
  });

  test('全幅表示と固定幅表示を切り替えられる', async ({ page }) => {
    const { editor } = getPage();
    await expect(page.getByRole('button', { name: '全幅表示' })).toBeVisible();

    await editor.toggleFullWidth();
    await expect(page.getByRole('button', { name: '固定幅表示' })).toBeVisible();

    await editor.toggleFullWidth();
    await expect(page.getByRole('button', { name: '全幅表示' })).toBeVisible();
  });

  test('markdownでコピーボタンをクリックできる', async () => {
    const { editor } = getPage();
    await editor.clickCopyMarkdown();
  });

  test('エディターに入力と保存ができる（リロード/DB反映を確認）', async ({ page }) => {
    const { editor } = getPage();
    const inputText = 'E2Eテスト用テキスト入力';
    await editor.typeText(inputText);
    await editor.waitForSaved();
    await page.reload();
    await options.afterReload();
    await editor.expectVisible();
    await expect(page.locator('.ProseMirror')).toContainText(inputText);
  });

  test('スラッシュコマンドメニューが表示される', async () => {
    const { editor } = getPage();
    await editor.triggerSlashCommand();
    await editor.expectSlashMenuVisible();
  });

  test('スラッシュコマンドで「見出し1」を挿入できる', async ({ page }) => {
    const { editor } = getPage();
    await editor.triggerSlashCommand();
    await editor.expectSlashMenuVisible();
    await editor.clickSlashMenuItem('見出し1');
    await expect(page.locator('.ProseMirror h1')).toBeVisible();
  });

  test('テキスト選択時にテキストメニューツールバーが表示される', async () => {
    const { editor } = getPage();
    await editor.typeText('テキストメニューテスト');
    await editor.selectText();
    await editor.expectTextMenuVisible();
  });

  test('テキストメニューツールバーで太字を適用できる', async ({ page }) => {
    const { editor } = getPage();
    await editor.typeText('太字テスト');
    await editor.selectText();
    await editor.expectTextMenuVisible();
    await page.getByRole('button', { name: '太字' }).click();
    await expect(page.locator('.ProseMirror strong')).toBeVisible();
  });

  test('スラッシュコマンドで「リスト」を挿入できる', async ({ page }) => {
    const { editor } = getPage();
    await editor.triggerSlashCommand();
    await editor.expectSlashMenuVisible();
    await editor.clickSlashMenuItem('リスト');
    await expect(page.locator('.ProseMirror ul')).toBeVisible();
  });

  test('エディターを空にしてもエラーが起きない', async ({ page }) => {
    const { editor } = getPage();
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await editor.selectAllText();
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);

    const fatalErrors = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(fatalErrors).toHaveLength(0);
  });
};
