import { expect, test } from '@playwright/test';
import { DrawerMenu } from '../../components/DrawerMenu.js';

test.describe('Diaryページ > Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery');
  });

  test('GalleryドロワーにDiaryリンクが表示されている', async ({ page }) => {
    const menuDrawer = new DrawerMenu(page, 'ギャラリー一覧');
    await menuDrawer.expectVisible();
    await menuDrawer.expectDiaryLinkVisible();
  });

  test('Diaryリンクをクリックすると /gallery/diary へ遷移する', async ({ page }) => {
    const menuDrawer = new DrawerMenu(page, 'ギャラリー一覧');
    await menuDrawer.expectVisible();
    await page.getByRole('navigation', { name: 'ギャラリー一覧' }).getByRole('link', { name: 'Diary' }).click();
    await expect(page).toHaveURL(/\/gallery\/diary$/);
  });
});
