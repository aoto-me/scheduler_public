import { test } from '../../fixtures/projectFixture.js';
import { ProjectPage } from '../../pages/ProjectPage.js';
import { runDrawerCommonTests, runMenuCommonTests } from '../../utils/helpers/drawerTestHelpers.js';

const TEST_FOLDER = 'テストフォルダ';
let projectPage: ProjectPage;

/**
 * 前提：
 * - 「テストページ」を含んだ「テストフォルダ」を用意しておく
 * - ドラックアンドドロップによる並び替えは手動でテストする
 */
test.beforeEach(({ projectPage: currentPage }) => {
  projectPage = currentPage;
});

test.describe('Projectページ > Drawer', () => {
  runDrawerCommonTests(test, () => projectPage);
});

test.describe('Projectページ > Menu', () => {
  runMenuCommonTests(test, () => projectPage, {
    detailUrlPattern: /\/project\/\d+/,
    expectReturnedState: () => projectPage.wordSearch.formVisible(),
    listUrlPattern: /\/project$/,
    testFolder: TEST_FOLDER,
  });
});
