import { test } from '../../fixtures/galleryFixture.js';

test.describe('GalleryIndex', () => {
  test('選択ガイドテキストが表示される', async ({ galleryPage }) => {
    await galleryPage.expectSelectGuideVisible();
  });
});
