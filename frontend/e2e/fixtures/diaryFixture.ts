import { test as base, type Browser } from '@playwright/test';
import { DiaryCardList } from '../components/DiaryCardList.js';
import { DiaryCardDetailPage } from '../pages/DiaryCardDetailPage.js';

// 各月1日はHomeカレンダーテスト用の既存データのため使用禁止
const TEST_DATE = '2000-01-02';
const DIARY_LIST_URL = '/gallery/diary?date=2000-01';

// Diaryカードを1枚作成し、カード詳細ページのURLを返す
const setupDiaryCardDetail = async (browser: Browser, baseURL: string): Promise<string> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto(DIARY_LIST_URL);

  const cardList = new DiaryCardList(page);
  await cardList.expectAddCardButtonVisible();
  await cardList.addCard(TEST_DATE);

  const [y, m, d] = TEST_DATE.split('-');
  await cardList.clickCardByDate(`${y}/${m}/${d}`);
  await page.waitForURL(/\/gallery\/diary\/\d+/);

  // ?date=2000-01 で直接アクセス
  const url = new URL(page.url());
  url.searchParams.set('date', '2000-01');
  const cardDetailUrl = url.toString();

  const detail = new DiaryCardDetailPage(page);
  await detail.slider.expectVisible();

  await context.close();
  return cardDetailUrl;
};

// テスト用Diaryカードを削除する後処理（重複登録不可のため最大1枚）
const teardownDiaryCard = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();

  const [y, m, d] = TEST_DATE.split('-');
  const formattedDate = `${y}/${m}/${d}`;

  await page.goto(DIARY_LIST_URL);

  try {
    await page.getByRole('group', { name: '月選択' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'カードを追加' }).waitFor({ state: 'visible' });
  } catch {
    await context.close();
    return;
  }

  const targetCard = page.locator('[data-testid="diary-card-item"]').filter({ hasText: formattedDate }).first();
  if (!(await targetCard.isVisible())) {
    await context.close();
    return;
  }

  await targetCard.click();
  await page.waitForURL(/\/gallery\/diary\/\d+/);
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'カードの削除' }).click();
  await page.waitForURL(/\/gallery\/diary/);

  await context.close();
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    diaryCardDetailPage: DiaryCardDetailPage;
  },
  {
    diaryCardDetailUrl: string;
    diaryCardListUrl: string;
  }
>({
  diaryCardDetailPage: async ({ diaryCardDetailUrl, page }, use) => {
    await page.goto(diaryCardDetailUrl);
    const cardDetailPage = new DiaryCardDetailPage(page);
    await cardDetailPage.slider.expectVisible();
    await use(cardDetailPage);
  },

  diaryCardDetailUrl: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      await teardownDiaryCard(browser, baseURL);
      const url = await setupDiaryCardDetail(browser, baseURL);
      await use(url);
      await teardownDiaryCard(browser, baseURL);
    },
    { scope: 'worker' },
  ],

  diaryCardListUrl: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(DIARY_LIST_URL);
    },
    { scope: 'worker' },
  ],
});
