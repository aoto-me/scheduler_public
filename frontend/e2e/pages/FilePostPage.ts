import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { DrawerLeft } from '../components/DrawerLeft.js';
import { FileGrid } from '../components/FileGrid.js';
import { FileUploader } from '../components/FileUploader.js';
import { toggleDrawerByShortcut as toggleDrawer } from '../utils/testUtils.js';

export class FilePostPage {
  readonly drawer: DrawerLeft;
  readonly fileGrid: FileGrid;
  readonly fileUploader: FileUploader;
  private readonly directoryTree;

  constructor(private readonly page: Page) {
    this.drawer = new DrawerLeft(page);
    this.fileGrid = new FileGrid(page, 'body');
    this.fileUploader = new FileUploader(page);
    this.directoryTree = page.getByRole('tree', { name: 'フォルダ階層' });
  }

  async blurFolderNameField() {
    await this.page.getByRole('textbox').blur();
  }

  async clickAccordionTreeItem(name: string) {
    const item = this.getTreeItem(name).first();
    await item.locator(':scope > .MuiTreeItem-content').click();
    await this.page.waitForTimeout(500);
  }

  async clickAddFolderButton() {
    await this.page.getByRole('button', { name: '新規フォルダの追加' }).click();
  }

  async clickDeleteFolder() {
    await this.page.getByRole('button', { name: 'フォルダを削除' }).click();
  }

  async clickEditFolderName() {
    await this.page.getByRole('button', { name: 'フォルダ名を変更' }).click();
  }

  async clickSaveFolderName() {
    await this.page.getByRole('button', { name: 'フォルダ名を保存' }).click();
  }

  async clickSearchButton() {
    await this.page.getByRole('button', { name: '検索' }).click();
  }

  async clickTreeItem(name: string) {
    await this.getTreeItem(name).first().click();
    await this.page.waitForTimeout(500);
  }

  async expectBreadcrumbsVisible() {
    await expect(this.page.getByRole('navigation', { name: 'パンくずリスト' })).toBeVisible();
  }

  async expectDirectoryTreeVisible() {
    await expect(this.directoryTree).toBeVisible();
  }

  async expectErrorMessageVisible(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }

  async expectFileCardsExist() {
    const grid = this.page.locator('.MuiGrid-root').first();
    await expect(grid).toBeVisible();
    await expect(grid.locator('button').first()).toBeVisible();
  }

  async expectFileGridVisible() {
    await expect(this.page.locator('.MuiGrid-root').first()).toBeVisible();
  }

  async expectFolderActionsHidden() {
    await expect(this.page.getByRole('button', { name: 'フォルダ名を変更' })).not.toBeVisible();
    await expect(this.page.getByRole('button', { name: 'フォルダを削除' })).not.toBeVisible();
  }

  async expectFolderNameHelperText(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectFolderNameVisible(name: string) {
    await expect(this.page.getByRole('heading', { level: 1, name })).toBeVisible();
  }

  async expectInitialMessageVisible() {
    await expect(this.page.getByText('検索ワードを入力してください')).toBeVisible();
  }

  async expectNewFolderVisible() {
    await expect(this.directoryTree.getByRole('treeitem', { name: '新規フォルダ' }).first()).toBeVisible();
  }

  async expectNoResultMessageVisible() {
    await expect(this.page.getByText('該当するファイルは見つかりませんでした')).toBeVisible();
  }

  async expectSearchButtonVisible() {
    await expect(this.page.getByRole('button', { name: '検索' })).toBeVisible();
  }

  async expectSearchFieldVisible() {
    await expect(this.page.getByPlaceholder('ファイル検索')).toBeVisible();
  }

  async expectSearchResultHeaderVisible(word: string) {
    await expect(this.page.getByText(`検索ワード：${word}`)).toBeVisible();
  }

  async expectTreeItemCollapsed(name: string) {
    await expect(this.getTreeItem(name).first()).toHaveAttribute('aria-expanded', 'false');
  }

  async expectTreeItemExpanded(name: string) {
    await expect(this.getTreeItem(name).first()).toHaveAttribute('aria-expanded', 'true');
  }

  async expectTreeItemVisible(name: string) {
    await expect(this.getTreeItem(name)).toBeVisible();
  }

  async fillFolderNameField(value: string) {
    const field = this.page.getByRole('textbox');
    await field.clear();
    await field.fill(value);
  }

  async fillSearchField(word: string) {
    await this.page.getByPlaceholder('ファイル検索').fill(word);
  }

  getTreeItem(name: string) {
    return this.directoryTree.getByRole('treeitem', { name });
  }

  async goto() {
    await this.page.goto('/file');
  }

  async pressSaveFolderName() {
    await this.page.getByRole('textbox').press('Enter');
  }

  async searchFiles(word: string) {
    await this.fillSearchField(word);
    await this.clickSearchButton();
  }

  async toggleDrawerByShortcut() {
    await toggleDrawer(this.page);
  }
}
