import { test } from '@playwright/test';
import { PrivateModeSettingPage } from '../../pages/SettingPage.js';

/**
 * 前提
 * - OFFの状態からスタートして、終了後必ずOFFに戻す
 */
test.describe('Settingページ > プライベートモード', () => {
  let settingPage: PrivateModeSettingPage;

  test.beforeEach(async ({ page }) => {
    settingPage = new PrivateModeSettingPage(page);
    await settingPage.goto();
    await settingPage.expectLoaded();
    await settingPage.setPrivateMode(false);
    await settingPage.expectUnchecked();
  });

  test.afterEach(async () => {
    await settingPage.goto();
    await settingPage.setPrivateMode(false);
    await settingPage.expectUnchecked();
  });

  test('ONにできる', async () => {
    await settingPage.setPrivateMode(true);
    await settingPage.expectChecked();
  });

  test('ON：Moneyページがプライベートモード', async () => {
    await settingPage.setPrivateMode(true);
    await settingPage.expectChecked();
    await settingPage.goto('/money');
    await settingPage.expectPrivateModeMessageVisible();
  });

  test('ON：Healthページがプライベートモード', async () => {
    await settingPage.setPrivateMode(true);
    await settingPage.expectChecked();
    await settingPage.goto('/health');
    await settingPage.expectPrivateModeMessageVisible();
  });

  test('ON：リロード後も保持', async ({ page }) => {
    await settingPage.setPrivateMode(true);
    await settingPage.expectChecked();
    await page.reload();
    await settingPage.expectChecked();
  });

  test('OFF：通常表示に戻る', async () => {
    await settingPage.setPrivateMode(true);
    await settingPage.expectChecked();
    await settingPage.goto('/money');
    await settingPage.expectPrivateModeMessageVisible();
    await settingPage.goto();
    await settingPage.setPrivateMode(false);
    await settingPage.expectUnchecked();
    await settingPage.goto('/money');
    await settingPage.expectPrivateModeMessageNotVisible();
  });
});
