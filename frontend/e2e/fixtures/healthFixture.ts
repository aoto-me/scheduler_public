import { test as base, type Browser, expect } from '@playwright/test';
import { format } from 'date-fns';
import { HealthPage } from '../pages/HealthPage.js';

// フィクスチャ用体調記録（20日固定）
const FIXTURE_HEALTH_DAY = 20;
export const FIXTURE_HEALTH_DISPLAY = `${format(new Date(), 'yyyy/M')}/${String(FIXTURE_HEALTH_DAY)}`;
export const FIXTURE_HEALTH_MEMO = 'E2Eフィクスチャ用メモ';

// フィクスチャ用食事記録
export const FIXTURE_FOOD_NAME = 'E2Eフィクスチャ用食事記録';

// FIXTURE_HEALTH_DISPLAY に一致する体調記録を削除する
const deleteAllHealthFixtureRecords = async (health: HealthPage): Promise<void> => {
  const row = health.health.grid.getByRole('row').filter({ hasText: FIXTURE_HEALTH_DISPLAY });
  if ((await row.count()) > 0) {
    await health.health.deleteFromTable(FIXTURE_HEALTH_DISPLAY);
    await expect(row).toHaveCount(0, { timeout: 5000 });
  }
};

// FIXTURE_FOOD_NAME に一致する食事記録をすべて削除する
// 食事記録は同名が複数存在できるため、ループで全削除する
const deleteAllFoodFixtureRecords = async (health: HealthPage): Promise<void> => {
  const rows = health.food.grid.getByRole('row').filter({ hasText: FIXTURE_FOOD_NAME });
  while ((await rows.count()) > 0) {
    const countBefore = await rows.count();
    await health.food.deleteFromTable(FIXTURE_FOOD_NAME);
    await expect(rows).toHaveCount(countBefore - 1, { timeout: 5000 });
  }
};

// テスト用体調記録を1件作成する（20日・mental=3・フィクスチャ用メモ）
// 日付が重複で登録できないため、前回テストデータの残留に注意
const setupHealthRecord = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const health = new HealthPage(page);
  await health.goto();
  await health.food.expectTableVisible();
  await deleteAllHealthFixtureRecords(health);
  await health.addHealthRecord(FIXTURE_HEALTH_DAY, 3, { memo: FIXTURE_HEALTH_MEMO });
  await context.close();
};

// setupHealthRecordで追加した体調記録を削除する
const teardownHealthRecord = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const health = new HealthPage(page);
  await health.goto();
  await health.food.expectTableVisible();
  await deleteAllHealthFixtureRecords(health);
  await context.close();
};

// テスト用食事記録を1件作成する（FIXTURE_FOOD_NAME・100g・500kcal）
const setupFoodRecord = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const health = new HealthPage(page);
  await health.goto();
  await health.food.expectTableVisible();
  await deleteAllFoodFixtureRecords(health);
  await health.addFoodRecord(FIXTURE_FOOD_NAME, '100', '500');
  await context.close();
};

// setupFoodRecordで追加した食事記録をすべて削除する
const teardownFoodRecord = async (browser: Browser, baseURL: string): Promise<void> => {
  const context = await browser.newContext({ baseURL, storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const health = new HealthPage(page);
  await health.goto();
  await health.food.expectTableVisible();
  await deleteAllFoodFixtureRecords(health);
  await context.close();
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<
  {
    foodRecordPage: HealthPage;
    healthPage: HealthPage;
    healthRecordPage: HealthPage;
  },
  {
    foodRecord: boolean;
    healthRecord: boolean;
  }
>({
  foodRecord: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      await setupFoodRecord(browser, baseURL);
      await use(true);
      await teardownFoodRecord(browser, baseURL);
    },
    { scope: 'worker' },
  ],

  // 食事記録（FIXTURE_FOOD_NAME）が1件追加済みの HealthPage を返す
  foodRecordPage: async ({ foodRecord: _foodRecord, page }, use) => {
    const health = new HealthPage(page);
    await health.goto();
    await health.food.expectTableVisible();
    await health.food.expectRowVisible(FIXTURE_FOOD_NAME);
    await use(health);
  },

  // 当月データ0件の状態で HealthPage を返す
  healthPage: async ({ page }, use) => {
    const health = new HealthPage(page);
    await health.goto();
    await expect(page).toHaveURL('/health');
    await health.food.expectTableVisible();
    await use(health);
  },

  healthRecord: [
    async ({ browser }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL ?? '';
      await setupHealthRecord(browser, baseURL);
      await use(true);
      await teardownHealthRecord(browser, baseURL);
    },
    { scope: 'worker' },
  ],

  // 体調記録（FIXTURE_HEALTH_DISPLAY）が1件追加済みの HealthPage を返す
  healthRecordPage: async ({ healthRecord: _healthRecord, page }, use) => {
    const health = new HealthPage(page);
    await health.goto();
    await health.health.expectTableVisible();
    await health.health.expectRowVisible(FIXTURE_HEALTH_DISPLAY);
    await use(health);
  },
});
