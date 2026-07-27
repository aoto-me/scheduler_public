import { expect, test as setup } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const authFile = fileURLToPath(new URL('.auth/user.json', import.meta.url));

setup('認証処理', async ({ page }) => {
  await page.goto('/login');

  await page.locator('#userName').fill('test');
  await page.locator('#password').fill('test1234');
  await page.getByRole('button', { name: 'ログイン' }).click();

  await expect(page).toHaveURL('/');

  await page.context().storageState({ path: authFile });
});
