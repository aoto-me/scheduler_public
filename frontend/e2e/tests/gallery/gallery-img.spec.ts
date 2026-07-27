import { expect } from '@playwright/test';
import path from 'node:path';
import { test } from '../../fixtures/galleryFixture.js';
import type { GalleryPostPage } from '../../pages/GalleryPostPage.js';
import { runTitleTests } from '../../utils/helpers/titleTestHelpers.js';

const FILES_DIR = path.join(import.meta.dirname, '../../files');

let galleryImgPostPage: GalleryPostPage;

test.beforeEach(({ galleryImgPostPage: currentPage }) => {
  galleryImgPostPage = currentPage;
});

test.describe('GalleryPost > ImgGrid', () => {
  test('パンくずリストが表示される', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.expectBreadcrumbsVisible();
  });

  test('パンくずにgalleryリンクが含まれる', async ({ galleryImgPostPage, page }) => {
    await galleryImgPostPage.expectBreadcrumbsVisible();
    await expect(page.getByLabel('パンくずリスト').getByRole('link', { name: 'gallery' })).toBeVisible();
  });
});

test.describe('GalleryPost > ImgGrid > Title', () => {
  runTitleTests(
    test,
    () => ({
      expectReady: async () => galleryImgPostPage.imageGrid.expectVisible(),
      title: galleryImgPostPage.title,
    }),
    { newTitle: 'E2Eテスト imgページタイトル変更' }
  );
});

test.describe('GalleryPost > ImgGrid > 画像アップロード', () => {
  test('画像ファイルをアップロードするとグリッドに追加される', async ({ galleryImgPostPage }) => {
    const countBefore = await galleryImgPostPage.imageGrid.getFileCount();
    await galleryImgPostPage.imageGrid.attachImageFile(path.join(FILES_DIR, 'upload-img.jpg'));
    await galleryImgPostPage.imageGrid.expectFileCount(countBefore + 1);
  });

  test('バリデーション：_thumb 末尾ファイルはエラーになる', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.attachVirtualImageFile({
      buffer: Buffer.from('test'),
      mimeType: 'image/jpeg',
      name: 'sample_thumb.jpg',
    });
    await galleryImgPostPage.imageGrid.expectUploadError('末尾が_thumbのファイルはアップロードできません');
  });

  test('バリデーション：. 始まりファイルはエラーになる', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.attachVirtualImageFile({
      buffer: Buffer.from('test'),
      mimeType: 'image/jpeg',
      name: '.hidden.jpg',
    });
    await galleryImgPostPage.imageGrid.expectUploadError('.から始まるファイルはアップロードできません');
  });

  test('バリデーション：除外拡張子（.php）はエラーになる', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.attachVirtualImageFile({
      buffer: Buffer.from('<?php'),
      mimeType: 'application/octet-stream',
      name: 'dangerous.php',
    });
    await galleryImgPostPage.imageGrid.expectUploadError('.php の拡張子のファイルはアップロードできません');
  });

  test('11ファイル以上を一度に選択するとエラーになる', async ({ galleryImgPostPage }) => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      buffer: Buffer.from(`content${String(i + 1)}`),
      mimeType: 'image/jpeg',
      name: `file${String(i + 1)}.jpg`,
    }));
    await galleryImgPostPage.imageGrid.attachVirtualImageFile(files);
    await galleryImgPostPage.imageGrid.expectUploadError('1度にアップロードできるのは10ファイルまでです');
  });

  test('画像・動画以外のファイル型はアップロードエラーになる', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.attachVirtualImageFile({
      buffer: Buffer.from('text content'),
      mimeType: 'text/plain',
      name: 'document.txt',
    });
    await galleryImgPostPage.imageGrid.expectUploadError('アップロードできるのは画像・動画ファイルのみです');
  });

  test('同名ファイルを再アップロードすると連番付きファイル名になる', async ({ galleryImgPostPage, page }) => {
    const countBefore = await galleryImgPostPage.imageGrid.getFileCount();
    await galleryImgPostPage.imageGrid.attachImageFile(path.join(FILES_DIR, 'upload-img.jpg'));
    await page.reload();
    await galleryImgPostPage.imageGrid.expectVisible();
    await galleryImgPostPage.imageGrid.expectItemFileName(countBefore, 'upload-img(1)');
  });
});

test.describe('GalleryPost > ImgGrid > モーダル', () => {
  // アップロードテストより後に実行されるため、少なくとも1枚の画像が存在する前提
  test('画像をクリックするとモーダルが表示される', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.clickFirstGridImage();
    await galleryImgPostPage.imageGrid.expectDialogVisible();
  });

  test('モーダル内にスライダーコンテナが表示される', async ({ galleryImgPostPage, page }) => {
    await galleryImgPostPage.imageGrid.clickFirstGridImage();
    await galleryImgPostPage.imageGrid.expectDialogVisible();
    await expect(page.locator('[role="dialog"] [data-testid="image-slider"]')).toBeVisible();
  });
});

