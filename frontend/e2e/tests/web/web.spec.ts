import { type BrowserContext, test } from '@playwright/test';
import { WebPage } from '../../pages/WebPage.js';
import { errorRows, loadWebCsv, normalRows, uniqueDates } from '../../utils/webCsv.js';

const csvRows = loadWebCsv();
const normal = normalRows(csvRows);
const errors = errorRows(csvRows);
const dates = uniqueDates(csvRows);

/**
 * 前提：
 * - RSS・WebCsvともに1件ずつエラーを含む
 */
test.describe('Webページ', () => {
  test.describe.configure({ timeout: 120_000 });

  let web: WebPage;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);

    context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    });

    const page = await context.newPage();

    web = new WebPage(page);
    await web.goto();
    await web.waitForRssLoaded();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('ページが表示される', async () => {
    await web.expectInitialView();
  });

  test('RSS：記事が表示される', async () => {
    await web.expectRssItems();
  });

  test('WebCsv：正常データが表示される', async () => {
    await web.expectWebList(normal);
  });

  test('WebCsv：日付ヘッダーが表示される', async () => {
    await web.expectDateHeaders(dates);
  });

  test('エラー：WebCsvエラーが表示される', async () => {
    await web.expectErrors(errors);
  });

  test('エラー：RSSエラーが表示される', async () => {
    await web.expectRssError();
  });

  // ページ状態を変更するため最後に実行
  test('RSS：「もっと見る」で記事が増える', async () => {
    await web.expectMoreLoadsItems();
  });
});
