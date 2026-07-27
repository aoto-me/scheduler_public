import { test as base, type Browser } from '@playwright/test';
import { DrawerMenu } from '../components/DrawerMenu.js';
import { GalleryCardDetailPage } from '../pages/GalleryCardDetailPage.js';
import { GalleryPage } from '../pages/GalleryPage.js';
import { GalleryPostPage } from '../pages/GalleryPostPage.js';

type GalleryType = 'card' | 'img';

// ギャラリーページ（imgタイプまたはcardタイプ）を1つ作成し、そのURL（/gallery/:id）を返す
const setupGalleryPost = async (browser: Browser, baseURL: string, type: GalleryType): Promise<string> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto('/gallery');
  const menu = new DrawerMenu(page, 'ギャラリー一覧');
  await menu.expectVisible();
  const link = await menu.addPage();
  const href = await link.getAttribute('href');
  if (!href) throw new Error('新規ギャラリーページのhrefが取得できません');

  await page.goto(href);
  const postPage = new GalleryPostPage(page);
  await postPage.expectSelectTypeVisible();
  if (type === 'img') {
    await postPage.clickImgTypeButton();
    await postPage.imageGrid.expectVisible();
  } else {
    await postPage.clickCardTypeButton();
    await postPage.cardList.expectAddCardButtonVisible();
  }

  await context.close();
  return href;
};

// setupGalleryPostで作ったギャラリーページを削除する後処理
const teardownGalleryPost = async (browser: Browser, url: string, baseURL: string): Promise<void> => {
  if (!url) return;
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto('/gallery');
  const menu = new DrawerMenu(page, 'ギャラリー一覧');
  await menu.expectVisible();
  await menu.deletePage(page.locator(`a[href="${url}"]`));
  await context.close();
};

// cardタイプのギャラリーページにカードを1枚追加し、カード詳細ページのURL（/gallery/:id/:cardId）を返す
const setupGalleryCardDetail = async (browser: Browser, baseURL: string, cardPostUrl: string): Promise<string> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto(cardPostUrl);
  const postPage = new GalleryPostPage(page);
  await postPage.cardList.expectAddCardButtonVisible();
  await postPage.cardList.addCard();
  await postPage.cardList.clickFirstCard();
  await page.waitForURL(/\/gallery\/[^/]+\/\d+/);
  const cardDetailUrl = new URL(page.url()).pathname;
  await context.close();
  return cardDetailUrl;
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    galleryCardDetailPage: GalleryCardDetailPage;
    galleryCardPostPage: GalleryPostPage;
    galleryImgPostPage: GalleryPostPage;
    galleryPage: GalleryPage;
  },
  {
    galleryCardDetailPostUrl: string; // card-detail専用のギャラリーページURL（card-listと共有しない）
    galleryCardDetailUrl: string;
    galleryCardPostUrl: string;
    galleryImgPostUrl: string;
  }
>({
  galleryCardDetailPage: async ({ galleryCardDetailUrl, page }, use) => {
    await page.goto(galleryCardDetailUrl);
    const cardDetailPage = new GalleryCardDetailPage(page);
    await cardDetailPage.slider.expectVisible();
    await use(cardDetailPage);
  },

  // card-detail専用ページ（galleryCardPostUrl とは別ページ）のURL
  galleryCardDetailPostUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupGalleryPost(browser, baseURL, 'card');
      await use(url);
      await teardownGalleryPost(browser, url, baseURL);
    },
    { scope: 'worker' },
  ],

  galleryCardDetailUrl: [
    async ({ browser, galleryCardDetailPostUrl }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupGalleryCardDetail(browser, baseURL, galleryCardDetailPostUrl);
      await use(url);
      // teardownはgalleryCardDetailPostUrlのteardownに委譲
    },
    { scope: 'worker' },
  ],

  galleryCardPostPage: async ({ galleryCardPostUrl, page }, use) => {
    await page.goto(galleryCardPostUrl);
    const postPage = new GalleryPostPage(page);
    await postPage.cardList.expectAddCardButtonVisible();
    await use(postPage);
  },

  galleryCardPostUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupGalleryPost(browser, baseURL, 'card');
      await use(url);
      await teardownGalleryPost(browser, url, baseURL);
    },
    { scope: 'worker' },
  ],

  galleryImgPostPage: async ({ galleryImgPostUrl, page }, use) => {
    await page.goto(galleryImgPostUrl);
    const postPage = new GalleryPostPage(page);
    await postPage.imageGrid.expectVisible();
    await use(postPage);
  },

  galleryImgPostUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      const url = await setupGalleryPost(browser, baseURL, 'img');
      await use(url);
      await teardownGalleryPost(browser, url, baseURL);
    },
    { scope: 'worker' },
  ],

  galleryPage: async ({ page }, use) => {
    const galleryPage = new GalleryPage(page);
    await galleryPage.goto();
    await galleryPage.menu.expectVisible();
    await use(galleryPage);
  },
});
