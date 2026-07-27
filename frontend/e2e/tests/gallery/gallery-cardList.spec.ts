import { expect } from '@playwright/test';
import { test } from '../../fixtures/galleryFixture.js';
import type { GalleryPostPage } from '../../pages/GalleryPostPage.js';
import { runTitleTests } from '../../utils/helpers/titleTestHelpers.js';

let galleryCardPostPage: GalleryPostPage;

test.beforeEach(({ galleryCardPostPage: currentPage }) => {
  galleryCardPostPage = currentPage;
});

test.describe('GalleryPost > CardList', () => {
  test('パンくずリストが表示される', async ({ galleryCardPostPage }) => {
    await galleryCardPostPage.expectBreadcrumbsVisible();
  });

  test('パンくずにgalleryリンクが含まれる', async ({ galleryCardPostPage, page }) => {
    await galleryCardPostPage.expectBreadcrumbsVisible();
    await expect(page.getByLabel('パンくずリスト').getByRole('link', { name: 'gallery' })).toBeVisible();
  });
});

test.describe('GalleryPost > CardList > Title', () => {
  runTitleTests(
    test,
    () => ({
      expectReady: async () => galleryCardPostPage.cardList.expectAddCardButtonVisible(),
      title: galleryCardPostPage.title,
    }),
    { newTitle: 'E2Eテスト cardページタイトル変更' }
  );
});

test.describe('GalleryPost > CardList > カード', () => {
  test('初期状態ではカードが0件である', async ({ galleryCardPostPage }) => {
    await galleryCardPostPage.cardList.expectCardCount(0);
  });

  test('「カードを追加」でカードが追加される', async ({ galleryCardPostPage }) => {
    const countBefore = await galleryCardPostPage.cardList.getCardCount();
    await galleryCardPostPage.cardList.addCard();
    await galleryCardPostPage.cardList.expectCardCount(countBefore + 1);
  });

  test('カード追加後リロードしてもカードが存在する（DB反映を確認）', async ({ galleryCardPostPage, page }) => {
    await page.reload();
    await galleryCardPostPage.cardList.expectAddCardButtonVisible();
    const count = await galleryCardPostPage.cardList.getCardCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('カードをクリックするとカード詳細ページへ遷移する', async ({ galleryCardPostPage, page }) => {
    await galleryCardPostPage.cardList.clickFirstCard();
    await expect(page).toHaveURL(/\/gallery\/\d+\/\d+/);
  });
});
