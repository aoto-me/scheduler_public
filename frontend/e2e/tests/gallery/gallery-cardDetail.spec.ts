import { expect } from '@playwright/test';
import path from 'node:path';
import { test } from '../../fixtures/galleryFixture.js';
import type { GalleryCardDetailPage } from '../../pages/GalleryCardDetailPage.js';
import { runEditorCommonTests } from '../../utils/helpers/editorTestHelpers.js';
import { runTitleTests } from '../../utils/helpers/titleTestHelpers.js';

const FILES_DIR = path.join(import.meta.dirname, '../../files');

let galleryCardDetailPage: GalleryCardDetailPage;

test.beforeEach(({ galleryCardDetailPage: currentPage }) => {
  galleryCardDetailPage = currentPage;
});

test.describe('GalleryPost > CardDetail', () => {
  test('パンくずリストが表示される', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.expectBreadcrumbsVisible();
  });

  test('パンくずにgalleryリンクが含まれる', async ({ galleryCardDetailPage, page }) => {
    await galleryCardDetailPage.expectBreadcrumbsVisible();
    await expect(page.getByLabel('パンくずリスト').getByRole('link', { name: 'gallery' })).toBeVisible();
  });
});

test.describe('GalleryPost > CardDetail > Title', () => {
  runTitleTests(
    test,
    () => ({
      expectReady: async () => galleryCardDetailPage.slider.expectVisible(),
      title: galleryCardDetailPage.title,
    }),
    { newTitle: 'E2Eテスト カードタイトル変更' }
  );
});

test.describe('GalleryPost > CardDetail > 日付', () => {
  test.beforeEach(async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.expectDateVisible();
  });

  test('日付を入力するとリロード後も維持される（DB反映を確認）', async ({ galleryCardDetailPage, page }) => {
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/gallery/cardDate/') && resp.status() === 200
    );
    await galleryCardDetailPage.selectDate('2025-01-01');
    await responsePromise;
    await page.reload();
    await galleryCardDetailPage.slider.expectVisible();
    await galleryCardDetailPage.expectDateValue('2025-01-01');
  });
});

test.describe('GalleryPost > CardDetail > スライダー', () => {
  test('画像0枚の状態でスライダー空メッセージが表示される', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.expectEmptyMessageVisible();
  });

  test('画像ファイルをアップロードすると空メッセージが消える', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.expectEmptyMessageVisible();
    await galleryCardDetailPage.slider.attachFirstImageFile(path.join(FILES_DIR, 'upload-img.jpg'));
    await galleryCardDetailPage.slider.expectEmptyMessageHidden();
  });

  test('バリデーション：_thumb 末尾ファイルはエラーになる', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('test'),
      mimeType: 'image/jpeg',
      name: 'sample_thumb.jpg',
    });
    await galleryCardDetailPage.slider.expectUploadError('末尾が_thumbのファイルはアップロードできません');
  });

  test('バリデーション：. 始まりファイルはエラーになる', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('test'),
      mimeType: 'image/jpeg',
      name: '.hidden.jpg',
    });
    await galleryCardDetailPage.slider.expectUploadError('.から始まるファイルはアップロードできません');
  });

  test('バリデーション：除外拡張子（.php）はエラーになる', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('<?php'),
      mimeType: 'application/octet-stream',
      name: 'dangerous.php',
    });
    await galleryCardDetailPage.slider.expectUploadError('.php の拡張子のファイルはアップロードできません');
  });

  test('11ファイル以上を一度に選択するとエラーになる', async ({ galleryCardDetailPage }) => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      buffer: Buffer.from(`content${String(i + 1)}`),
      mimeType: 'image/jpeg',
      name: `file${String(i + 1)}.jpg`,
    }));
    await galleryCardDetailPage.slider.attachVirtualImageFile(files);
    await galleryCardDetailPage.slider.expectUploadError('1度にアップロードできるのは10ファイルまでです');
  });

  test('画像・動画以外のファイル型はアップロードエラーになる', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('text content'),
      mimeType: 'text/plain',
      name: 'document.txt',
    });
    await galleryCardDetailPage.slider.expectUploadError('アップロードできるのは画像・動画ファイルのみです');
  });

  test('同名ファイルを再アップロードすると連番付きファイル名になる', async ({ galleryCardDetailPage, page }) => {
    const countBefore = await galleryCardDetailPage.slider.getSlideCount();
    await galleryCardDetailPage.slider.attachImageFile(path.join(FILES_DIR, 'upload-img.jpg'), countBefore + 1);
    await page.reload();
    await galleryCardDetailPage.slider.expectVisible();
    await galleryCardDetailPage.slider.expectSlideFileName('upload-img(1)');
  });
});

