import { type Browser, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';
import { fetchCsrfToken } from '../../utils/testUtils.js';

const MONEY_CONTENT = 'E2Eテスト用収支';
const MONEY_CONTENT_UPDATED = 'E2Eテスト用収支（更新済み）';

const TEST_CONTENTS = new Set([MONEY_CONTENT, MONEY_CONTENT_UPDATED]);

let createdMoneyIds: number[] = [];

// 前回のテスト実行で残ったMoneyをAPI経由で削除する
const cleanupLeftoverMoneys = async (browser: Browser, baseURL: string) => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  // start/end クエリパラメータを広めの範囲を指定して全件取得する
  const resp = await page.request.get('/backend/api/money/?start=2020-01-01&end=2099-12-31', {
    headers: { 'X-CSRF-Token': csrfToken },
  });
  if (resp.ok()) {
    const body = (await resp.json()) as { result?: { content: string; id: number }[] };
    const moneys = body.result ?? [];
    for (const money of moneys) {
      if (TEST_CONTENTS.has(money.content)) {
        await page.request.delete(`/backend/api/money/${String(money.id)}/`, {
          headers: { 'X-CSRF-Token': csrfToken },
        });
      }
    }
  }
  await context.close();
};

// テスト前後に作成したMoneyをAPI経由で削除する
const deleteMoneyForTest = async (browser: Browser, baseURL: string) => {
  if (createdMoneyIds.length === 0) return;
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  for (const id of createdMoneyIds) {
    await page.request.delete(`/backend/api/money/${String(id)}/`, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  }
  await context.close();
  createdMoneyIds = [];
};

test.describe('Homeページ > DrawerRight > Money', () => {
  let homePage: HomePage;

  test.beforeAll(async ({ browser }, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL ?? '';
    try {
      await cleanupLeftoverMoneys(browser, baseURL);
      await deleteMoneyForTest(browser, baseURL);
    } catch {
      // クリーンアップ失敗はテスト実行を止めない
    }
  });

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // gotoより前にwaitForResponseを登録してMoneyのGETをキャプチャする
    const moneyLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/money') && resp.request().method() === 'GET'
    );
    await homePage.goto();
    await homePage.expectCalendarVisible();
    await moneyLoaded;
    // 15日をクリックして currentDay を固定
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('money');
  });

  test.afterAll(async ({ browser }, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL ?? '';
    try {
      await deleteMoneyForTest(browser, baseURL);
    } catch {
      // クリーンアップ失敗は無視する
    }
  });

  test('「収支を追加」ボタンでMoneyFormが表示される', async () => {
    await homePage.clickAddMoneyButton();
    await homePage.moneyForm.expectDialogVisible();
  });

  test('収支データを新規登録できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.clickAddMoneyButton();
    await homePage.moneyForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/money') && resp.request().method() === 'PUT'
    );
    await homePage.moneyForm.fillAndSubmit({ amount: 1000, category: 1, content: MONEY_CONTENT });
    const resp = await responsePromise;
    const { result: createdMoneyId } = (await resp.json()) as { result: number };
    createdMoneyIds.push(createdMoneyId);

    await homePage.moneyForm.expectDialogHidden();

    const moneyLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/money') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await moneyLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('money');
    await homePage.expectMoneyCardVisible(MONEY_CONTENT);
  });

  test('登録内容がカレンダーに反映される', async () => {
    // 前テストで登録済みのレコードがカレンダーに表示されることを確認
    const dateStr = await homePage.getCalendarDateStr(15);
    await homePage.expectCalendarEventVisible(dateStr);
  });

  test('Moneyカードをクリックするとフォームが表示される', async () => {
    await homePage.expectMoneyCardVisible(MONEY_CONTENT);
    await homePage.clickMoneyCard(MONEY_CONTENT);
    await homePage.moneyForm.expectDialogVisible();
  });

  test('バリデーション：金額が空のとき「金額を入力してください」エラー', async () => {
    await homePage.clickAddMoneyButton();
    await homePage.moneyForm.expectDialogVisible();
    await homePage.moneyForm.fillAndSubmit({ category: 1, content: 'テスト' });
    await homePage.moneyForm.expectFieldError('amount', '金額を入力してください');
    await homePage.moneyForm.closeDialog();
  });

  test('バリデーション：カテゴリーが未選択のとき「カテゴリーを選択してください」エラー', async () => {
    await homePage.clickAddMoneyButton();
    await homePage.moneyForm.expectDialogVisible();
    await homePage.moneyForm.fillAndSubmit({ amount: 100, content: 'テスト' });
    await homePage.moneyForm.expectFieldError('category', 'カテゴリーを選択してください');
    await homePage.moneyForm.closeDialog();
  });

  test('バリデーション：内容が空のとき「内容を入力してください」エラー', async () => {
    await homePage.clickAddMoneyButton();
    await homePage.moneyForm.expectDialogVisible();
    await homePage.moneyForm.fillAndSubmit({ amount: 100, category: 1 });
    await homePage.moneyForm.expectFieldError('content', '内容を入力してください');
    await homePage.moneyForm.closeDialog();
  });

  test('バリデーション：日付が空のとき「日付を選択してください」エラー', async () => {
    await homePage.clickAddMoneyButton();
    await homePage.moneyForm.expectDialogVisible();
    await homePage.moneyForm.fillAndSubmit({ amount: 100, category: 1, clearDate: true, content: 'テスト' });
    await homePage.moneyForm.expectFieldError('date', '日付を選択してください');
    await homePage.moneyForm.closeDialog();
  });

  test('収支データを編集できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.expectMoneyCardVisible(MONEY_CONTENT);
    await homePage.clickMoneyCard(MONEY_CONTENT);
    await homePage.moneyForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/money') && resp.request().method() === 'PUT'
    );
    await homePage.moneyForm.fillAndSubmit({ content: MONEY_CONTENT_UPDATED });
    await responsePromise;

    await homePage.moneyForm.expectDialogHidden();

    const moneyLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/money') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await moneyLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.clickFilterButton('money');
    await homePage.expectMoneyCardVisible(MONEY_CONTENT_UPDATED);
  });

  test('収支データを削除できる', async ({ page }) => {
    await homePage.expectMoneyCardVisible(MONEY_CONTENT_UPDATED);
    await homePage.clickMoneyCard(MONEY_CONTENT_UPDATED);
    await homePage.moneyForm.expectDialogVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/backend/api/money') && resp.request().method() === 'DELETE'
    );
    await homePage.moneyForm.deleteFromForm();
    await responsePromise;

    await homePage.moneyForm.expectDialogHidden();
    await homePage.expectMoneyCardNotVisible(MONEY_CONTENT_UPDATED);
  });
});
