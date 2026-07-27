import type { PageTitle } from '../../components/PageTitle.js';

interface TitlePage {
  expectReady(): Promise<void>;
  title: PageTitle;
}

export const runTitleTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => TitlePage,
  options: { newTitle: string }
): void => {
  let originalTitle: string | undefined;

  test.beforeEach(async () => {
    const { title } = getPage();
    await title.expectVisible();
    originalTitle = await title.getValue();
  });

  test.afterEach(async () => {
    if (originalTitle === undefined) return;

    const { title } = getPage();
    const current = await title.getValue();

    if (current !== originalTitle) {
      await title.fill(originalTitle);
      await title.waitForSaved();
    }
  });

  test('ページタイトルが表示される', async () => {
    const titlePage = getPage();
    await titlePage.title.expectVisible();
  });

  test('ページタイトルを編集できる（リロード/DB反映を確認）', async ({ page }) => {
    const titlePage = getPage();

    await titlePage.title.fill(options.newTitle);
    await titlePage.title.waitForSaved();

    await page.reload();

    await titlePage.expectReady();
    await titlePage.title.expectValue(options.newTitle);
  });

  test('バリデーション：空文字でエラーが出る', async () => {
    const { title } = getPage();
    await title.fill('');
    await title.expectError('タイトルを入力してください');
  });

  test('バリデーション：100文字超えでエラーが出る', async () => {
    const { title } = getPage();
    await title.fill('a'.repeat(101));
    await title.expectError('100文字以内で入力してください');
  });
};
