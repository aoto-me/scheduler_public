import { expect, Page } from '@playwright/test';
import type { EditableTable } from '../../components/EditableTable.js';
import type { TabPanel } from '../../components/TabPanel.js';

interface TablePage {
  table: EditableTable;
  tabs: TabPanel;
}

interface TableTestOptions {
  apiPath: string;
  xlsxPath: string;
}

// 行データのデバウンスPATCHが完了するまで待つ
const waitForPatch = async (page: Page, apiPath: string) => {
  await page.waitForResponse(resp => resp.url().includes(apiPath) && resp.request().method() === 'PATCH', {
    timeout: 5000,
  });
  // 複数のPATCHが飛ぶ可能性があるため2回目も待つ（ない場合はcatchで無視）
  await page
    .waitForResponse(resp => resp.url().includes(apiPath) && resp.request().method() === 'PATCH', { timeout: 5000 })
    .catch(() => {
      // ない場合無視
    });
};

export const runTableEmptyTests = (test: typeof import('@playwright/test').test, getPage: () => TablePage): void => {
  test.beforeEach(async () => {
    const { tabs } = getPage();
    await tabs.clickTab('テーブル');
    await tabs.expectTabActive('テーブル');
  });

  test('「テーブルを追加」ボタンが表示される', async () => {
    const { table } = getPage();
    await table.createTableButtonVisible();
  });

  test('「テーブルを追加」ボタンでテーブルを追加できる（リロード/DB反映を確認）', async ({ page }) => {
    const { table, tabs } = getPage();
    await table.createTable();
    await page.reload();
    await tabs.expectVisible();
    await tabs.clickTab('テーブル');
    await table.expectVisible();
  });
};

