import { expect } from '@playwright/test';
import { test } from '../../fixtures/galleryFixture.js';
import { GalleryPostPage } from '../../pages/GalleryPostPage.js';

test.describe('GalleryPost > SelectType', () => {
  test('新規ページはタイプ選択画面が表示される', async ({ galleryPage, page }) => {
    const pageLink = await galleryPage.menu.addPage();
    await pageLink.click();
    await expect(page).toHaveURL(/\/gallery\/\d+/);

    const postPage = new GalleryPostPage(page);
    await postPage.expectSelectTypeVisible();

    await galleryPage.goto();
    await galleryPage.menu.expectVisible();
    await galleryPage.menu.deletePage(pageLink);
  });

  test('「画像のみ」を選択するとImgビューに切り替わる（リロード/DB反映を確認）', async ({ galleryPage, page }) => {
    const pageLink = await galleryPage.menu.addPage();
    await pageLink.click();
    await expect(page).toHaveURL(/\/gallery\/\d+/);

    const postPage = new GalleryPostPage(page);
    await postPage.expectSelectTypeVisible();
    await postPage.clickImgTypeButton();

    await postPage.expectBreadcrumbsVisible();
    await postPage.title.expectVisible();
    await postPage.imageGrid.expectVisible();
    await postPage.expectSelectTypeNotVisible();

    // リロードしてもImgビューが維持されること
    await page.reload();
    await postPage.expectBreadcrumbsVisible();
    await postPage.title.expectVisible();
    await postPage.imageGrid.expectVisible();
    await postPage.expectSelectTypeNotVisible();

    await galleryPage.goto();
    await galleryPage.menu.expectVisible();
    await galleryPage.menu.deletePage(pageLink);
  });

  test('「画像とテキスト」を選択するとCardビューに切り替わる（リロード/DB反映を確認）', async ({
    galleryPage,
    page,
  }) => {
    const pageLink = await galleryPage.menu.addPage();
    await pageLink.click();
    await expect(page).toHaveURL(/\/gallery\/\d+/);

    const postPage = new GalleryPostPage(page);
    await postPage.expectSelectTypeVisible();
    await postPage.clickCardTypeButton();

    await postPage.expectBreadcrumbsVisible();
    await postPage.title.expectVisible();
    await postPage.cardList.expectAddCardButtonVisible();
    await postPage.expectSelectTypeNotVisible();

    // リロードしてもCardビューが維持されること
    await page.reload();
    await postPage.expectBreadcrumbsVisible();
    await postPage.title.expectVisible();
    await postPage.cardList.expectAddCardButtonVisible();
    await postPage.expectSelectTypeNotVisible();

    await galleryPage.goto();
    await galleryPage.menu.expectVisible();
    await galleryPage.menu.deletePage(pageLink);
  });
});
