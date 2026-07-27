import { test } from '../../fixtures/projectFixture.js';
import { ProjectPage } from '../../pages/ProjectPage.js';
import { runWordSearchTests } from '../../utils/helpers/wordSearchTestHelpers.js';

const SEARCH_WORD = 'E2E検索テスト用テキスト';
const NON_EXISTENT_WORD = 'E2E検索テスト用の存在しないワード12345xyz';
let projectPage: ProjectPage;

/**
 * 前提：
 * - 「E2E検索テスト用テキスト」のテキストを含んだプロジェクトを用意しておく
 */
test.describe('ProjectIndex > 検索', () => {
  test.beforeEach(({ projectPage: currentPage }) => {
    projectPage = currentPage;
  });

  runWordSearchTests(test, () => projectPage, {
    basePath: '/project',
    nonExistentWord: NON_EXISTENT_WORD,
    searchWord: SEARCH_WORD,
  });
});