test.describe('GalleryPost > CardDetail > 個別ファイル操作', () => {
  test.beforeEach(async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.expectVisible();
    await galleryCardDetailPage.slider.expectEmptyMessageHidden();
  });

  // アップロードテストより後に実行されるため、少なくとも1枚の画像が存在する前提
  test('ファイル操作メニューを開くとメニュー項目が表示される', async ({ galleryCardDetailPage, page }) => {
    await galleryCardDetailPage.slider.openImageMenu(0);
    await expect(page.getByRole('menuitem', { name: 'ファイルを開く' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ファイル名の変更' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ダウンロード' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '削除' })).toBeVisible();
  });

  test('「ファイルを開く」で新しいタブが開く', async ({ galleryCardDetailPage, page }) => {
    await galleryCardDetailPage.slider.openImageMenu(0);
    const newPagePromise = page.context().waitForEvent('page');
    await galleryCardDetailPage.slider.clickMenuItemOpen();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBeTruthy();
  });

  test.describe('ファイル名変更', () => {
    test.afterEach(async ({ galleryCardDetailPage, page }) => {
      await page.reload();
      await galleryCardDetailPage.slider.expectVisible();
      await galleryCardDetailPage.slider.clickMenuAndFillRenameField({ name: 'upload-img' });
      await galleryCardDetailPage.slider.confirmRename();
      await galleryCardDetailPage.slider.expectRenameFieldNotVisible();
    });

    test('ファイル名の変更ができる（リロード/DB反映を確認）', async ({ galleryCardDetailPage, page }) => {
      const renamedName = 'card-img-renamed';
      await galleryCardDetailPage.slider.expectVisible();
      await galleryCardDetailPage.slider.clickMenuAndFillRenameField({ name: renamedName });
      await galleryCardDetailPage.slider.confirmRename();
      await galleryCardDetailPage.slider.expectRenameFieldNotVisible();
      await galleryCardDetailPage.slider.expectSlideFileName(renamedName);

      await page.reload();
      await galleryCardDetailPage.slider.expectVisible();
      await galleryCardDetailPage.slider.expectSlideFileName(renamedName);
    });
  });

  test('禁止文字を含むファイル名でバリデーションエラーが出る', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.expectVisible();
    await galleryCardDetailPage.slider.clickMenuAndFillRenameField({ name: 'invalid/name' });
    await galleryCardDetailPage.slider.expectRenameHelperText('使用できない文字が含まれています');
    await galleryCardDetailPage.slider.blurRenameField();
  });

  test('空文字でバリデーションエラー（未入力です）が出る', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.expectVisible();
    await galleryCardDetailPage.slider.clickMenuAndFillRenameField({ name: '' });
    await galleryCardDetailPage.slider.expectRenameHelperText('未入力です');
    await galleryCardDetailPage.slider.blurRenameField();
  });

  test('エラー状態でフォーカスアウトすると TextField が消える', async ({ galleryCardDetailPage }) => {
    await galleryCardDetailPage.slider.expectVisible();
    await galleryCardDetailPage.slider.clickMenuAndFillRenameField({ name: 'invalid/name' });
    await galleryCardDetailPage.slider.blurRenameField();
    await galleryCardDetailPage.slider.expectRenameFieldNotVisible();
  });

  test('「URLのコピー」でメニューが閉じる', async ({ galleryCardDetailPage, page }) => {
    await galleryCardDetailPage.slider.openImageMenu(0);
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await galleryCardDetailPage.slider.clickMenuItemCopyUrl();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).not.toBeVisible();
  });

  test('「ダウンロード」でダウンロードが開始される', async ({ galleryCardDetailPage, page }) => {
    await galleryCardDetailPage.slider.openImageMenu(0);
    const downloadPromise = page.waitForEvent('download');
    await galleryCardDetailPage.slider.clickMenuItemDownload();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('ファイルを削除するとスライダーから消える', async ({ galleryCardDetailPage, page }) => {
    const countBefore = await galleryCardDetailPage.slider.getSlideCount();
    await galleryCardDetailPage.slider.openImageMenu(0);
    page.once('dialog', dialog => void dialog.accept());
    await galleryCardDetailPage.slider.clickMenuItemDelete();
    await page.waitForTimeout(500);
    await galleryCardDetailPage.slider.expectSlideCount(countBefore - 1);
  });
});

test.describe('GalleryPost > CardDetail > Editor', () => {
  test.beforeEach(async () => {
    await galleryCardDetailPage.editor.expectVisible();
  });

  runEditorCommonTests(test, () => ({ editor: galleryCardDetailPage.editor }), {
    afterReload: async () => {
      await galleryCardDetailPage.slider.expectVisible();
    },
    initialToCVisible: false,
  });
});

test.describe('GalleryPost > CardDetail > カード削除', () => {
  test('カードを削除するとカード一覧ページへリダイレクトされ、そのカードが存在しない', async ({
    galleryCardDetailPage,
    galleryCardDetailPostUrl,
    page,
  }) => {
    page.once('dialog', dialog => void dialog.accept());
    await galleryCardDetailPage.clickDeleteCardButton();
    await expect(page).toHaveURL(galleryCardDetailPostUrl);

    await expect(page.getByRole('button', { name: 'カードを追加' })).toBeVisible();
    await expect(page.locator('[data-testid="card-item"]')).toHaveCount(0);
  });
});
