import { expect } from '@playwright/test';
import type { DrawerLeft } from '../../components/DrawerLeft.js';
import type { DrawerMenu } from '../../components/DrawerMenu.js';
import { uniqueContent } from '../testUtils.js';

interface DrawerPage {
  drawer: DrawerLeft;
  toggleDrawerByShortcut(): Promise<void>;
}

interface MenuPage {
  goto(): Promise<void>;
  menu: DrawerMenu;
}

export const runDrawerCommonTests = (test: typeof import('@playwright/test').test, getPage: () => DrawerPage): void => {
  test('ボタンクリックでドロワーを開閉できる', async () => {
    const currentPage = getPage();

    await currentPage.drawer.close();
    await currentPage.drawer.open();
  });

  test('Alt+b でドロワーを開閉できる', async () => {
    const currentPage = getPage();

    await currentPage.drawer.expectOpened();

    await currentPage.toggleDrawerByShortcut();
    await currentPage.drawer.expectClosed();

    await currentPage.toggleDrawerByShortcut();
    await currentPage.drawer.expectOpened();
  });
};

export const runMenuCommonTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => MenuPage,
  options: {
    detailUrlPattern: RegExp;
    expectReturnedState?: () => Promise<void>;
    listUrlPattern: RegExp;
    testFolder: string;
  }
): void => {
  test('ナビゲーションが表示されている', async () => {
    const currentPage = getPage();
    await currentPage.menu.expectVisible();
  });

  test('新規フォルダを追加できる（リロード/DB反映を確認）', async ({ page }) => {
    const currentPage = getPage();
    const countBefore = await currentPage.menu.getFolderCount();
    const folder = await currentPage.menu.addFolder();
    await page.reload();
    await currentPage.menu.expectVisible();
    await expect(folder).toBeVisible();
    // cleanup
    await currentPage.menu.deleteFolder(folder);
    await currentPage.menu.expectFolderCount(countBefore);
  });

  test('フォルダ名を変更できる（リロード/DB反映を確認）', async ({ page }) => {
    const currentPage = getPage();
    // setup
    const countBefore = await currentPage.menu.getFolderCount();
    const folder = await currentPage.menu.addFolder();
    // execute
    const newName = uniqueContent('folder');
    await currentPage.menu.renameFolder(folder, newName);
    await expect(folder).toContainText(newName);
    await page.reload();
    await currentPage.menu.expectVisible();
    await expect(folder).toContainText(newName);
    // cleanup
    await currentPage.menu.deleteFolder(folder);
    await currentPage.menu.expectFolderCount(countBefore);
  });

  test('クリックでフォルダを開閉できる', async () => {
    const currentPage = getPage();
    // setup
    const countBefore = await currentPage.menu.getFolderCount();
    const folder = await currentPage.menu.addFolder();
    // execute
    await currentPage.menu.openFolder(folder);
    await currentPage.menu.closeFolder(folder);
    // cleanup
    await currentPage.menu.deleteFolder(folder);
    await currentPage.menu.expectFolderCount(countBefore);
  });

  test('バリデーション：フォルダ名が空文字でエラーが出る', async () => {
    const currentPage = getPage();
    // setup
    const countBefore = await currentPage.menu.getFolderCount();
    const folder = await currentPage.menu.addFolder();
    // execute
    await currentPage.menu.renameFolderCancelWithError(folder, '', 'フォルダ名を入力してください');
    await expect(folder).not.toContainText('フォルダ名を入力してください');
    // cleanup
    await currentPage.menu.deleteFolder(folder);
    await currentPage.menu.expectFolderCount(countBefore);
  });

  test('バリデーション：フォルダ名が100文字超えでエラーが出る', async () => {
    const currentPage = getPage();
    // setup
    const countBefore = await currentPage.menu.getFolderCount();
    const folder = await currentPage.menu.addFolder();
    // execute
    const invalidName = 'a'.repeat(101);
    await currentPage.menu.renameFolderCancelWithError(folder, invalidName, '100文字以内で入力してください');
    await expect(folder).not.toContainText(invalidName);
    // cleanup
    await currentPage.menu.deleteFolder(folder);
    await currentPage.menu.expectFolderCount(countBefore);
  });

  test('ページがあるフォルダは削除できない', async ({ page }) => {
    const currentPage = getPage();
    // 事前に用意したページ付きフォルダをLocatorで取得
    const folder = currentPage.menu.getFolderByName(options.testFolder);
    await expect(folder).toBeVisible();

    // alertをキャプチャしてから削除を試みる
    let alertMessage = '';
    page.once('dialog', dialog => {
      alertMessage = dialog.message();
      void dialog.accept();
    });
    await currentPage.menu.deleteFolder(folder);

    // アラートのメッセージを確認
    expect(alertMessage).toBe('フォルダにページが含まれているため削除できません');
    // フォルダが削除されていないことを確認
    await expect(folder).toBeVisible();
  });

  test('新規ページを追加できる（リロード/DB反映を確認）', async ({ page }) => {
    const currentPage = getPage();
    const countBefore = await currentPage.menu.getPageCount();
    const pageLink = await currentPage.menu.addPage();
    await page.reload();
    await currentPage.menu.expectVisible();
    await expect(pageLink).toBeVisible();
    // cleanup
    await currentPage.menu.deletePage(pageLink);
    await currentPage.menu.expectPageCount(countBefore);
  });

  test('検索フォームでページの絞り込みができる', async () => {
    const currentPage = getPage();
    // テストフォルダを開いて内部のページリンクを取得
    const folder = currentPage.menu.getFolderByName(options.testFolder);
    await currentPage.menu.openFolder(folder);

    const items = await currentPage.menu.getItemsInFolder(folder);
    const pageLink = items.first();
    await expect(pageLink).toBeVisible();

    const title = ((await pageLink.textContent()) ?? '').trim();

    await currentPage.menu.search(title);
    await expect(pageLink).toBeVisible();

    await currentPage.menu.search('存在しないページ名_xyz');
    await expect(pageLink).not.toBeVisible();

    await currentPage.menu.clearSearch();
    await expect(pageLink).toBeVisible();
  });

  test('ページアイテムをクリックすると詳細ページへ遷移する', async ({ page }) => {
    const currentPage = getPage();
    // setup
    const countBefore = await currentPage.menu.getPageCount();
    const pageLink = await currentPage.menu.addPage();
    // execute
    await pageLink.click();
    await expect(page).toHaveURL(options.detailUrlPattern);
    // cleanup
    await currentPage.goto();
    await currentPage.menu.expectVisible();
    await currentPage.menu.deletePage(pageLink);
    await currentPage.menu.expectPageCount(countBefore);
  });

  test('詳細ページを開いた状態で削除した場合、一覧へ戻る', async ({ page }) => {
    const currentPage = getPage();
    const pageLink = await currentPage.menu.addPage();
    // 詳細ページへ遷移
    await pageLink.click();
    await expect(page).toHaveURL(options.detailUrlPattern);
    // メニュー再フェッチ完了待ち
    await expect(pageLink).toBeVisible();
    // 開いたまま削除
    await currentPage.menu.deletePage(pageLink);
    // 一覧へ戻る
    await expect(page).toHaveURL(options.listUrlPattern);
    // ページ固有UI確認
    await options.expectReturnedState?.();
  });
};