test.describe('GalleryPost > ImgGrid > 個別ファイル操作', () => {
  test('ファイル操作メニューを開くとメニュー項目が表示される', async ({ galleryImgPostPage, page }) => {
    await galleryImgPostPage.imageGrid.clickImageMenu(0);
    await expect(page.getByRole('menuitem', { name: 'ファイルを開く' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ファイル名の変更' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ダウンロード' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '削除' })).toBeVisible();
  });

  test('「ファイルを開く」で新しいタブが開く', async ({ galleryImgPostPage, page }) => {
    await galleryImgPostPage.imageGrid.clickImageMenu(0);
    const newPagePromise = page.context().waitForEvent('page');
    await galleryImgPostPage.imageGrid.clickMenuItemOpen();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBeTruthy();
  });

  test.describe('ファイル名変更', () => {
    test.afterEach(async ({ galleryImgPostPage, page }) => {
      await page.reload();
      await galleryImgPostPage.imageGrid.expectVisible();
      await galleryImgPostPage.imageGrid.clickMenuAndFillRenameField({
        name: 'upload-img',
      });
      await galleryImgPostPage.imageGrid.confirmRename();
      await galleryImgPostPage.imageGrid.expectRenameFieldNotVisible();
    });

    test('ファイル名の変更ができる（リロード/DB反映を確認）', async ({ galleryImgPostPage, page }) => {
      const renamedName = 'renamed-img';
      await galleryImgPostPage.imageGrid.expectVisible();
      await galleryImgPostPage.imageGrid.clickMenuAndFillRenameField({
        name: renamedName,
      });
      await galleryImgPostPage.imageGrid.confirmRename();
      await galleryImgPostPage.imageGrid.expectRenameFieldNotVisible();
      await galleryImgPostPage.imageGrid.expectItemFileName(0, renamedName);

      await page.reload();
      await galleryImgPostPage.imageGrid.expectVisible();
      await galleryImgPostPage.imageGrid.expectItemFileName(0, renamedName);
    });
  });

  test('禁止文字を含むファイル名でバリデーションエラーが出る', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.expectVisible();
    await galleryImgPostPage.imageGrid.clickMenuAndFillRenameField({
      name: 'invalid/name',
    });
    await galleryImgPostPage.imageGrid.expectRenameHelperText('使用できない文字が含まれています');
    await galleryImgPostPage.imageGrid.blurRenameField();
  });

  test('空文字でバリデーションエラー（未入力です）が出る', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.expectVisible();
    await galleryImgPostPage.imageGrid.clickMenuAndFillRenameField({
      name: '',
    });
    await galleryImgPostPage.imageGrid.expectRenameHelperText('未入力です');
    await galleryImgPostPage.imageGrid.blurRenameField();
  });

  test('エラー状態でフォーカスアウトすると TextField が消える', async ({ galleryImgPostPage }) => {
    await galleryImgPostPage.imageGrid.expectVisible();
    await galleryImgPostPage.imageGrid.clickMenuAndFillRenameField({
      name: 'invalid/name',
    });
    await galleryImgPostPage.imageGrid.blurRenameField();
    await galleryImgPostPage.imageGrid.expectRenameFieldNotVisible();
  });

  test('「URLのコピー」でメニューが閉じる', async ({ galleryImgPostPage, page }) => {
    await galleryImgPostPage.imageGrid.clickImageMenu(0);
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await galleryImgPostPage.imageGrid.clickMenuItemCopyUrl();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).not.toBeVisible();
  });

  test('「ダウンロード」でダウンロードが開始される', async ({ galleryImgPostPage, page }) => {
    await galleryImgPostPage.imageGrid.clickImageMenu(0);
    const downloadPromise = page.waitForEvent('download');
    await galleryImgPostPage.imageGrid.clickMenuItemDownload();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('「削除」でファイルがグリッドから消える', async ({ galleryImgPostPage, page }) => {
    // 削除用に1枚追加
    await galleryImgPostPage.imageGrid.attachImageFile(path.join(FILES_DIR, 'upload-img.jpg'));
    const countBefore = await galleryImgPostPage.imageGrid.getFileCount();

    await galleryImgPostPage.imageGrid.clickImageMenu(0);
    page.once('dialog', dialog => void dialog.accept());
    await galleryImgPostPage.imageGrid.clickMenuItemDelete();
    await galleryImgPostPage.imageGrid.expectFileCount(countBefore - 1);
  });
});
