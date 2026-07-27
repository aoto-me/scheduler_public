import { test } from '../../fixtures/memoFixture.js';
import { MemoPage } from '../../pages/MemoPage.js';
import { runWordSearchTests } from '../../utils/helpers/wordSearchTestHelpers.js';

const SEARCH_WORD = 'E2E検索テスト用テキスト';
const NON_EXISTENT_WORD = 'E2E検索テスト用の存在しないワード12345xyz';
let memoPage: MemoPage;

/**
 * 前提：
 * - 「E2E検索テスト用テキスト」のテキストを含んだ「テストページ」を用意しておく
 */
test.beforeEach(({ memoPage: currentPage }) => {
  memoPage = currentPage;
});

test.describe('MemoIndex > 検索', () => {
  runWordSearchTests(test, () => memoPage, {
    basePath: '/memo',
    nonExistentWord: NON_EXISTENT_WORD,
    searchWord: SEARCH_WORD,
  });
});
