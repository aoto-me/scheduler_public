import { expect } from '@playwright/test';
import { test } from '../../fixtures/projectFixture.js';
import type { ProjectPage } from '../../pages/ProjectPage.js';

const SECTION_NAME = 'E2Eテスト用セクション';
const TODO_TITLE = 'E2Eテスト用Todo';

// テスト専用のセクションを追加し、そのセクションにToDoを1件登録する
const setupTodoInNewSection = async (projectPostPage: ProjectPage) => {
  await projectPostPage.kanban.addSection();
  await projectPostPage.kanban.clickAddTodoButtonInSection(await projectPostPage.kanban.getSecondToLastSection());
  await projectPostPage.todoForm.expectDialogVisible();
  await projectPostPage.todoForm.fillContent(TODO_TITLE);
  await projectPostPage.todoForm.clickSubmit('保存');
  await projectPostPage.todoForm.expectDialogHidden();
};

// ToDoを開いて削除し、続けてセクションも削除する
const cleanupTodoAndSection = async (projectPostPage: ProjectPage) => {
  await projectPostPage.kanban.getTodoCard().click();
  await projectPostPage.todoForm.deleteTodo();
  await projectPostPage.kanban.deleteSection(await projectPostPage.kanban.getSecondToLastSection());
};

test.describe('ProjectPost > Kanban', () => {
  test.beforeEach(async ({ projectPostPage }) => {
    await projectPostPage.tabs.expectTabActive('タスク');
  });

  test('TaskTimeBarが表示される', async ({ projectPostPage }) => {
    await projectPostPage.kanban.taskTimeBarVisible();
  });
});

test.describe('ProjectPost > Kanban > Section', () => {
  test.beforeEach(async ({ projectPostPage }) => {
    await projectPostPage.tabs.expectTabActive('タスク');
  });

  test('「セクションを追加」ボタンでセクションが追加される（リロード/DB反映を確認）', async ({
    page,
    projectPostPage,
  }) => {
    const countBefore = await projectPostPage.kanban.getSectionCount();
    await projectPostPage.kanban.addSection();
    await projectPostPage.kanban.expectSectionCount(countBefore + 1);
    await page.reload();
    await projectPostPage.tabs.expectVisible();
    await projectPostPage.kanban.expectSectionCount(countBefore + 1);
  });

  test('「未分類」は常に最後に表示される', async ({ projectPostPage }) => {
    await projectPostPage.kanban.expectNoCategoryLastSection();
  });

  test('セクション名を編集できる（リロード/DB反映を確認）', async ({ page, projectPostPage }) => {
    const targetContainer = await projectPostPage.kanban.getSecondToLastSection();
    await projectPostPage.kanban.editSectionNameAndWaitForSave(targetContainer, SECTION_NAME);
    await page.reload();
    await projectPostPage.tabs.expectVisible();
    await expect(page.getByText(SECTION_NAME).first()).toBeVisible();
  });

  test('バリデーション：セクション名が空でエラーが表示される', async ({ projectPostPage }) => {
    const targetContainer = await projectPostPage.kanban.getSecondToLastSection();
    await projectPostPage.kanban.editSectionName(targetContainer, '');
    await projectPostPage.kanban.expectSectionNameError(targetContainer, 'セクション名を入力してください');
  });

  test('バリデーション：セクション名が100文字超えでエラーが表示される', async ({ projectPostPage }) => {
    const targetContainer = await projectPostPage.kanban.getSecondToLastSection();
    await projectPostPage.kanban.editSectionName(targetContainer, 'a'.repeat(101));
    await projectPostPage.kanban.expectSectionNameError(targetContainer, '100文字以内で入力してください');
  });

  test('ToDoがないセクションを削除できる', async ({ projectPostPage }) => {
    const countBefore = await projectPostPage.kanban.getSectionCount();
    const targetContainer = await projectPostPage.kanban.getSecondToLastSection();
    await projectPostPage.kanban.deleteSection(targetContainer);
    await projectPostPage.kanban.expectSectionCount(countBefore - 1);
  });
});

