import { test } from '../../fixtures/galleryFixture.js';
import { GalleryPage } from '../../pages/GalleryPage.js';
import { runDrawerCommonTests, runMenuCommonTests } from '../../utils/helpers/drawerTestHelpers.js';

const TEST_FOLDER = 'テストフォルダ';
let galleryPage: GalleryPage;

/**
 * 前提：
 * - 「テストページ」を含んだ「テストフォルダ」を用意しておく
 * - ドラックアンドドロップによる並び替えは手動でテストする
 */
test.beforeEach(({ galleryPage: currentPage }) => {
  galleryPage = currentPage;
});

test.describe('Galleryページ > Drawer', () => {
  runDrawerCommonTests(test, () => galleryPage);
});

test.describe('Galleryページ > Menu', () => {
  runMenuCommonTests(test, () => galleryPage, {
    detailUrlPattern: /\/gallery\/\d+/,
    expectReturnedState: () => galleryPage.expectSelectGuideVisible(),
    listUrlPattern: /\/gallery$/,
    testFolder: TEST_FOLDER,
  });

  test('Diaryリンクが表示されている', async () => {
    await galleryPage.menu.expectDiaryLinkVisible();
  });
});
