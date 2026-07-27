import { expect, Locator, type Page } from '@playwright/test';

export class DrawerMenu {
  private readonly addFolderButton;
  private readonly addPageButton;
  private readonly filterInput;
  private readonly folders;
  private readonly nav;
  private readonly pageLinks;

  constructor(
    private readonly page: Page,
    navName: string
  ) {
    this.nav = page.getByRole('navigation', { name: navName });
    this.addFolderButton = page.getByRole('button', { name: '新規フォルダの追加' });
    this.folders = this.nav.locator('div[data-folder-id]:not([data-folder-id="noCategory"])');
    const pageLabel = navName.replace('一覧', '');
    this.addPageButton = page.getByRole('button', { name: `新規${pageLabel}の追加` });
    this.pageLinks = this.nav.locator('[data-parent="noCategory"] a[href]');
    this.filterInput = page.getByLabel(`${pageLabel}の絞り込み`);
  }

  // フォルダを追加し、Locatorを返す
  async addFolder(): Promise<Locator> {
    const countBefore = await this.getFolderCount();
    await this.addFolderButton.click();
    await this.expectFolderCount(countBefore + 1);
    return this.folders.last();
  }

  async addPage(): Promise<Locator> {
    // 追加前の全ページの href を記録しておく
    const beforeHrefs = await this.getPageHrefs();
    const countBefore = await this.getPageCount();

    await this.addPageButton.click();
    await this.expectPageCount(countBefore + 1);

    // beforeHrefsに含まれないhrefを持つリンクを新規ページとして返す
    for (const link of await this.pageLinks.all()) {
      const href = await link.getAttribute('href');

      if (href && !beforeHrefs.includes(href)) {
        return this.nav.locator(`a[href="${href}"]`);
      }
    }

    // 新規hrefを特定できなかった場合のフォールバック
    return this.pageLinks.last();
  }

  async clearSearch(): Promise<void> {
    await this.filterInput.clear();
    await this.waitUiUpdate();
  }

  async closeFolder(folder: Locator): Promise<void> {
    await this.toggleFolder(folder, false);
  }

  async deleteFolder(folder: Locator): Promise<void> {
    await this.openFolderMenu(folder);
    await this.page.locator('#folderMenu-delete').click();
  }

  async deletePage(link: Locator): Promise<void> {
    const href = await link.getAttribute('href');

    if (!href) {
      throw new Error('ページリンクに href がありません');
    }

    const item = this.nav.locator('.draggableMenuItemWrapper').filter({
      has: this.page.locator(`a[href="${href}"]`),
    });

    this.page.once('dialog', dialog => void dialog.accept());

    await item.hover();
    await item.locator('span[role="button"]').click({ force: true });

    await expect(item).not.toBeVisible();
  }

  // Diaryリンクが表示されているか（galleryページのみ）
  async expectDiaryLinkVisible(): Promise<void> {
    await expect(this.nav.getByRole('link', { name: 'Diary' })).toBeVisible();
  }

  async expectFolderCount(count: number): Promise<void> {
    await expect(this.folders).toHaveCount(count);
  }

  async expectPageCount(count: number): Promise<void> {
    await expect(this.pageLinks).toHaveCount(count);
  }

  async expectVisible(): Promise<void> {
    await expect(this.nav).toBeVisible();
  }

  // フォルダ名でフォルダコンテナを取得する（同名が複数ある場合は最初の1件）
  getFolderByName(name: string): Locator {
    return this.folders.filter({ hasText: name }).first();
  }

  async getFolderCount(): Promise<number> {
    return this.folders.count();
  }

  async getItemsInFolder(folder: Locator): Promise<Locator> {
    const folderId = await folder.getAttribute('data-folder-id');
    return this.nav.locator(`[data-parent="${String(folderId)}"] a[href]`);
  }

  async getPageCount(): Promise<number> {
    return this.pageLinks.count();
  }

  async openFolder(folder: Locator): Promise<void> {
    await this.toggleFolder(folder, true);
  }

  async renameFolder(folder: Locator, newName: string): Promise<void> {
    const input = await this.getFolderEditInput(folder);
    await input.fill(newName);
    await input.press('Enter');
  }

  // 無効な名前を入力してエラーを確認し、Tabでキャンセルする
  async renameFolderCancelWithError(folder: Locator, name: string, errorMessage: string): Promise<void> {
    const input = await this.getFolderEditInput(folder);
    await input.fill(name);
    await expect(folder).toContainText(errorMessage);
    await input.press('Tab'); // blur → isError=true なので元の名前に戻る
    await expect(input).not.toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.filterInput.fill(query);
    await this.waitUiUpdate();
  }

  private async getFolderEditInput(folder: Locator): Promise<Locator> {
    await this.openFolderMenu(folder);
    await this.page.locator('#folderMenu-edit').click();
    return folder.getByRole('textbox');
  }

  private async getPageHrefs(): Promise<string[]> {
    const hrefs: string[] = [];

    for (const link of await this.pageLinks.all()) {
      const href = await link.getAttribute('href');

      if (href) {
        hrefs.push(href);
      }
    }

    return hrefs;
  }

  private async openFolderMenu(folder: Locator): Promise<void> {
    await folder.getByLabel('フォルダの編集メニュー').click();
  }

  private async toggleFolder(folder: Locator, open: boolean): Promise<void> {
    const summary = folder.locator('.draggableMenuContainerHeader').first();
    const ariaExpanded = await summary.getAttribute('aria-expanded');

    if (ariaExpanded !== String(open)) {
      await summary.click();
      await expect(summary).toHaveAttribute('aria-expanded', String(open));
    }

    await this.waitUiUpdate();
  }

  private async waitUiUpdate(): Promise<void> {
    await this.page.waitForTimeout(500);
  }
}
