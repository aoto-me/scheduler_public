import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BlockEditor } from '../components/BlockEditor.js';
import { DrawerLeft } from '../components/DrawerLeft.js';
import { DrawerMenu } from '../components/DrawerMenu.js';
import { EditableTable } from '../components/EditableTable.js';
import { FileGrid } from '../components/FileGrid.js';
import { FileUploader } from '../components/FileUploader.js';
import { KanbanBoard } from '../components/KanbanBoard.js';
import { PageTitle } from '../components/PageTitle.js';
import { TabPanel } from '../components/TabPanel.js';
import { TodoForm } from '../components/TodoForm.js';
import { WordSearch } from '../components/WordSearch.js';
import { toggleDrawerByShortcut as toggleDrawer } from '../utils/testUtils.js';

export class ProjectPage {
  readonly drawer: DrawerLeft;
  readonly editor: BlockEditor;
  readonly fileGrid: FileGrid;
  readonly fileUploader: FileUploader;
  readonly kanban: KanbanBoard;
  readonly menu: DrawerMenu;
  readonly table: EditableTable;
  readonly tabs: TabPanel;
  readonly title: PageTitle;
  readonly todoForm: TodoForm;
  readonly wordSearch: WordSearch;

  constructor(private readonly page: Page) {
    this.drawer = new DrawerLeft(page);
    this.editor = new BlockEditor(page, '/backend/api/project/content');
    this.fileGrid = new FileGrid(page, '#panel-projectFile');
    this.fileUploader = new FileUploader(page);
    this.kanban = new KanbanBoard(page);
    this.menu = new DrawerMenu(page, 'プロジェクト一覧');
    this.todoForm = new TodoForm(page);
    this.table = new EditableTable(page);
    this.tabs = new TabPanel(page, 'プロジェクトのタブメニュー');
    this.title = new PageTitle(page, '/backend/api/project/title');
    this.wordSearch = new WordSearch(page);
  }

  async expectBreadcrumbsVisible() {
    await this.tabs.expectVisible();
    await expect(this.page.getByRole('navigation', { name: 'パンくずリスト' })).toBeVisible();
  }

  async expectEndDateValue(value: string): Promise<void> {
    const [year, month, day] = value.split('-');
    const group = this.page.getByRole('group', { name: '終了日' });
    await expect(group.getByRole('spinbutton', { name: 'Year' })).toHaveText(year);
    await expect(group.getByRole('spinbutton', { name: 'Month' })).toHaveText(month);
    await expect(group.getByRole('spinbutton', { name: 'Day' })).toHaveText(day);
  }

  async expectEndDateVisible(): Promise<void> {
    await expect(this.page.getByRole('group', { name: '終了日' })).toBeVisible();
  }

  async expectRemainingDays(days: number): Promise<void> {
    await expect(this.page.getByText(`（${String(days)}日後）`)).toBeVisible();
  }

  async goto() {
    await this.page.goto('/project');
  }

  async selectEndDate(value: string): Promise<void> {
    const [year, month, day] = value.split('-');
    const group = this.page.getByRole('group', { name: '終了日' });
    await group.getByRole('spinbutton', { name: 'Year' }).click();
    await this.page.keyboard.type(year, { delay: 100 });
    await group.getByRole('spinbutton', { name: 'Month' }).click();
    await this.page.keyboard.type(month, { delay: 100 });
    await group.getByRole('spinbutton', { name: 'Day' }).click();
    await this.page.keyboard.type(day, { delay: 100 });
    await this.page.keyboard.press('Tab');
  }

  async toggleDrawerByShortcut() {
    await toggleDrawer(this.page);
  }
}
