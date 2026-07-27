import { expect } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import path from 'node:path';
import type { FileGrid } from '../../components/FileGrid.js';
import type { FileUploader } from '../../components/FileUploader.js';

export interface FilePage {
  fileGrid: FileGrid;
  fileUploader: FileUploader;
}

export type FilePagePreparer = (page: Page) => Promise<FilePage>;

const FILES_DIR = path.join(import.meta.dirname, '../../files');

export const uploadSampleFile = async (
  browser: Browser,
  url: string,
  baseURL: string,
  prepareFilePage: FilePagePreparer,
  afterUpload: (page: Page, currentPage: FilePage) => Promise<void> = (_, currentPage) =>
    currentPage.fileUploader.expectUploadButtonHidden()
): Promise<void> => {
  // context = ログイン状態やCookieを持つ独立したブラウザ環境
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  // page = 実際のタブ
  const page = await context.newPage();
  await page.goto(url);
  // 各ページごとの前準備
  const currentPage = await prepareFilePage(page);
  await currentPage.fileUploader.filesUpload(path.join(FILES_DIR, 'upload-sample.txt'));
  await afterUpload(page, currentPage);
  await context.close();
};

// 返却するオブジェクトは fileGrid → fileUploader のアルファベット順に揃える
export const deleteSampleFile = async (
  browser: Browser,
  url: string,
  baseURL: string,
  prepareFilePage: FilePagePreparer
): Promise<void> => {
  // context = ログイン状態やCookieを持つ独立したブラウザ環境
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  // page = 実際のタブ
  const page = await context.newPage();
  await page.goto(url);
  // 各ページごとの前準備
  const currentPage = await prepareFilePage(page);
  await currentPage.fileGrid.deleteFile('upload-sample');
  await currentPage.fileGrid.expectFileCardNotVisible('upload-sample');
  await context.close();
};

interface FileUploaderTestOptions {
  afterUpload: (page: Page) => Promise<void>;
}

export const runFileUploaderTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => FilePage,
  options: FileUploaderTestOptions
): void => {
  test('ドロップゾーンが表示される', async () => {
    await getPage().fileUploader.dropzoneVisible();
  });

  test('ファイルを選択するとリストに追加される', async () => {
    const { fileUploader } = getPage();
    await fileUploader.attachFiles(path.join(FILES_DIR, 'upload-sample.txt'));
    await fileUploader.expectFileInList('upload-sample.txt');
  });

  test('ファイル選択後にアップロードボタンが表示される', async () => {
    const { fileUploader } = getPage();
    await fileUploader.expectUploadButtonHidden();
    await fileUploader.attachFiles(path.join(FILES_DIR, 'upload-sample.txt'));
    await fileUploader.expectUploadButtonVisible();
  });

  test('アップロードボタンでファイルが送信される', async ({ page }) => {
    const { fileGrid, fileUploader } = getPage();
    await fileUploader.filesUpload(path.join(FILES_DIR, 'upload-sample.txt'));
    await options.afterUpload(page);
    await fileGrid.expectFileCardVisible('upload-sample');
    // cleanup(後続ブロックとの干渉を防ぐため削除する)
    await fileGrid.deleteFile('upload-sample');
    await fileGrid.expectFileCardNotVisible('upload-sample');
  });

  test('リストからファイルを削除できる', async () => {
    const { fileUploader } = getPage();
    await fileUploader.attachFiles(path.join(FILES_DIR, 'upload-sample.txt'));
    await fileUploader.expectFileInList('upload-sample.txt');
    await fileUploader.removeFileFromList('upload-sample.txt');
    await fileUploader.expectFileNotInList('upload-sample.txt');
    await fileUploader.expectUploadButtonHidden();
  });

  test('バリデーション：_thumb 末尾ファイルはエラーになる', async () => {
    const { fileUploader } = getPage();
    await fileUploader.attachFiles(path.join(FILES_DIR, 'sample_thumb.txt'));
    await fileUploader.expectErrorVisible('末尾が_thumbのファイルはアップロードできません');
  });

  test('バリデーション：. 始まりファイルはエラーになる', async () => {
    await getPage().fileUploader.attachVirtualFiles([
      { buffer: Buffer.from('test'), mimeType: 'text/plain', name: '.hidden.txt' },
    ]);
    await getPage().fileUploader.expectErrorVisible('.から始まるファイルはアップロードできません');
  });

  test('バリデーション：除外拡張子（.php）はエラーになる', async () => {
    await getPage().fileUploader.attachVirtualFiles([
      { buffer: Buffer.from('<?php'), mimeType: 'text/plain', name: 'dangerous.php' },
    ]);
    await getPage().fileUploader.expectErrorVisible('.php の拡張子のファイルはアップロードできません');
  });

  test('11ファイル以上を一度に選択するとエラーになる', async () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      buffer: Buffer.from(`content${String(i + 1)}`),
      mimeType: 'text/plain',
      name: `file${String(i + 1)}.txt`,
    }));
    await getPage().fileUploader.attachVirtualFiles(files);
    await getPage().fileUploader.expectErrorVisible('1度にアップロードできるのは10ファイルまでです');
  });
};

