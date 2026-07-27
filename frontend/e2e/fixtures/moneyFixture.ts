import { test as base, type Browser, expect } from '@playwright/test';
import { MoneyPage } from '../pages/MoneyPage.js';

export const FIXTURE_CONTENT = 'E2Eフィクスチャ用レコード';

// FIXTURE_CONTENT に一致する行をすべて削除する
// 複数行ある場合（前回テストのteardown失敗）も繰り返し削除する
const deleteAllFixtureRecords = async (money: MoneyPage): Promise<void> => {
  const rows = money.dataGrid.grid.getByRole('row').filter({ hasText: FIXTURE_CONTENT });
  while ((await rows.count()) > 0) {
    const countBefore = await rows.count();
    await money.dataGrid.deleteFromTable(FIXTURE_CONTENT);
    await expect(rows).toHaveCount(countBefore - 1, { timeout: 5000 });
  }
};

// テスト用の収支レコードを1件追加する
const setupMoneyRecord = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const money = new MoneyPage(page);
  await money.goto();
  await money.dataGrid.expectTableVisible();
  // 前回の実行のデータを削除してからレコードを1件追加する
  await deleteAllFixtureRecords(money);
  await money.clickAddMoneyButton();
  await money.moneyForm.expectDialogVisible();
  await money.moneyForm.fillAndSubmit({ amount: 1000, category: 1, content: FIXTURE_CONTENT });
  await money.dataGrid.expectRowVisible(FIXTURE_CONTENT);
  await context.close();
};

// setupMoneyRecord で追加したレコードをすべて削除する
const teardownMoneyRecord = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const money = new MoneyPage(page);
  await money.goto();
  await money.dataGrid.expectTableVisible();
  await deleteAllFixtureRecords(money);
  await context.close();
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    moneyPage: MoneyPage;
    moneyRecordPage: MoneyPage;
  },
  {
    moneyRecord: boolean;
  }
>({
  // 当月データ0件の状態で MoneyPage を返す
  moneyPage: async ({ page }, use) => {
    const money = new MoneyPage(page);
    await money.goto();
    await expect(page).toHaveURL('/money');
    await money.dataGrid.expectTableVisible();
    await use(money);
  },

  moneyRecord: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      await setupMoneyRecord(browser, baseURL);
      await use(true);
      await teardownMoneyRecord(browser, baseURL);
    },
    { scope: 'worker' },
  ],

  // fixtureレコード（FIXTURE_CONTENT）が1件追加済みの MoneyPage を返す
  moneyRecordPage: async ({ moneyRecord: _moneyRecord, page }, use) => {
    const money = new MoneyPage(page);
    await money.goto();
    await money.dataGrid.expectTableVisible();
    await money.dataGrid.expectRowVisible(FIXTURE_CONTENT);
    await use(money);
  },
});
