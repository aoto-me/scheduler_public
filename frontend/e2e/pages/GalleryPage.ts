import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { DrawerLeft } from '../components/DrawerLeft.js';
import { DrawerMenu } from '../components/DrawerMenu.js';
import { toggleDrawerByShortcut as toggleDrawer } from '../utils/testUtils.js';

export class GalleryPage {
  readonly drawer: DrawerLeft;
  readonly menu: DrawerMenu;

  constructor(private readonly page: Page) {
    this.drawer = new DrawerLeft(page);
    this.menu = new DrawerMenu(page, 'ギャラリー一覧');
  }

  async expectSelectGuideVisible(): Promise<void> {
    await expect(this.page.getByText('ギャラリーを選択してください')).toBeVisible();
  }

  async goto(): Promise<void> {
    await this.page.goto('/gallery');
  }

  async toggleDrawerByShortcut(): Promise<void> {
    await toggleDrawer(this.page);
  }
}
