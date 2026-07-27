import { test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';

test.describe('Homeページ > カレンダー > フィルター切り替え', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectCalendarVisible();
    await homePage.expectFilterButtonsVisible();
  });

  test('fc-filter-buttons が表示される', async () => {
    await homePage.expectFilterButtonsVisible();
  });

  test('初期表示で ToDo フィルターがアクティブになっている', async () => {
    await homePage.expectFilterButtonActive('todo');
  });

  test('ToDo フィルターボタンをクリックするとアクティブになる', async () => {
    await homePage.clickFilterButton('todo');
    await homePage.expectFilterButtonActive('todo');
  });

  test('Money フィルターボタンをクリックするとアクティブになる', async () => {
    await homePage.clickFilterButton('money');
    await homePage.expectFilterButtonActive('money');
  });

  test('Health フィルターボタンをクリックするとアクティブになる', async () => {
    await homePage.clickFilterButton('health');
    await homePage.expectFilterButtonActive('health');
  });

  test('Diary フィルターボタンをクリックするとアクティブになる', async () => {
    await homePage.clickFilterButton('diary');
    await homePage.expectFilterButtonActive('diary');
  });
});

test.describe('Homeページ > カレンダー > 今日ボタン', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectCalendarVisible();
  });

  test('前月に移動すると「今日」ボタンが有効になる', async () => {
    await homePage.expectTodayButtonDisabled();
    await homePage.clickPrevMonth();
    await homePage.expectTodayButtonEnabled();
  });

  test('「今日」ボタンをクリックすると当月に戻る', async ({ page }) => {
    await homePage.clickPrevMonth();
    await homePage.clickTodayButton();
    const now = new Date();
    const expectedTitle = `${String(now.getFullYear())}年${String(now.getMonth() + 1)}月`;
    await page.locator('.fc-toolbar-title').filter({ hasText: expectedTitle }).waitFor({ timeout: 5000 });
  });

  test('「今日」ボタンクリック後、DrawerRight の選択日が当日になる', async () => {
    await homePage.clickPrevMonth();
    await homePage.clickTodayButton();
    const todayDay = new Date().getDate();
    await homePage.expectDrawerRightDateContains(`${String(todayDay)}日`);
  });
});
