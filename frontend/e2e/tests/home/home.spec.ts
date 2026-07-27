import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';

test.describe('Homeページ', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('ホームページが表示される', async ({ page }) => {
    await expect(page).toHaveURL('/');
  });

  test('カレンダーが表示される', async () => {
    await homePage.expectCalendarVisible();
  });

  test('月次メモエリアが表示される', async () => {
    await homePage.expectMonthlyMemoAreaVisible();
  });

  test('日付をクリックするとDrawerRightに選択日が表示される', async () => {
    await homePage.expectCalendarVisible();
    await homePage.clickDate(10);
    await homePage.expectDrawerRightDateContains('10日');
  });

  test('前月ボタンで月が変わる', async () => {
    await homePage.expectCalendarVisible();

    const beforeTitle = await homePage.getCalendarTitleText();
    await homePage.clickPrevMonth();
    const afterTitle = await homePage.getCalendarTitleText();

    expect(afterTitle).not.toBe(beforeTitle);
  });

  test('翌月ボタンで月が変わる', async () => {
    await homePage.expectCalendarVisible();

    const beforeTitle = await homePage.getCalendarTitleText();
    await homePage.clickNextMonth();
    const afterTitle = await homePage.getCalendarTitleText();

    expect(afterTitle).not.toBe(beforeTitle);
  });
});