export const runTableOperationTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => TablePage,
  options: TableTestOptions
): void => {
  test.beforeEach(async () => {
    const { table, tabs } = getPage();
    await tabs.clickTab('テーブル');
    await tabs.expectTabActive('テーブル');
    await table.expectVisible();
  });

  test('「行の追加」をクリックで行が追加できる', async ({ page }) => {
    const { table } = getPage();
    await table.addRow();
    await waitForPatch(page, options.apiPath);
  });

  test('「列の追加」をクリックでフォームが表示される', async () => {
    const { table } = getPage();
    await table.openColumnForm();
  });

  test('バリデーション：「列の追加」フォームでIDが空でエラーが出る', async () => {
    const { table } = getPage();
    await table.addColumn({
      columnId: '',
      columnName: 'テスト列',
    });
    await table.expectColumnFormError('IDを入力してください');
  });

  test('バリデーション：「列の追加」フォームでカラム名が空でエラーが出る', async () => {
    const { table } = getPage();
    await table.addColumn({
      columnId: 'testCol',
      columnName: '',
    });
    await table.expectColumnFormError('カラム名を入力してください');
  });

  test('バリデーション：「列の追加」フォームでIDに半角英数字以外の利用でエラーが出る', async () => {
    const { table } = getPage();
    await table.openColumnForm();
    await table.fillColumnId('テスト');
    await table.expectColumnFormError('IDには半角英数字のみ使用できます');
  });

  test('列を追加できる（保存ボタンでカラムが追加される）', async ({ page }) => {
    const { table, tabs } = getPage();
    // 初回レンダリング時のPATCHの完了を待ち受けてから送信する
    const patchPromise = page.waitForResponse(
      resp => resp.url().includes(options.apiPath) && resp.request().method() === 'PATCH'
    );
    await table.addColumn({
      columnId: 'e2eTestCol',
      columnName: 'E2Eテスト列',
    });
    await expect(page.locator('.ag-header-cell').filter({ hasText: 'E2Eテスト列' })).toBeVisible();
    await patchPromise;
    await waitForPatch(page, options.apiPath);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await tabs.expectVisible();
    await tabs.clickTab('テーブル');
    await expect(page.locator('.ag-header-cell').filter({ hasText: 'E2Eテスト列' })).toBeVisible();
  });

  test('行のチェックボックスをクリックすると選択状態になる', async ({ page }) => {
    const { table } = getPage();
    await table.addRow();
    await table.clickFirstRowCheckbox();
    // 選択状態は aria-selected="true" の row で確認する
    await expect(page.getByRole('row', { selected: true }).first()).toBeVisible();
  });

  test('行の削除ができる', async ({ page }) => {
    const { table } = getPage();
    await table.addRow();
    const rowsBefore = await page.locator('.ag-row').count();
    await table.clickFirstRowCheckbox();
    page.once('dialog', dialog => dialog.accept());
    await table.clickDeleteRow();
    // 1行削除すると.ag-rowの数は1減る（ag-grid v36以降、1データ行 = .ag-row1個）
    await expect(page.locator('.ag-row')).toHaveCount(rowsBefore - 1);
  });

  test('検索フォームで絞り込みができる', async ({ page }) => {
    const { table } = getPage();
    await table.addRow();
    await table.fillSearchFilter('存在しないワードXYZ12345');
    await expect(page.getByText('No Matching Rows')).toBeVisible();
    await table.fillSearchFilter('');
  });

  test('全幅表示と固定幅表示を切り替えられる', async ({ page }) => {
    const { table } = getPage();
    // 全幅に切り替える → メニューラベルが「固定幅表示」に変わることで状態を確認
    await table.selectTableMenuItem('全幅表示');
    await table.openTableMenu();
    await expect(page.getByRole('menuitem', { name: '固定幅表示' })).toBeVisible();
    // 固定幅に戻す → メニューラベルが「全幅表示」に変わることで状態を確認
    await table.clickTableMenuItem('固定幅表示');
    await table.openTableMenu();
    await expect(page.getByRole('menuitem', { name: '全幅表示' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('固定高さ表示と全行表示を切り替えられる', async ({ page }) => {
    const { table } = getPage();
    // ag-grid v36以降、.ag-root-wrapperの親はテーマ用のラッパー（ag-styled-root）になり
    // 高さは.ag-root-wrapper自身に設定されるため、そちらを直接見る
    const gridContainer = page.locator('.ag-root-wrapper');
    await table.selectTableMenuItem('固定高さ表示');
    await expect(gridContainer).toHaveCSS('height', '500px');
    // 全行表示に戻す
    await table.selectTableMenuItem('全行表示');
  });

  test('CSVをエクスポートできる', async ({ page }) => {
    const { table } = getPage();
    const downloadPromise = page.waitForEvent('download');
    await table.selectTableMenuItem('CSVをエクスポート');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test('Excelをインポートできる（行・列が追加される）', async ({ page }) => {
    const { table } = getPage();
    const rowsBefore = await page.locator('.ag-row').count();
    await table.importExcel(options.xlsxPath);
    // インポート後に行が増えることを確認（ag-grid v36以降、1データ行 = .ag-row1個）
    // Excelの2データ行 = +2 .ag-row
    await expect(page.locator('.ag-row')).toHaveCount(rowsBefore + 2);
  });

  test('Excelインポート後に Undo ボタンが有効になる', async ({ page }) => {
    const { table } = getPage();
    await table.importExcel(options.xlsxPath);
    await expect(page.locator('.ag-row').first()).toBeVisible();
    // テーブルメニューを開いてUndoボタンが有効なことを確認
    await table.openTableMenu();
    const undoItem = page.getByRole('menuitem').filter({ hasText: 'の状態に戻す' });
    await expect(undoItem).not.toHaveAttribute('aria-disabled', 'true');
    // Undoを実行して閉じる
    await table.clickTableMenuItem('Excelインポート前の状態に戻す');
  });

  test('列を追加してからカラム削除後に Undo ボタンが有効になる', async ({ page }) => {
    const { table } = getPage();
    // テスト用列を追加
    await table.addColumn({
      columnId: 'e2eUndoTestCol',
      columnName: 'Undoテスト列',
    });
    await expect(page.locator('.ag-header-cell').filter({ hasText: 'Undoテスト列' })).toBeVisible();
    await table.openColumnEditMenu('Undoテスト列');
    await table.expectColumnFormVisible();
    await table.clickDeleteColumnInModal();
    await expect(page.locator('.ag-header-cell').filter({ hasText: 'Undoテスト列' })).not.toBeVisible();
    // テーブルメニューを開いてUndoボタンが有効なことを確認
    await table.openTableMenu();
    const undoItem = page.getByRole('menuitem').filter({ hasText: 'の状態に戻す' });
    await expect(undoItem).not.toHaveAttribute('aria-disabled', 'true');
    await table.clickTableMenuItem('カラム削除前の状態に戻す');
    // 列が復元されることを確認
    await expect(page.locator('.ag-header-cell').filter({ hasText: 'Undoテスト列' })).toBeVisible();
  });

  test('テーブルを削除できる', async ({ page }) => {
    const { table } = getPage();
    page.once('dialog', dialog => dialog.accept());
    await table.selectTableMenuItem('テーブルを削除');
    await table.createTableButtonVisible();
  });
};
