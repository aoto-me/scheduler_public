import { type Browser, expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';
import { fetchCsrfToken } from '../../utils/testUtils.js';

const FOOD_NAME = 'E2Eテスト用食事記録';
const FOOD_NAME_UPDATED = 'E2Eテスト用食事記録（更新済み）';
const FOOD_NAME_SUMMARY = 'E2Eテスト用食事記録（栄養合計確認用）';

const TEST_NAMES = new Set([FOOD_NAME, FOOD_NAME_SUMMARY, FOOD_NAME_UPDATED]);

let createdFoodIds: number[] = [];

// 前回のテスト実行で残った食事記録をAPI経由で削除する
const cleanupLeftoverFoods = async (browser: Browser, baseURL: string) => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  // start/end クエリパラメータを広めの範囲を指定して全件取得する
  const resp = await page.request.get('/backend/api/food/?start=2020-01-01&end=2099-12-31', {
    headers: { 'X-CSRF-Token': csrfToken },
  });
  if (resp.ok()) {
    const body = (await resp.json()) as { result?: { id: number; name: string }[] };
    const foods = body.result ?? [];
    for (const food of foods) {
      if (TEST_NAMES.has(food.name)) {
        await page.request.delete(`/backend/api/food/${String(food.id)}/`, {
          headers: { 'X-CSRF-Token': csrfToken },
        });
      }
    }
  }
  await context.close();
};