test.describe('ProjectPost > Kanban > TodoForm', () => {
  test.beforeEach(async ({ projectPostPage }) => {
    await projectPostPage.tabs.expectTabActive('タスク');
  });

  test('「ToDoを追加」ボタンでモーダルフォームが表示される', async ({ page, projectPostPage }) => {
    const targetContainer = projectPostPage.kanban.getLastSection();
    await projectPostPage.kanban.clickAddTodoButtonInSection(targetContainer);
    await projectPostPage.todoForm.expectDialogVisible();
  });

  test('バリデーション：タスク名が空でエラーが表示される', async ({ page, projectPostPage }) => {
    const targetContainer = projectPostPage.kanban.getLastSection();
    await projectPostPage.kanban.clickAddTodoButtonInSection(targetContainer);
    await projectPostPage.todoForm.expectDialogVisible();
    await page.getByRole('dialog').getByRole('button', { name: '保存' }).click();
    await projectPostPage.todoForm.expectFieldError('content', '内容を入力してください');
  });

  test('選択中のプロジェクトに応じてセクション選択肢が変わる', async ({ page, projectPostPage }) => {
    // 専用セクションを追加して、そのセクションからToDoフォームを開く
    await projectPostPage.kanban.addSection();
    const newSection = await projectPostPage.kanban.getSecondToLastSection();
    await projectPostPage.kanban.editSectionNameAndWaitForSave(newSection, SECTION_NAME);
    await projectPostPage.kanban.clickAddTodoButtonInSection(newSection);
    await projectPostPage.todoForm.expectDialogVisible();

    // プロジェクトとセクションが事前入力されており、セクション選択肢に追加したセクションが含まれることを確認する
    const currentProjectTitle = await page.locator('#title').inputValue();
    await projectPostPage.todoForm.expectProjectValue(currentProjectTitle);
    await projectPostPage.todoForm.expectSectionHasOption(SECTION_NAME);

    // プロジェクトをクリアするとセクション選択肢から作成したセクションが消えることを確認する
    await projectPostPage.todoForm.fillProject('');
    await projectPostPage.todoForm.expectSectionNotHasOption(SECTION_NAME);

    // プロジェクトを再選択するとセクション選択肢に作成したセクションが戻ることを確認する
    await projectPostPage.todoForm.fillProject(currentProjectTitle.slice(0, 3));
    await projectPostPage.todoForm.clickProjectOption();
    await projectPostPage.todoForm.expectSectionHasOption(SECTION_NAME);

    // フォームを閉じてセクションを削除する
    await projectPostPage.todoForm.closeDialog();
    await projectPostPage.kanban.deleteSection(newSection);
  });

  test('ToDoを新規登録できる（リロード/DB反映を確認）', async ({ page, projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    await page.reload();
    await projectPostPage.tabs.expectVisible();
    await projectPostPage.kanban.getTodoCard().expectContainText(TODO_TITLE);

    await cleanupTodoAndSection(projectPostPage);
  });

  test('ToDoカードをクリックするとフォームが表示される', async ({ projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectVisible();
    await todoCard.click();
    await projectPostPage.todoForm.expectDialogVisible();
    await projectPostPage.todoForm.expectUpdateButtonVisible();

    // フォームが開いているのでそのまま削除し、セクションも削除する
    await projectPostPage.todoForm.deleteTodo();
    await projectPostPage.kanban.deleteSection(await projectPostPage.kanban.getSecondToLastSection());
  });

  test('ToDoカードのチェックボックスで完了/未完了を切り替えられる', async ({ projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectCheckboxChecked(false);

    // チェックして完了状態になることを確認する
    await todoCard.clickCheckbox();
    await todoCard.expectCheckboxChecked(true);

    // チェックを外して未完了に戻ることを確認する
    await todoCard.clickCheckbox();
    await todoCard.expectCheckboxChecked(false);

    await cleanupTodoAndSection(projectPostPage);
  });

  test('作業時間を追加して合計が計算される', async ({ projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectVisible();
    await todoCard.click();
    await projectPostPage.todoForm.expectDialogVisible();
    await projectPostPage.todoForm.addTaskTimeFrom();

    // 開始・終了に1時間差のある時間を入力して合計が計算されることを確認する
    await projectPostPage.todoForm.fillTaskTime('start', '2026-03-31 10:00');
    await projectPostPage.todoForm.fillTaskTime('end', '2026-03-31 11:00');
    await projectPostPage.todoForm.expectTotalTaskTime('1時間');

    await projectPostPage.todoForm.closeDialog();
    await cleanupTodoAndSection(projectPostPage);
  });

  test('作業時間を保存するとカードとTaskTimeBarに反映される', async ({ projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectVisible();
    await todoCard.click();
    await projectPostPage.todoForm.expectDialogVisible();
    await projectPostPage.todoForm.clickAddTaskTime();
    await projectPostPage.todoForm.fillTaskTime('start', '2026-03-31 10:00');
    await projectPostPage.todoForm.fillTaskTime('end', '2026-03-31 11:00');
    await projectPostPage.todoForm.clickSubmit('更新');
    await projectPostPage.todoForm.expectDialogHidden();

    // カードに合計作業時間が表示される
    await todoCard.expectTaskTime('1時間');

    // TaskTimeBar のバーラベルに作業時間が反映される
    await projectPostPage.kanban.expectTaskTimeBarLabel('1時間');

    await cleanupTodoAndSection(projectPostPage);
  });

  test('見積を保存するとカードとTaskTimeBarに反映される', async ({ projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectVisible();
    await todoCard.click();
    await projectPostPage.todoForm.expectDialogVisible();
    await projectPostPage.todoForm.fillEstimated('01:00');
    await projectPostPage.todoForm.clickSubmit('更新');
    await projectPostPage.todoForm.expectDialogHidden();

    // カードに見積時間が表示される
    await todoCard.expectEstimated('1時間0分');

    // TaskTimeBar のバーラベルに見積時間が反映される
    await projectPostPage.kanban.expectTaskTimeBarLabel('1時間');

    await cleanupTodoAndSection(projectPostPage);
  });

  test('ToDoを編集できる（リロード/DB反映を確認）', async ({ page, projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectVisible();
    await todoCard.click();
    await projectPostPage.todoForm.expectDialogVisible();

    const updatedTitle = `${TODO_TITLE}（更新済み）`;
    await projectPostPage.todoForm.fillContent(updatedTitle);
    await projectPostPage.todoForm.clickSubmit('更新');
    await projectPostPage.todoForm.expectDialogHidden();

    await page.reload();
    await projectPostPage.tabs.expectVisible();
    await projectPostPage.kanban.getTodoCard().expectContainText(updatedTitle);

    await cleanupTodoAndSection(projectPostPage);
  });

  test('ToDoがあるセクションを削除しようとするとアラートが出る', async ({ page, projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const countBefore = await projectPostPage.kanban.getSectionCount();
    const sectionWithTodo = await projectPostPage.kanban.getSecondToLastSection();
    page.once('dialog', dialog => dialog.dismiss());
    await projectPostPage.kanban.clickDeleteSectionButton(sectionWithTodo);
    await page.waitForTimeout(500);
    await projectPostPage.kanban.expectSectionCount(countBefore);

    await cleanupTodoAndSection(projectPostPage);
  });

  test('ToDoを削除できる', async ({ projectPostPage }) => {
    await setupTodoInNewSection(projectPostPage);

    const todoCard = projectPostPage.kanban.getTodoCard();
    await todoCard.expectVisible();
    await todoCard.click();
    await projectPostPage.todoForm.deleteTodo();

    // ToDoは削除済みなのでセクションのみ削除する
    await projectPostPage.kanban.deleteSection(await projectPostPage.kanban.getSecondToLastSection());
  });
});
