import { expect } from '@playwright/test';
import path from 'node:path';
import { test } from '../../fixtures/diaryFixture.js';
import type { DiaryCardDetailPage } from '../../pages/DiaryCardDetailPage.js';
import { runEditorCommonTests } from '../../utils/helpers/editorTestHelpers.js';
import { runTitleTests } from '../../utils/helpers/titleTestHelpers.js';

const FILES_DIR = path.join(import.meta.dirname, '../../files');
let diaryCardDetailPage: DiaryCardDetailPage;

test.beforeEach(({ diaryCardDetailPage: currentPage }) => {
  diaryCardDetailPage = currentPage;
});

test.describe('Diaryページ > CardDetail', () => {
  test('パンくずリストが表示される', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.expectBreadcrumbsVisible();
  });

  test('パンくずにgalleryリンクが含まれる', async ({ diaryCardDetailPage, page }) => {
    await diaryCardDetailPage.expectBreadcrumbsVisible();
    await expect(page.getByLabel('パンくずリスト').getByRole('link', { name: 'gallery' })).toBeVisible();
  });

  test('パンくずにdiaryテキストが含まれる', async ({ diaryCardDetailPage, page }) => {
    await diaryCardDetailPage.expectBreadcrumbsVisible();
    await expect(page.getByLabel('パンくずリスト').getByRole('link', { name: 'diary' })).toBeVisible();
  });
});

test.describe('Diaryページ > CardDetail > Title', () => {
  runTitleTests(
    test,
    () => ({
      expectReady: async () => diaryCardDetailPage.slider.expectVisible(),
      title: diaryCardDetailPage.title,
    }),
    { newTitle: 'E2Eテスト Diary カードタイトル変更' }
  );
});

test.describe('Diaryページ > CardDetail > 日付', () => {
  test.beforeEach(async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.expectDateVisible();
  });

  test('日付フィールドがdisabledである（Diaryは日付変更不可）', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.expectDateDisabled();
  });
});

test.describe('Diaryページ > CardDetail > スライダー', () => {
  test('画像0枚の状態でスライダー空メッセージが表示される', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.expectEmptyMessageVisible();
  });

  test('画像ファイルをアップロードすると空メッセージが消える', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.expectEmptyMessageVisible();
    await diaryCardDetailPage.slider.attachFirstImageFile(path.join(FILES_DIR, 'upload-img.jpg'));
    await diaryCardDetailPage.slider.expectEmptyMessageHidden();
  });

  test('バリデーション：_thumb末尾ファイルはエラーになる', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('test'),
      mimeType: 'image/jpeg',
      name: 'sample_thumb.jpg',
    });
    await diaryCardDetailPage.slider.expectUploadError('末尾が_thumbのファイルはアップロードできません');
  });

  test('バリデーション：. 始まりファイルはエラーになる', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('test'),
      mimeType: 'image/jpeg',
      name: '.hidden.jpg',
    });
    await diaryCardDetailPage.slider.expectUploadError('.から始まるファイルはアップロードできません');
  });

  test('バリデーション：除外拡張子（.php）はエラーになる', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('<?php'),
      mimeType: 'application/octet-stream',
      name: 'dangerous.php',
    });
    await diaryCardDetailPage.slider.expectUploadError('.php の拡張子のファイルはアップロードできません');
  });

  test('11ファイル以上を一度に選択するとエラーになる', async ({ diaryCardDetailPage }) => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      buffer: Buffer.from(`content${String(i + 1)}`),
      mimeType: 'image/jpeg',
      name: `file${String(i + 1)}.jpg`,
    }));
    await diaryCardDetailPage.slider.attachVirtualImageFile(files);
    await diaryCardDetailPage.slider.expectUploadError('1度にアップロードできるのは10ファイルまでです');
  });

  test('画像・動画以外のファイル型はアップロードエラーになる', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.attachVirtualImageFile({
      buffer: Buffer.from('text content'),
      mimeType: 'text/plain',
      name: 'document.txt',
    });
    await diaryCardDetailPage.slider.expectUploadError('アップロードできるのは画像・動画ファイルのみです');
  });

  test('同名ファイルを再アップロードすると連番付きファイル名になる', async ({ diaryCardDetailPage, page }) => {
    const countBefore = await diaryCardDetailPage.slider.getSlideCount();
    await diaryCardDetailPage.attachAdditionalImageFile(path.join(FILES_DIR, 'upload-img.jpg'), countBefore + 1);
    await page.reload();
    await diaryCardDetailPage.slider.expectVisible();
    await diaryCardDetailPage.slider.expectSlideFileName('upload-img(1)');
  });
});