// テスト前後に作成した食事記録をAPI経由で削除する
const deleteFoodsForTest = async (browser: Browser, baseURL: string) => {
  if (createdFoodIds.length === 0) return;
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  for (const id of createdFoodIds) {
    await page.request.delete(`/backend/api/food/${String(id)}/`, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  }
  await context.close();
  createdFoodIds = [];
};

test.describe('Homeページ > DrawerRight > Health > 食事記録', () => {
  let homePage: HomePage;

  test.beforeAll(async ({ browser }, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL ?? '';
    try {
      await cleanupLeftoverFoods(browser, baseURL);
      await deleteFoodsForTest(browser, baseURL);
    } catch {
      // クリーンアップに失敗してもテストを止めない
    }
  });

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // gotoより前にwaitForResponseを登録してFoodのGETをキャプチャする
    const foodLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'GET'
    );
    await homePage.goto();
    await homePage.expectCalendarVisible();
    await foodLoaded;
    // 15日をクリックして currentDay を固定
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('health');
  });

  test.afterAll(async ({ browser }, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL ?? '';
    try {
      await deleteFoodsForTest(browser, baseURL);
    } catch {
      // クリーンアップ失敗は無視する
    }
  });

  test('「食事記録を追加」ボタンでFoodFormが表示される', async () => {
    await homePage.clickAddFoodButton();
    await homePage.foodForm.expectDialogVisible();
  });

  test('食事記録を新規登録できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.clickAddFoodButton();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'PUT'
    );
    await homePage.foodForm.fillAndSubmit({ energy: '500', name: FOOD_NAME, quantity: '100' });
    const resp = await responsePromise;
    const { result } = (await resp.json()) as { result: number };
    createdFoodIds.push(result);

    await homePage.foodForm.expectDialogHidden();

    const foodLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await foodLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('health');
    await homePage.expectFoodCardVisible(FOOD_NAME);
  });

  test('登録内容がカレンダーに反映される', async () => {
    // 前テストで登録済みのレコードがカレンダーに表示されることを確認
    const dateStr = await homePage.getCalendarDateStr(15);
    await homePage.expectCalendarEventVisible(dateStr);
  });

  test('登録した熱量がチャート下の栄養素合計に反映される', async ({ page }) => {
    const drawer = page.locator('section').filter({ has: page.getByRole('heading', { name: '選択日' }) });
    const energyLocator = drawer.locator(String.raw`text=/\d+ \/ \d+ kcal/`);

    // 登録前の熱量合計テキストを取得
    const energyBefore = await energyLocator.textContent();

    // 食事記録を追加（専用名で後続テストと衝突しないようにする）
    await homePage.clickAddFoodButton();
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'PUT'
    );
    await homePage.foodForm.fillAndSubmit({ energy: '400', name: FOOD_NAME_SUMMARY, quantity: '100' });
    await responsePromise;

    await homePage.foodForm.expectDialogHidden();

    // 登録後に熱量合計が変化していることを確認
    const energyAfter = await energyLocator.textContent();
    expect(energyAfter).not.toBe(energyBefore);

    // cleanup（後続テストのカード数に影響させない）
    const deletePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'DELETE'
    );
    await homePage.clickFoodCard(FOOD_NAME_SUMMARY);
    await homePage.foodForm.expectDialogVisible();
    await homePage.foodForm.deleteFoodFromForm();
    await deletePromise;
  });

  test('FoodカードをクリックするとFoodFormが表示される', async () => {
    await homePage.expectFoodCardVisible(FOOD_NAME);
    await homePage.clickFoodCard(FOOD_NAME);
    await homePage.foodForm.expectDialogVisible();
  });

  test('バリデーション：名称が空のとき「内容を入力してください」エラー', async () => {
    await homePage.clickAddFoodButton();
    await homePage.foodForm.fillAndSubmit({ energy: '500', quantity: '100' });
    await homePage.foodForm.expectFieldError('name', '内容を入力してください');
    await homePage.foodForm.close();
  });

  test('バリデーション：量が空のとき「量を入力してください」エラー', async () => {
    await homePage.clickAddFoodButton();
    await homePage.foodForm.fillAndSubmit({ energy: '500', name: 'テスト' });
    await homePage.foodForm.expectFieldError('quantity', '量を入力してください');
    await homePage.foodForm.close();
  });

  test('バリデーション：熱量が空のとき「熱量を入力してください」エラー', async () => {
    await homePage.clickAddFoodButton();
    await homePage.foodForm.fillAndSubmit({ name: 'テスト', quantity: '100' });
    await homePage.foodForm.expectFieldError('energy', '熱量を入力してください');
    await homePage.foodForm.close();
  });

  test('Autocomplete で候補が表示される', async ({ page }) => {
    await homePage.clickAddFoodButton();
    // 前提: SettingページのFoodDBに1件以上登録済み
    await homePage.foodForm.fillFoodName('あ');
    // disablePortal が設定されているので listbox は dialog 内 DOM に描画される
    await expect(page.getByRole('dialog').getByRole('listbox')).toBeVisible();
    await homePage.foodForm.close();
  });

  test('Autocomplete から選択後、データベースから自動入力される', async ({ page }) => {
    await homePage.clickAddFoodButton();
    // 前提: SettingページのFoodDBに1件以上登録済み
    await homePage.foodForm.fillFoodName('あ');
    const listbox = page.getByRole('dialog').getByRole('listbox');
    await listbox.waitFor({ state: 'visible' });
    await listbox.getByRole('option').first().click();

    await homePage.foodForm.fillFoodQuantity('100');
    await homePage.foodForm.clickAutoFill();

    const energyValue = await page.getByRole('dialog').locator('#energy').inputValue();
    expect(Number(energyValue)).toBeGreaterThan(0);
    await homePage.foodForm.close();
  });

  test('食事記録を編集できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.expectFoodCardVisible(FOOD_NAME);
    await homePage.clickFoodCard(FOOD_NAME);
    await homePage.foodForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'PUT'
    );
    await homePage.foodForm.fillAndSubmit({ name: FOOD_NAME_UPDATED });
    await responsePromise;

    await homePage.foodForm.expectDialogHidden();

    const foodLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await foodLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('health');
    await homePage.expectFoodCardVisible(FOOD_NAME_UPDATED);
  });

  test('食事記録を削除できる', async ({ page }) => {
    await homePage.expectFoodCardVisible(FOOD_NAME_UPDATED);
    await homePage.clickFoodCard(FOOD_NAME_UPDATED);
    await homePage.foodForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/food') && resp.request().method() === 'DELETE'
    );
    await homePage.foodForm.deleteFoodFromForm();
    await responsePromise;

    await homePage.expectFoodCardNotVisible(FOOD_NAME_UPDATED);
  });
});
