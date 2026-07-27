import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BlockEditor } from '../components/BlockEditor.js';
import { DrawerLeft } from '../components/DrawerLeft.js';
import { DrawerMenu } from '../components/DrawerMenu.js';
import { EditableTable } from '../components/EditableTable.js';
import { FileGrid } from '../components/FileGrid.js';
import { FileUploader } from '../components/FileUploader.js';
import { PageTitle } from '../components/PageTitle.js';
import { TabPanel } from '../components/TabPanel.js';
import { WordSearch } from '../components/WordSearch.js';
import { toggleDrawerByShortcut as toggleDrawer } from '../utils/testUtils.js';

export class MemoPage {
  readonly drawer: DrawerLeft;
  readonly editor: BlockEditor;
  readonly fileGrid: FileGrid;
  readonly fileUploader: FileUploader;
  readonly menu: DrawerMenu;
  readonly table: EditableTable;
  readonly tabs: TabPanel;
  readonly title: PageTitle;
  readonly wordSearch: WordSearch;

  constructor(readonly page: Page) {
    this.drawer = new DrawerLeft(page);
    this.editor = new BlockEditor(page, '/backend/api/memo/content');
    this.fileGrid = new FileGrid(page, '#panel-memoFile');
    this.fileUploader = new FileUploader(page);
    this.menu = new DrawerMenu(page, 'メモ一覧');
    this.table = new EditableTable(page);
    this.tabs = new TabPanel(page, 'メモのタブメニュー');
    this.title = new PageTitle(page, '/backend/api/memo/title');
    this.wordSearch = new WordSearch(page);
  }

  async expectBreadcrumbsVisible() {
    await this.tabs.expectVisible();
    await expect(this.page.getByRole('navigation', { name: 'パンくずリスト' })).toBeVisible();
  }

  async goto() {
    await this.page.goto('/memo');
  }

  async toggleDrawerByShortcut() {
    await toggleDrawer(this.page);
  }
}
