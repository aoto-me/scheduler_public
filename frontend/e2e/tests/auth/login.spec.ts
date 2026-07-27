import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LoginPage } from '../../pages/LoginPage.js';

// リポジトリルートを取得
const REPO_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

const E2E_USER = 'test';
const E2E_PASSWORD = 'test1234';
const WRONG_USER = 'wrongUser';
const WRONG_PASSWORD = 'wrongPassword';

// storageStateを使わず、ログインページ自体をテストする
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('ログイン', () => {
  test('正しいユーザー情報でログインするとホームへ遷移する', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(E2E_USER, E2E_PASSWORD);
    await loginPage.expectRedirectedToHome();
  });

  test('誤ったパスワードでエラーメッセージが表示される', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(E2E_USER, 'wrongPassword');
    await loginPage.expectErrorMessage('ユーザー名またはパスワードが不正です');
  });

  test('未入力のままログインするとエラーメッセージが表示される', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();
    await loginPage.expectErrorMessage('ユーザー名を入力してください');
    await loginPage.expectErrorMessage('パスワードを入力してください');
  });

  test('未認証状態でホームにアクセスするとログインページへリダイレクトされる', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('ログアウト', () => {
  test('ログアウトするとログインページへリダイレクトされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(E2E_USER, E2E_PASSWORD);
    await loginPage.expectRedirectedToHome();
    await loginPage.logout();
    await expect(page).toHaveURL('/login');
  });

  test('ログアウト後に認証が必要なページへアクセスするとログインページへリダイレクトされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(E2E_USER, E2E_PASSWORD);
    await loginPage.expectRedirectedToHome();
    await loginPage.logout();
    await expect(page).toHaveURL('/login');
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});

// IPロックのテストは他テストと並列実行しない（同一IPでカウントが競合するため）
const resetUserIP = () => {
  execSync('docker compose exec -T db mysql -u appUser -pexample mydb -e "UPDATE userIP SET count = 0;"', {
    cwd: REPO_ROOT,
    shell: 'cmd.exe',
  });
};

test.describe('IPロック', () => {
  test.beforeAll(() => {
    resetUserIP();
  });

  test.afterAll(() => {
    resetUserIP();
  });

  test('5回ログイン失敗するとIPがロックされる', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 5回失敗させる
    for (let i = 0; i < 5; i++) {
      await loginPage.goto();
      await loginPage.login(WRONG_USER, WRONG_PASSWORD);
      await loginPage.expectErrorMessage('ユーザー名またはパスワードが不正です');
    }

    // 6回目
    await loginPage.goto();
    await loginPage.login(WRONG_USER, WRONG_PASSWORD);
    await loginPage.expectErrorMessage('利用が制限されています');
  });
});
