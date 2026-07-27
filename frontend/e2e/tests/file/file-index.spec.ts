import { test } from '../../fixtures/fileFixture.js';

test.describe('FileIndex', () => {
  test('検索フォームと検索ボタンが表示される', async ({ filePage }) => {
    await filePage.expectSearchFieldVisible();
    await filePage.expectSearchButtonVisible();
  });
});

/**
 * 前提：
 * - upload-sample と upload-img がアップロード済み
 */
test.describe('FileIndex > 検索', () => {
  test('初期状態で「検索ワードを入力してください」が表示される', async ({ filePage }) => {
    await filePage.expectInitialMessageVisible();
  });

  test('検索ワード1つで結果ヘッダーとファイルカードが表示される', async ({ filePage }) => {
    await filePage.searchFiles('sample');
    await filePage.expectSearchResultHeaderVisible('sample');
    await filePage.expectFileCardsExist();
  });

  test('スペース区切りの複数ワードで検索すると結果が表示される', async ({ filePage }) => {
    await filePage.searchFiles('upload-sample upload-img');
    await filePage.expectSearchResultHeaderVisible('upload-sample upload-img');
    await filePage.expectFileGridVisible();
  });

  test('一致しないワードで「該当するファイルは見つかりませんでした」が表示される', async ({ filePage }) => {
    await filePage.searchFiles('zzz_nonexistent_xyz_12345');
    await filePage.expectSearchResultHeaderVisible('zzz_nonexistent_xyz_12345');
    await filePage.expectNoResultMessageVisible();
  });
});
