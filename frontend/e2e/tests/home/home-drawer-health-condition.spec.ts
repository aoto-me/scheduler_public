import { type Browser, expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';
import { fetchCsrfToken } from '../../utils/testUtils.js';

// テスト対象日（今月15日）
const now = new Date();
const TEST_DATE = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;

const HEALTH_MEMO = 'E2Eテスト用体調メモ';
const HEALTH_MEMO_UPDATED = 'E2Eテスト用体調メモ（更新済み）';

let createdHealthIds: number[] = [];

// 前回のテスト実行でTEST_DATEに残った体調記録をAPI経由で削除する
const cleanupLeftoverHealths = async (browser: Browser) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:5173', storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  const resp = await page.request.get(`/backend/api/health/?start=${TEST_DATE}&end=${TEST_DATE}`, {
    headers: { 'X-CSRF-Token': csrfToken },
  });
  if (resp.ok()) {
    const body = (await resp.json()) as { result: { health?: { id: number }[] } };
    const healths = body.result.health ?? [];
    for (const health of healths) {
      await page.request.delete(`/backend/api/health/${String(health.id)}/`, {
        headers: { 'X-CSRF-Token': csrfToken },
      });
    }
  }
  await context.close();
};

// テスト前後に作成した体調記録をAPI経由で削除する
const deleteHealthsForTest = async (browser: Browser) => {
  if (createdHealthIds.length === 0) return;
  const context = await browser.newContext({ baseURL: 'http://localhost:5173', storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  for (const id of createdHealthIds) {
    await page.request.delete(`/backend/api/health/${String(id)}/`, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  }
  await context.close();
  createdHealthIds = [];
};

test.describe('Homeページ > DrawerRight > Health > 体調', () => {
  let homePage: HomePage;

  test.beforeAll(async ({ browser }) => {
    try {
      await cleanupLeftoverHealths(browser);
      await deleteHealthsForTest(browser);
    } catch {
      // クリーンアップ失敗はテスト実行を止めない
    }
  });

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // goto より前にwaitForResponseを登録してHealthのGETをキャプチャする
    const healthLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/health') && resp.request().method() === 'GET'
    );
    await homePage.goto();
    await homePage.expectCalendarVisible();
    await healthLoaded;
    // 15日をクリックして currentDay を固定
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('health');
  });

  test.afterAll(async ({ browser }) => {
    try {
      await deleteHealthsForTest(browser);
    } catch {
      // クリーンアップ失敗は無視する
    }
  });

  test('登録がない場合「記録がありません」と表示される', async ({ page }) => {
    await expect(page.getByText('記録がありません')).toBeVisible();
  });

  test('「体調を記録」ボタンでHealthFormが表示される', async () => {
    await homePage.clickRecordHealthButton();
    await homePage.healthForm.expectDialogVisible();
  });

  test('全項目を入力して新規登録し、Drawerに反映される（リロード/DB反映を確認）', async ({ page }) => {
    const testOther = 'E2Eその他テスト';

    await homePage.clickRecordHealthButton();
    await homePage.healthForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/health') && resp.request().method() === 'PUT'
    );
    // 全項目を入力（症状カテゴリー・その他・調子・運動・メモ）
    const categoryName =
      (await homePage.healthForm.fillAndSubmit({
        checkFirstCategory: true,
        exercise: true,
        memo: HEALTH_MEMO,
        mental: 4,
        other: testOther,
      })) ?? '';
    const resp = await responsePromise;
    const { result } = (await resp.json()) as { result: { id: number } };
    createdHealthIds.push(result.id);

    await homePage.healthForm.expectDialogHidden();

    // DrawerRight の section にスコープを絞る（カレンダー上の同名要素と衝突させないため）
    const drawer = page.locator('section').filter({ has: page.getByRole('heading', { name: '選択日' }) });

    // 調子: ( 4 / 5 ) が表示される
    await expect(drawer.getByText('( 4 / 5 )')).toBeVisible({ timeout: 5000 });
    // 症状: 選択したカテゴリー名が Chip として表示される
    await expect(drawer.getByText(categoryName)).toBeVisible({ timeout: 5000 });
    // 症状: その他の入力内容も Chip として表示される
    await expect(drawer.getByText(testOther)).toBeVisible({ timeout: 5000 });
    // メモ: 入力したメモが表示される
    await expect(drawer.getByText(HEALTH_MEMO)).toBeVisible({ timeout: 5000 });
    // 運動: 「運動」ラベルが表示される
    await expect(drawer.getByText('運動')).toBeVisible({ timeout: 5000 });

    // リロード
    const healthLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/health') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await healthLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('health');
    // 記録ありの状態: 「体調を更新」ボタンが表示される
    await expect(page.getByRole('button', { name: '体調を更新' })).toBeVisible();
  });

  test('登録内容がカレンダーに反映される', async () => {
    // 前のテストで登録済みの記録がカレンダーに表示されることを確認
    const dateStr = await homePage.getCalendarDateStr(15);
    await homePage.expectCalendarEventVisible(dateStr);
  });

  test('バリデーション：メモが500文字超のとき「500文字以内で入力してください」エラー', async () => {
    await homePage.clickUpdateHealthButton();
    await homePage.healthForm.expectDialogVisible();
    await homePage.healthForm.fillAndSubmit({ memo: 'あ'.repeat(501) });
    await homePage.healthForm.expectFieldError('memo', '500文字以内で入力してください');
    await homePage.healthForm.close();
  });

  test('体調記録を編集できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.clickUpdateHealthButton();
    await homePage.healthForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/health') && resp.request().method() === 'PUT'
    );
    await homePage.healthForm.fillAndSubmit({ memo: HEALTH_MEMO_UPDATED });
    await responsePromise;

    await homePage.healthForm.expectDialogHidden();

    // リロード
    const healthLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/health') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await healthLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('health');
    await expect(page.getByText(HEALTH_MEMO_UPDATED)).toBeVisible();
  });

  test('体調記録を削除できる', async ({ page }) => {
    await homePage.clickUpdateHealthButton();
    await homePage.healthForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/health') && resp.request().method() === 'DELETE'
    );
    await homePage.healthForm.deleteHealthFromForm();
    await responsePromise;

    await homePage.expectNoHealthRecord();
  });
});
