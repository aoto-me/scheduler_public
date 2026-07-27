import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HomePage } from '../../pages/HomePage.js';

// リポジトリルートを取得
const REPO_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

// テスト前後に monthlyMemo レコードを全削除してクリーンな状態にする
const deleteMonthlyMemoForTest = () => {
  execSync('docker compose exec -T db mysql -u appUser -pexample mydb -e "DELETE FROM monthlyMemo;"', {
    cwd: REPO_ROOT,
    shell: 'cmd.exe',
  });
};

test.describe('Homeページ > 月間メモ', () => {
  let homePage: HomePage;

  test.beforeAll(() => {
    deleteMonthlyMemoForTest();
  });

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectCalendarVisible();
  });

  test.afterAll(() => {
    deleteMonthlyMemoForTest();
  });

  test('レコードなし時に「メモを追加」ボタンが表示される', async () => {
    await homePage.expectAddMemoButtonVisible();
  });

  test('「メモを追加」ボタンをクリックすると TextField が表示される', async () => {
    await homePage.clickAddMemoButton();
    await homePage.expectMonthlyMemoTextFieldVisible();
    await homePage.expectAddMemoButtonNotVisible();
  });

  test('メモを入力すると保存される（リロード/DB反映を確認）', async ({ page }) => {
    // 前テストで作成したレコードが存在するため TextField が表示されている
    await homePage.expectMonthlyMemoTextFieldVisible();

    const MEMO_TEXT = 'E2Eテスト用月間メモ';
    const patchResponse = page.waitForResponse(
      resp => resp.url().includes('/backend/api/monthlyMemo') && resp.request().method() === 'PATCH'
    );
    await page.locator('#monthlyMemo').fill(MEMO_TEXT);
    await patchResponse;

    await page.reload();
    await homePage.expectCalendarVisible();
    await expect(page.locator('#monthlyMemo')).toHaveValue(MEMO_TEXT);
  });

  test('レコードあり時に TextField が表示される', async () => {
    await homePage.expectMonthlyMemoTextFieldVisible();
  });

  test('空文字入力でエラーが発生しない', async ({ page }) => {
    await homePage.expectMonthlyMemoTextFieldVisible();
    await homePage.clearMonthlyMemoTextField();
    await page.waitForTimeout(1500);
    await homePage.expectMonthlyMemoTextFieldVisible();
    await page.getByText('5000文字以内で入力してください').waitFor({ state: 'hidden' });
  });
});
