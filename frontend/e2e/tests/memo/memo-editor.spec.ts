import { test } from '../../fixtures/memoFixture.js';
import type { MemoPage } from '../../pages/MemoPage.js';
import { runEditorCommonTests } from '../../utils/helpers/editorTestHelpers.js';

let memoPostPage: MemoPage;

test.beforeEach(({ memoPostPage: currentPage }) => {
  memoPostPage = currentPage;
});

test.describe('MemoPost > Editor', () => {
  test.beforeEach(async () => {
    await memoPostPage.tabs.expectTabActive('メモ');
    await memoPostPage.editor.expectVisible();
  });

  runEditorCommonTests(test, () => ({ editor: memoPostPage.editor }), {
    afterReload: async () => {
      await memoPostPage.tabs.expectVisible();
    },
    initialToCVisible: true,
  });
});
