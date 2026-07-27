import { type Browser, expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage.js';
import { fetchCsrfToken } from '../../utils/testUtils.js';

const TODO_TITLE = 'E2Eテスト用Todo';
const TODO_TITLE_UPDATED = 'E2Eテスト用Todo（更新済み）';
const TODO_TITLE_PIECHART = 'E2Eテスト用Todo（PieChart確認用）';
const PROJECT_NAME = 'テスト用プロジェクト';
const TODO_MEMO = 'E2Eテスト用メモ';

const now = new Date();
const TEST_DATE = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
const TEST_TITLES = new Set([TODO_TITLE, TODO_TITLE_PIECHART, TODO_TITLE_UPDATED]);

let createdTodoIds: number[] = [];

// 前回のテスト実行で残ったTodoをAPI経由で削除
const cleanupLeftoverTodos = async (browser: Browser) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:5173', storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  // start/end クエリパラメータを広めの範囲を指定して全件取得する
  const resp = await page.request.get('/backend/api/todo/?start=2020-01-01&end=2099-12-31', {
    headers: { 'X-CSRF-Token': csrfToken },
  });
  if (resp.ok()) {
    const body = (await resp.json()) as { result?: { todo?: { content: string; id: number }[] } };
    const todos = body.result?.todo ?? [];
    for (const todo of todos) {
      if (TEST_TITLES.has(todo.content)) {
        await page.request.delete(`/backend/api/todo/${String(todo.id)}/`, {
          headers: { 'X-CSRF-Token': csrfToken },
        });
      }
    }
  }
  await context.close();
};