test.describe('Diaryページ > CardDetail > 個別ファイル操作', () => {
  // スライダーセクションのアップロードテストより後に実行されるため、少なくとも1枚の画像が存在する前提
  test.beforeEach(async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.expectVisible();
    await diaryCardDetailPage.slider.expectEmptyMessageHidden();
  });

  test('ファイル操作メニューを開くとメニュー項目が表示される', async ({ diaryCardDetailPage, page }) => {
    await diaryCardDetailPage.slider.openImageMenu(0);
    await expect(page.getByRole('menuitem', { name: 'ファイルを開く' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ファイル名の変更' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ダウンロード' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '削除' })).toBeVisible();
  });

  test('「ファイルを開く」で新しいタブが開く', async ({ diaryCardDetailPage, page }) => {
    await diaryCardDetailPage.slider.openImageMenu(0);
    const newPagePromise = page.context().waitForEvent('page');
    await diaryCardDetailPage.slider.clickMenuItemOpen();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBeTruthy();
  });

  test.describe('ファイル名変更', () => {
    test.afterEach(async ({ diaryCardDetailPage, page }) => {
      await page.reload();
      await diaryCardDetailPage.slider.expectVisible();
      await diaryCardDetailPage.slider.clickMenuAndFillRenameField({ name: 'upload-img' });
      await diaryCardDetailPage.slider.confirmRename();
      await diaryCardDetailPage.slider.expectRenameFieldNotVisible();
    });

    test('ファイル名の変更ができる（リロード/DB反映を確認）', async ({ diaryCardDetailPage, page }) => {
      const renamedName = 'diary-img-renamed';
      await diaryCardDetailPage.slider.expectVisible();
      await diaryCardDetailPage.slider.clickMenuAndFillRenameField({ name: renamedName });
      await diaryCardDetailPage.slider.confirmRename();
      await diaryCardDetailPage.slider.expectRenameFieldNotVisible();
      await diaryCardDetailPage.slider.expectSlideFileName(renamedName);

      await page.reload();
      await diaryCardDetailPage.slider.expectVisible();
      await diaryCardDetailPage.slider.expectSlideFileName(renamedName);
    });
  });

  test('禁止文字を含むファイル名でバリデーションエラーが出る', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.expectVisible();
    await diaryCardDetailPage.slider.clickMenuAndFillRenameField({ name: 'invalid/name' });
    await diaryCardDetailPage.slider.expectRenameHelperText('使用できない文字が含まれています');
    await diaryCardDetailPage.slider.blurRenameField();
  });

  test('空文字でバリデーションエラー（未入力です）が出る', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.expectVisible();
    await diaryCardDetailPage.slider.clickMenuAndFillRenameField({ name: '' });
    await diaryCardDetailPage.slider.expectRenameHelperText('未入力です');
    await diaryCardDetailPage.slider.blurRenameField();
  });

  test('エラー状態でフォーカスアウトするとTextFieldが消える', async ({ diaryCardDetailPage }) => {
    await diaryCardDetailPage.slider.expectVisible();
    await diaryCardDetailPage.slider.clickMenuAndFillRenameField({ name: 'invalid/name' });
    await diaryCardDetailPage.slider.blurRenameField();
    await diaryCardDetailPage.slider.expectRenameFieldNotVisible();
  });

  test('「URLのコピー」でメニューが閉じる', async ({ diaryCardDetailPage, page }) => {
    await diaryCardDetailPage.slider.openImageMenu(0);
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).toBeVisible();
    await diaryCardDetailPage.slider.clickMenuItemCopyUrl();
    await expect(page.getByRole('menuitem', { name: 'URLのコピー' })).not.toBeVisible();
  });

  test('「ダウンロード」でダウンロードが開始される', async ({ diaryCardDetailPage, page }) => {
    await diaryCardDetailPage.slider.openImageMenu(0);
    const downloadPromise = page.waitForEvent('download');
    await diaryCardDetailPage.slider.clickMenuItemDownload();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('ファイルを削除するとスライダーから消える', async ({ diaryCardDetailPage, page }) => {
    const countBefore = await diaryCardDetailPage.slider.getSlideCount();
    await diaryCardDetailPage.slider.openImageMenu(0);
    page.once('dialog', dialog => void dialog.accept());
    await diaryCardDetailPage.slider.clickMenuItemDelete();
    await page.waitForTimeout(500);
    await diaryCardDetailPage.slider.expectSlideCount(countBefore - 1);
  });
});

test.describe('Diaryページ > CardDetail > Editor', () => {
  test.beforeEach(async () => {
    await diaryCardDetailPage.editor.expectVisible();
  });

  runEditorCommonTests(test, () => ({ editor: diaryCardDetailPage.editor }), {
    afterReload: async () => {
      await diaryCardDetailPage.slider.expectVisible();
    },
    initialToCVisible: false,
  });
});

test.describe('Diaryページ > CardDetail > カード削除', () => {
  test('カードを削除するとカード一覧にリダイレクトされ、そのカードが存在しない', async ({
    diaryCardDetailPage,
    diaryCardListUrl,
    page,
  }) => {
    page.once('dialog', dialog => void dialog.accept());
    await diaryCardDetailPage.clickDeleteCardButton();
    // Gallery（/gallery/:id）と異なり Diary では /gallery/diary に遷移する
    await diaryCardDetailPage.expectRedirectedToDiaryList();

    await page.goto(diaryCardListUrl);
    await expect(page.getByRole('button', { name: 'カードを追加' })).toBeVisible();
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/02' })).toHaveCount(0);
  });
});
