import type { TabPanel } from '../../components/TabPanel.js';

interface TabTestOptions {
  arrowLeft: { expectedTab: string; startTab: string };
  arrowRight: { expectedTab: string };
  clickableTabs: string[];
  defaultTab: string;
}

export const runTabTests = (
  test: typeof import('@playwright/test').test,
  getTabs: () => TabPanel,
  options: TabTestOptions
): void => {
  test('タブリストが表示される', async () => {
    await getTabs().expectVisible();
  });

  test(`「${options.defaultTab}」タブが最初にアクティブになっている`, async () => {
    await getTabs().expectTabActive(options.defaultTab);
  });

  for (const tab of options.clickableTabs) {
    test(`「${tab}」タブをクリックするとパネルが切り替わる`, async () => {
      const tabs = getTabs();
      await tabs.clickTab(tab);
      await tabs.expectTabActive(tab);
    });
  }

  test('ArrowRight キーで次のタブへ移動できる', async () => {
    const tabs = getTabs();
    await tabs.pressArrowRightOnActiveTab();
    await tabs.expectTabActive(options.arrowRight.expectedTab);
  });

  test('ArrowLeft キーで前のタブへ移動できる', async () => {
    const tabs = getTabs();
    await tabs.clickTab(options.arrowLeft.startTab);
    await tabs.pressArrowLeftOnActiveTab();
    await tabs.expectTabActive(options.arrowLeft.expectedTab);
  });
};
