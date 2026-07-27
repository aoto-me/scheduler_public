import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';

const DIARY_TITLE = 'E2Eテスト用日記';

/**
 * 前提：
 * 「E2Eテスト用日記」を当月の1日に登録しておく
 */
test.describe('Homeページ > DrawerRight > Diary', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // gotoより前にwaitForResponseを登録してDiaryのGETをキャプチャする
    const diaryLoaded = page.waitForResponse(
      resp =>
        resp.url().includes('/backend/api/diary') && !resp.url().includes('/item/') && resp.request().method() === 'GET'
    );
    await homePage.goto();
    await homePage.expectCalendarVisible();
    await diaryLoaded;
  });

  test('日記がない場合「日記を書く」ボタンが表示される', async ({ page }) => {
    // 15日（日記未登録）
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('diary');
    await expect(page.getByRole('button', { name: '日記を書く' })).toBeVisible();
  });

  test('「日記を書く」ボタンをクリックで Diary 一覧ページへ遷移する', async ({ page }) => {
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('diary');
    await homePage.clickWriteDiaryButton();
    await expect(page).toHaveURL(/\/gallery\/diary\?date=\d{4}-\d{2}/);
  });

  test('日記がある場合、内容と「日記を編集」ボタンが表示される', async ({ page }) => {
    // 1日（事前登録済み）: diary content API も待機
    const contentLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/diary/item/') && resp.request().method() === 'GET'
    );
    await homePage.clickDate(1);
    await contentLoaded;
    await homePage.clickFilterButton('diary');
    await homePage.expectDrawerRightDateContains('月1日');

    // タイトル（h3）・コンテンツエリア（.noEditable）・編集ボタンの表示確認
    await homePage.expectDiaryTitleVisible(DIARY_TITLE);
    await expect(page.locator('.noEditable')).toBeVisible();
    await expect(page.getByRole('button', { name: '日記を編集' })).toBeVisible();
  });

  test('「日記を編集」ボタンをクリックで該当日記のページへ遷移する', async ({ page }) => {
    const contentLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/diary/item/') && resp.request().method() === 'GET'
    );
    await homePage.clickDate(1);
    await contentLoaded;
    await homePage.clickFilterButton('diary');
    await homePage.expectDrawerRightDateContains('月1日');
    await homePage.clickEditDiaryButton();
    await expect(page).toHaveURL(/\/gallery\/diary\/\d+\?date=\d{4}-\d{2}/);
  });
});
