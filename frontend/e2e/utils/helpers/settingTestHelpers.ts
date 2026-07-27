import { expect, test } from '@playwright/test';
import type { DataTableSection } from '../../pages/SettingPage.js';
import { uniqueContent } from '../testUtils.js';

interface CommonTestOptions {
  defaultRow: Record<string, string>;
  nameField?: string;
  uniquePrefix: string;
}

const deleteRow = async (settingPage: DataTableSection, name: string) => {
  await settingPage.deleteRow(name);
  await expect(settingPage.row(name)).not.toBeVisible();
};

export const runDataTableCommonTests = (getPage: () => DataTableSection, options: CommonTestOptions): void => {
  const { defaultRow, nameField = 'name', uniquePrefix } = options;

  const createRow = async (settingPage: DataTableSection, name: string) => {
    await settingPage.addRow({ ...defaultRow, [nameField]: name });
    await expect(settingPage.row(name)).toBeVisible();
  };

  test('新規データを追加できる', async () => {
    // execute
    const name = uniqueContent(uniquePrefix);
    const settingPage = getPage();
    await createRow(settingPage, name);
    // cleanup
    await deleteRow(settingPage, name);
  });

  test('データを更新できる', async () => {
    // setup
    const name = uniqueContent(uniquePrefix);
    const updated = name + '-updated';
    const settingPage = getPage();
    await createRow(settingPage, name);
    // execute
    await settingPage.updateRow(name, { [nameField]: updated });
    await expect(settingPage.row(updated)).toBeVisible();
    // cleanup
    await deleteRow(settingPage, name);
  });

  test('新規追加をキャンセルできる', async () => {
    const settingPage = getPage();
    await settingPage.clickAddButton();
    await settingPage.clickCancelButton();
    await expect(settingPage.editInput).not.toBeVisible();
  });

  test('既存データの編集をキャンセルできる', async () => {
    // setup
    const name = uniqueContent(uniquePrefix);
    const settingPage = getPage();
    await createRow(settingPage, name);
    // execute
    await settingPage.cancelEdit(name, { [nameField]: '変更されない名前' });
    await expect(settingPage.row(name)).toBeVisible();
    // cleanup
    await deleteRow(settingPage, name);
  });

  test('削除確認ダイアログをキャンセルすると行が残る', async () => {
    // setup
    const name = uniqueContent(uniquePrefix);
    const settingPage = getPage();
    await createRow(settingPage, name);
    // execute
    await settingPage.cancelDelete(name);
    await expect(settingPage.row(name)).toBeVisible();
    // cleanup
    await deleteRow(settingPage, name);
  });

  test('データを削除できる', async () => {
    // setup
    const name = uniqueContent(uniquePrefix);
    const settingPage = getPage();
    await createRow(settingPage, name);
    // execute
    await deleteRow(settingPage, name);
  });

  test('リロード後も変更が保持される', async ({ page }) => {
    // setup
    const name = uniqueContent(uniquePrefix);
    const updated = name + '-updated';
    const settingPage = getPage();
    await createRow(settingPage, name);
    // execute
    await settingPage.updateRow(name, { [nameField]: updated });
    await expect(settingPage.row(updated)).toBeVisible();
    await page.reload();
    await settingPage.expectLoaded();
    await expect(settingPage.row(updated)).toBeVisible();
    // cleanup
    await deleteRow(settingPage, updated);
  });

  test('検索フォームで絞り込みができる', async ({ page }) => {
    // setup
    const name = uniqueContent(uniquePrefix);
    const settingPage = getPage();
    await createRow(settingPage, name);
    // execute
    await settingPage.search(name);
    await expect(settingPage.row(name)).toBeVisible();
    await settingPage.search('存在しないデータ');
    await expect(page.getByText('結果がありません。')).toBeVisible();
    await settingPage.clearSearch();
    // cleanup
    await deleteRow(settingPage, name);
  });

  test('CSVダウンロードができる', async () => {
    const settingPage = getPage();
    const download = await settingPage.downloadCsv();
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
};
