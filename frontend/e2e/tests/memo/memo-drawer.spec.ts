import { test } from '../../fixtures/memoFixture.js';
import { MemoPage } from '../../pages/MemoPage.js';
import { runDrawerCommonTests, runMenuCommonTests } from '../../utils/helpers/drawerTestHelpers.js';

const TEST_FOLDER = 'テストフォルダ';
let memoPage: MemoPage;

/**
 * 前提：
 * - 「テストページ」を含んだ「テストフォルダ」を用意しておく
 * - ドラックアンドドロップによる並び替えは手動でテストする
 */
test.beforeEach(({ memoPage: currentPage }) => {
  memoPage = currentPage;
});

test.describe('Memoページ > Drawer', () => {
  runDrawerCommonTests(test, () => memoPage);
});

test.describe('Memoページ > Menu', () => {
  runMenuCommonTests(test, () => memoPage, {
    detailUrlPattern: /\/memo\/\d+/,
    expectReturnedState: () => memoPage.wordSearch.formVisible(),
    listUrlPattern: /\/memo$/,
    testFolder: TEST_FOLDER,
  });
});