interface FileGridBulkTestOptions {
  afterUpload: (page: Page) => Promise<void>;
  selectAllCount?: 'dynamic' | number;
}

export const runFileGridBulkTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => FilePage,
  options: FileGridBulkTestOptions
): void => {
  test('未選択時に操作ボタンが無効化している', async () => {
    const { fileGrid } = getPage();
    await fileGrid.expectClearSelectionDisabled();
    await fileGrid.expectDownloadDisabled();
    await fileGrid.expectDeleteSelectedDisabled();
  });

  test('すべて選択ボタンで全ファイルが選択される', async () => {
    const { fileGrid } = getPage();
    const count =
      options.selectAllCount === 'dynamic' ? await fileGrid.getFileCardCount() : (options.selectAllCount ?? 1);
    await fileGrid.clickSelectAll();
    await fileGrid.expectSelectionCount(count);
  });

  test('選択中に件数テキストが表示される', async () => {
    const { fileGrid } = getPage();
    const count = await fileGrid.getFileCardCount();
    await fileGrid.clickSelectAll();
    await fileGrid.expectSelectionCount(count);
  });

  test('選択解除ボタンで選択がリセットされる', async () => {
    const { fileGrid } = getPage();
    const count =
      options.selectAllCount === 'dynamic' ? await fileGrid.getFileCardCount() : (options.selectAllCount ?? 1);
    await fileGrid.clickSelectAll();
    await fileGrid.expectSelectionCount(count);
    await fileGrid.clickClearSelection();
    await fileGrid.expectClearSelectionDisabled();
  });

  test('ダウンロードボタンでダウンロードが開始される', async ({ page }) => {
    const { fileGrid } = getPage();
    await fileGrid.clickSelectAll();
    const downloadPromise = page.waitForEvent('download');
    await fileGrid.clickDownloadSelected();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('削除確認をキャンセルするとファイルが残る', async ({ page }) => {
    const { fileGrid } = getPage();
    await fileGrid.clickSelectAll();
    page.once('dialog', dialog => dialog.dismiss());
    await fileGrid.clickDeleteSelected();
    await fileGrid.expectFileCardVisible('upload-sample');
  });

  test('削除ボタンで選択ファイルが削除される', async ({ page }) => {
    const { fileGrid, fileUploader } = getPage();
    await fileUploader.attachVirtualFiles([
      { buffer: Buffer.from('test'), mimeType: 'text/plain', name: 'delete-bulk.txt' },
    ]);
    await fileUploader.clickUploadButton();
    await options.afterUpload(page);
    await fileGrid.expectFileCardVisible('delete-bulk');

    await fileGrid.clickFileCard('delete-bulk.txt');
    await fileGrid.expectSelectionCount(1);
    page.once('dialog', dialog => dialog.accept());
    await fileGrid.clickDeleteSelected();
    await fileGrid.expectFileCardNotVisible('delete-bulk');
  });
};

interface FileGridItemTestOptions {
  afterUpload: (page: Page) => Promise<void>;
}

export const runFileGridItemTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => FilePage,
  options: FileGridItemTestOptions
): void => {
  test('カードをクリックすると選択状態になる', async () => {
    const { fileGrid } = getPage();
    await fileGrid.clickFileCard('upload-sample.txt');
    await fileGrid.expectSelectionCount(1);
  });

  test('選択済みカードを再クリックすると選択解除される', async () => {
    const { fileGrid } = getPage();
    await fileGrid.clickFileCard('upload-sample.txt');
    await fileGrid.expectSelectionCount(1);
    await fileGrid.clickFileCard('upload-sample.txt');
    await fileGrid.expectClearSelectionDisabled();
  });

  test('開けるファイルのメニューに「ファイルを開く」が表示される', async ({ page }) => {
    await getPage().fileGrid.openFileMenu('upload-sample');
    await expect(page.getByRole('menuitem', { name: 'ファイルを開く' })).toBeVisible();
  });

  test('「ファイルを開く」で新しいタブが開く', async ({ page }) => {
    await getPage().fileGrid.openFileMenu('upload-sample');
    const newPagePromise = page.context().waitForEvent('page');
    await getPage().fileGrid.clickMenuItemOpen();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBeTruthy();
  });

  test('ファイル名の変更ができる', async () => {
    const { fileGrid } = getPage();
    const renamed = 'upload-sample-renamed';
    await fileGrid.openFileMenu('upload-sample');
    await fileGrid.clickMenuItemRename();
    await fileGrid.fillRenameField(renamed);
    await fileGrid.confirmRename();
    await fileGrid.expectFileCardVisible(renamed);
    // 元に戻す
    await fileGrid.openFileMenu(renamed);
    await fileGrid.clickMenuItemRename();
    await fileGrid.fillRenameField('upload-sample');
    await fileGrid.confirmRename();
    await fileGrid.expectFileCardVisible('upload-sample');
  });

  test('バリデーション：禁止文字を含むファイル名でエラーが出る', async () => {
    const { fileGrid } = getPage();
    await fileGrid.openFileMenu('upload-sample');
    await fileGrid.clickMenuItemRename();
    await fileGrid.fillRenameField('invalid/name');
    await fileGrid.expectRenameError('使用できない文字が含まれています');
    await fileGrid.blurRenameField();
    await fileGrid.expectFileCardVisible('upload-sample');
  });

  test('バリデーション：空白を含むファイル名でエラーが出る', async () => {
    const { fileGrid } = getPage();
    await fileGrid.openFileMenu('upload-sample');
    await fileGrid.clickMenuItemRename();
    await fileGrid.fillRenameField('invalid name');
    await fileGrid.expectRenameError('使用できない文字が含まれています');
    await fileGrid.blurRenameField();
    await fileGrid.expectFileCardVisible('upload-sample');
  });

  test('バリデーション：_thumb 末尾のファイル名でエラーが出る', async () => {
    const { fileGrid } = getPage();
    await fileGrid.openFileMenu('upload-sample');
    await fileGrid.clickMenuItemRename();
    await fileGrid.fillRenameField('upload_thumb');
    await fileGrid.expectRenameError('使用できない文字が含まれています');
    await fileGrid.blurRenameField();
    await fileGrid.expectFileCardVisible('upload-sample');
  });

  test('エラー状態でフォーカスアウトすると元のファイル名に戻る', async () => {
    const { fileGrid } = getPage();
    await fileGrid.openFileMenu('upload-sample');
    await fileGrid.clickMenuItemRename();
    await fileGrid.fillRenameField('');
    await fileGrid.blurRenameField();
    await fileGrid.expectFileCardVisible('upload-sample');
  });

  test('URLのコピーができる', async ({ page }) => {
    const { fileGrid } = getPage();
    await fileGrid.openFileMenu('upload-sample');
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await fileGrid.clickMenuItemCopyUrl();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).not.toBeVisible();
  });

  test('ダウンロードができる', async ({ page }) => {
    await getPage().fileGrid.openFileMenu('upload-sample');
    const downloadPromise = page.waitForEvent('download');
    await getPage().fileGrid.clickMenuItemDownload();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('削除確認をキャンセルするとファイルが残る（個別）', async ({ page }) => {
    const { fileGrid, fileUploader } = getPage();
    await fileUploader.attachVirtualFiles([
      { buffer: Buffer.from('test'), mimeType: 'text/plain', name: 'delete-single.txt' },
    ]);
    await fileUploader.clickUploadButton();
    await options.afterUpload(page);
    await fileGrid.expectFileCardVisible('delete-single');
    await fileGrid.openFileMenu('delete-single');
    page.once('dialog', dialog => dialog.dismiss());
    await fileGrid.clickMenuItemDelete();
    await fileGrid.expectFileCardVisible('delete-single');
    // cleanup(後続ブロックとの干渉を防ぐため削除する)
    await fileGrid.deleteFile('delete-single');
    await fileGrid.expectFileCardNotVisible('delete-single');
  });

  test('個別削除でファイルがリストから消える', async ({ page }) => {
    const { fileGrid, fileUploader } = getPage();
    await fileUploader.attachVirtualFiles([
      { buffer: Buffer.from('test'), mimeType: 'text/plain', name: 'delete-single.txt' },
    ]);
    await fileUploader.clickUploadButton();
    await options.afterUpload(page);
    await fileGrid.expectFileCardVisible('delete-single');

    await fileGrid.openFileMenu('delete-single');
    page.once('dialog', dialog => dialog.accept());
    await fileGrid.clickMenuItemDelete();
    await fileGrid.expectFileCardNotVisible('delete-single');
  });

  test('同名ファイルを再アップロードすると連番付きファイル名になる', async ({ page }) => {
    const { fileGrid, fileUploader } = getPage();
    await fileUploader.attachFiles(path.join(FILES_DIR, 'upload-sample.txt'));
    await fileUploader.clickUploadButton();
    await options.afterUpload(page);
    await fileGrid.expectFileCardVisible('upload-sample(1)');
  });
};