// テスト前後に作成したTodoをAPI経由で削除
const deleteTodosForTest = async (browser: Browser) => {
  if (createdTodoIds.length === 0) return;
  const context = await browser.newContext({ baseURL: 'http://localhost:5173', storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  const csrfToken = await fetchCsrfToken(page.request);
  for (const id of createdTodoIds) {
    await page.request.delete(`/backend/api/todo/${String(id)}/`, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  }
  await context.close();
  createdTodoIds = [];
};

test.describe('Homeページ > DrawerRight > ToDo', () => {
  let homePage: HomePage;

  test.beforeAll(async ({ browser }) => {
    try {
      await cleanupLeftoverTodos(browser);
      await deleteTodosForTest(browser);
    } catch {
      // クリーンアップ失敗でもテストを止めない
    }
  });

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // gotoより前にwaitForResponseを登録してTodoのGETをキャプチャする
    const todosLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo') && resp.request().method() === 'GET'
    );
    await homePage.goto();
    await homePage.expectCalendarVisible();
    await todosLoaded;
    // 15日をクリックして currentDay を固定
    await homePage.selectCurrentDay(15);
  });

  test.afterAll(async ({ browser }) => {
    try {
      await deleteTodosForTest(browser);
    } catch {
      // クリーンアップ失敗は無視
    }
  });

  test('「ToDoを追加」ボタンでTodoFormが表示される', async () => {
    await homePage.clickAddTodoButton();
    await homePage.todoForm.expectDialogVisible();
  });

  test('ToDoを新規登録できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.clickAddTodoButton();
    await homePage.todoForm.expectDialogVisible();
    await homePage.todoForm.fillContent(TODO_TITLE);
    const result = await homePage.todoForm.clickSubmit('保存');
    createdTodoIds.push(result.id);
    await homePage.todoForm.expectDialogHidden();

    const todosLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await todosLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.getTodoCard(TODO_TITLE).expectVisible();
  });

  test('登録内容がカレンダーに反映される', async () => {
    // 前テストで登録済みのレコードがカレンダーに表示されることを確認
    const dateStr = await homePage.getCalendarDateStr(15);
    await homePage.expectCalendarEventVisible(dateStr);
  });

  test('ToDoカードをクリックするとTodoFormが表示される', async () => {
    await homePage.getTodoCard(TODO_TITLE).expectVisible();
    await homePage.getTodoCard(TODO_TITLE).click();
    await homePage.todoForm.expectDialogVisible();
    await homePage.todoForm.expectUpdateButtonVisible();
  });

  test('バリデーション：タスク名が必須が空でエラーが出る', async ({ page }) => {
    await homePage.clickAddTodoButton();
    await homePage.todoForm.expectDialogVisible();
    await page.getByRole('dialog').getByRole('button', { name: '保存' }).click();
    await homePage.todoForm.expectFieldError('content', '内容を入力してください');
  });

  test('作業時間を追加して合計がフォーム上で計算される', async () => {
    await homePage.getTodoCard(TODO_TITLE).expectVisible();
    await homePage.getTodoCard(TODO_TITLE).click();
    await homePage.todoForm.expectDialogVisible();
    await homePage.todoForm.addTaskTimeFrom();

    // 開始・終了に1時間差のある時間を入力して合計が計算されることを確認する
    await homePage.todoForm.fillTaskTime('start', `${TEST_DATE} 10:00`);
    await homePage.todoForm.fillTaskTime('end', `${TEST_DATE} 11:00`);
    await homePage.todoForm.expectTotalTaskTime('1時間');

    await homePage.todoForm.closeDialog();
  });

  test('選択中のプロジェクトに応じてセクション選択肢が変わる', async () => {
    await homePage.clickAddTodoButton();
    await homePage.todoForm.expectDialogVisible();

    // プロジェクト未選択時はセクションの選択肢がない
    await homePage.todoForm.expectSectionHasNoOptions();

    // プロジェクトを選択するとセクションが有効になる
    await homePage.todoForm.fillProject('テスト用');
    await homePage.todoForm.clickProjectOption(PROJECT_NAME);
    await homePage.todoForm.expectSectionHasAnyOption();

    await homePage.todoForm.closeDialog();
  });

  test('ToDoカードのチェックボックスで完了/未完了を切り替えられる', async () => {
    const todoCard = homePage.getTodoCard(TODO_TITLE);
    await todoCard.expectCheckboxChecked(false);

    // チェックして完了状態になることを確認
    await todoCard.clickCheckbox();
    await todoCard.expectCheckboxChecked(true);

    // チェックを外して未完了に戻ることを確認
    await todoCard.clickCheckbox();
    await todoCard.expectCheckboxChecked(false);
  });

  test('作業時間・見積・プロジェクトを保存するとカードに反映される', async () => {
    const todoCard = homePage.getTodoCard(TODO_TITLE);
    await todoCard.click();
    await homePage.todoForm.expectDialogVisible();

    // 作業時間を追加
    await homePage.todoForm.clickAddTaskTime();
    await homePage.todoForm.fillTaskTime('start', `${TEST_DATE} 10:00`);
    await homePage.todoForm.fillTaskTime('end', `${TEST_DATE} 11:00`);

    // 見積を入力
    await homePage.todoForm.fillEstimated('01:00');

    // プロジェクトを選択
    await homePage.todoForm.fillProject('テスト用');
    await homePage.todoForm.clickProjectOption(PROJECT_NAME);

    // メモを入力
    await homePage.todoForm.fillMemo(TODO_MEMO);

    await homePage.todoForm.clickSubmit('更新');
    await homePage.todoForm.expectDialogHidden();

    // カードに全フィールドが反映される
    await expect(todoCard.locator.getByText('1時間', { exact: true })).toBeVisible(); // 作業時間
    await expect(todoCard.locator.getByText('1時間0分', { exact: true })).toBeVisible(); // 見積
    await expect(todoCard.locator.getByText(PROJECT_NAME, { exact: true })).toBeVisible(); // プロジェクト
    await expect(todoCard.locator.getByText(TODO_MEMO, { exact: true })).toBeVisible(); // メモ
  });

  test('保存済みの作業時間を削除するとカードから消える', async () => {
    const todoCard = homePage.getTodoCard(TODO_TITLE);

    // 前テストで保存した作業時間がカードに表示されていることを確認
    await expect(todoCard.locator.getByText('1時間', { exact: true })).toBeVisible();

    await todoCard.click();
    await homePage.todoForm.expectDialogVisible();

    // 保存済み作業時間を削除
    await homePage.todoForm.deleteTaskTime();
    await homePage.todoForm.closeDialog();

    // カードから作業時間が消える
    await expect(todoCard.locator.getByText('1時間', { exact: true })).not.toBeVisible();
  });

  test('start/end が同日の ToDo が DailyPieChart に反映される', async ({ page }) => {
    const dateStr = await homePage.getCalendarDateStr(15);

    // DateTimePickerのUI操作は不安定なため、ブラウザ内fetchで直接作成する
    // page.request は SameSite:Strict なクッキーを送れないため page.evaluate() を使用する
    const newId = await page.evaluate(
      async ({ content, dateStr }: { content: string; dateStr: string }) => {
        const userResp = await fetch('/backend/api/user/');
        const userData = (await userResp.json()) as { csrfToken: string };

        const todoResp = await fetch('/backend/api/todo/', {
          body: JSON.stringify({
            completed: 0,
            content,
            end: `${dateStr} 01:00`,
            estimated: null,
            memo: '',
            projectId: null,
            sectionId: null,
            sort: 'maintain',
            start: `${dateStr} 00:00`,
            taskTime: [],
            type: 'プライベート',
            visible: 1,
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': userData.csrfToken,
          },
          method: 'PUT',
        });

        if (!todoResp.ok) {
          const text = await todoResp.text();
          throw new Error(`PUT /todo/ failed: ${String(todoResp.status)} ${text}`);
        }

        const data = (await todoResp.json()) as { result: { id: number } };
        return data.result.id;
      },
      { content: TODO_TITLE_PIECHART, dateStr }
    );
    createdTodoIds.push(newId);

    // リロードして DailyPieChart に反映されていることを確認
    const todosLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await todosLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.expectPieChartLegendContains('プライベート');

    // cleanup（後続テストのカード数に影響させない）
    await homePage.getTodoCard(TODO_TITLE_PIECHART).click();
    await homePage.todoForm.deleteTodo();
  });

  test('ToDoを編集できる（リロード/DB反映を確認）', async ({ page }) => {
    await homePage.getTodoCard(TODO_TITLE).expectVisible();
    await homePage.getTodoCard(TODO_TITLE).click();
    await homePage.todoForm.expectDialogVisible();
    await homePage.todoForm.expectUpdateButtonVisible();

    await homePage.todoForm.fillContent(TODO_TITLE_UPDATED);
    await homePage.todoForm.clickSubmit('更新');
    await homePage.todoForm.expectDialogHidden();

    const todosLoaded = page.waitForResponse(
      resp => resp.url().includes('/backend/api/todo') && resp.request().method() === 'GET'
    );
    await page.reload();
    await homePage.expectCalendarVisible();
    await todosLoaded;
    await homePage.selectCurrentDay(15);
    await homePage.getTodoCard(TODO_TITLE_UPDATED).expectVisible();
  });

  test('ToDoを削除できる', async () => {
    const todoCard = homePage.getTodoCard(TODO_TITLE_UPDATED);
    await todoCard.expectVisible();
    await todoCard.click();
    await homePage.todoForm.deleteTodo();
    await todoCard.expectNotVisible();
  });
});
