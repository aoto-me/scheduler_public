import { test } from '../../fixtures/projectFixture.js';
import type { ProjectPage } from '../../pages/ProjectPage.js';
import { runEditorCommonTests } from '../../utils/helpers/editorTestHelpers.js';

let projectPostPage: ProjectPage;

test.beforeEach(({ projectPostPage: currentPage }) => {
  projectPostPage = currentPage;
});

test.describe('ProjectPost > Editor', () => {
  test.beforeEach(async () => {
    // プロジェクトは「タスク」タブが初期表示のため「メモ」タブへ切り替える
    await projectPostPage.tabs.clickTab('メモ');
    await projectPostPage.tabs.expectTabActive('メモ');
    await projectPostPage.editor.expectVisible();
  });

  runEditorCommonTests(test, () => ({ editor: projectPostPage.editor }), {
    afterReload: async () => {
      await projectPostPage.tabs.expectVisible();
      await projectPostPage.tabs.clickTab('メモ');
    },
    initialToCVisible: true,
  });
});
