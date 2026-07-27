import { Page } from '@playwright/test';
import { test } from '../../fixtures/fileFixture.js';
import { FilePostPage } from '../../pages/FilePostPage.js';
import { runDrawerCommonTests } from '../../utils/helpers/drawerTestHelpers.js';

test.describe('Fileページ > Drawer', () => {
  let filePage: FilePostPage;

  test.beforeEach(({ filePage: currentPage }) => {
    filePage = currentPage;
  });

  // runDrawerCommonTests はファイル読み込み時に展開されるが、その時点では filePage にまだ値が代入されていない
  // そのため直接 filePage を渡すのではなく、テスト実行時に filePage を返す関数を渡している
  runDrawerCommonTests(test, () => filePage);
});

test.describe('Fileページ > DirectoryTree', () => {
  test('フォルダ階層ツリーが表示されている', async ({ filePage }) => {
    await filePage.expectDirectoryTreeVisible();
  });

  test('diary フォルダがツリーに表示される', async ({ filePage }) => {
    await filePage.expectTreeItemVisible('diary');
  });

  test('gallery フォルダがツリーに表示される', async ({ filePage }) => {
    await filePage.expectTreeItemVisible('gallery');
  });

  test('memo フォルダがツリーに表示される', async ({ filePage }) => {
    await filePage.expectTreeItemVisible('memo');
  });

  test('project フォルダがツリーに表示される', async ({ filePage }) => {
    await filePage.expectTreeItemVisible('project');
  });
});

const createFolder = async (filePage: FilePostPage, page: Page): Promise<string> => {
  const respPromise = page.waitForResponse(
    r => r.url().includes('/backend/api/file/folder/') && r.request().method() === 'POST'
  );

  await filePage.clickAddFolderButton();
  const resp = await respPromise;
  const { result } = (await resp.json()) as { result: string };

  await filePage.expectNewFolderVisible();
  return result;
};

const deleteFolder = async (filePage: FilePostPage, page: Page, path: string) => {
  await page.goto(path);
  page.once('dialog', d => d.accept());
  await filePage.clickDeleteFolder();
  await page.waitForURL('/file');
};
test.describe('Fileページ > DirectoryTree', () => {
  test('ルートにフォルダを作成できる', async ({ filePage, page }) => {
    let parent = '';

    try {
      parent = await createFolder(filePage, page);
      await filePage.expectTreeItemVisible(parent);
    } finally {
      if (parent) {
        await deleteFolder(filePage, page, `/file/${parent}`);
      }
    }
  });

  test('親フォルダ配下に子フォルダを作成できる', async ({ filePage, page }) => {
    let parent = '';
    let child = '';

    try {
      parent = await createFolder(filePage, page);

      await filePage.clickTreeItem(parent);
      await filePage.expectFolderNameVisible(parent);

      child = await createFolder(filePage, page);
      await filePage.expectTreeItemVisible(child);
    } finally {
      if (child) {
        await deleteFolder(filePage, page, `/file/${parent}/${child}`);
      }
      if (parent) {
        await deleteFolder(filePage, page, `/file/${parent}`);
      }
    }
  });

  test('フォルダをクリックすると展開・折りたたみできる', async ({ filePage, page }) => {
    let parent = '';
    let child = '';

    try {
      parent = await createFolder(filePage, page);

      await filePage.clickTreeItem(parent);
      await filePage.expectFolderNameVisible(parent);

      child = await createFolder(filePage, page);

      await filePage.expectTreeItemCollapsed(parent);

      await filePage.clickAccordionTreeItem(parent);
      await filePage.expectTreeItemExpanded(parent);

      await filePage.clickAccordionTreeItem(parent);
      await filePage.expectTreeItemCollapsed(parent);
    } finally {
      if (child) {
        await deleteFolder(filePage, page, `/file/${parent}/${child}`);
      }
      if (parent) {
        await deleteFolder(filePage, page, `/file/${parent}`);
      }
    }
  });
});

test.describe('Fileページ > DirectoryTree > 固定ディレクトリ', () => {
  test('diary 直下には新規フォルダを追加できない', async ({ filePage, page }) => {
    await filePage.clickTreeItem('diary');
    await page.waitForURL('/file/diary');
    await filePage.clickAddFolderButton();
    await filePage.expectErrorMessageVisible('diaryの下にはフォルダを追加できません');
  });

  test('gallery 直下には新規フォルダを追加できない', async ({ filePage, page }) => {
    await filePage.clickTreeItem('gallery');
    await page.waitForURL('/file/gallery');
    await filePage.clickAddFolderButton();
    await filePage.expectErrorMessageVisible('galleryの下にはフォルダを追加できません');
  });

  test('memo 直下には新規フォルダを追加できない', async ({ filePage, page }) => {
    await filePage.clickTreeItem('memo');
    await page.waitForURL('/file/memo');
    await filePage.clickAddFolderButton();
    await filePage.expectErrorMessageVisible('memoの下にはフォルダを追加できません');
  });

  test('project 直下には新規フォルダを追加できない', async ({ filePage, page }) => {
    await filePage.clickTreeItem('project');
    await page.waitForURL('/file/project');
    await filePage.clickAddFolderButton();
    await filePage.expectErrorMessageVisible('projectの下にはフォルダを追加できません');
  });
});
