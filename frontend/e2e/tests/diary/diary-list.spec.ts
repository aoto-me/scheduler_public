import { type Browser, expect, test } from '@playwright/test';
import { DiaryCardList } from '../../components/DiaryCardList.js';
import { MonthSelector } from '../../components/MonthSelector.js';

// 2000-01-01 のみテスト用に利用
const cleanupDiaryCards = async (browser: Browser) => {
  const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
  const page = await context.newPage();
  await page.goto('/gallery/diary?date=2000-01');

  try {
    await expect(page.getByRole('group', { name: '月選択' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'カードを追加' })).toBeVisible();
  } catch {
    await context.close();
    return;
  }

  const targetCard = page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' }).first();
  if (!(await targetCard.isVisible())) {
    await context.close();
    return;
  }

  await targetCard.click();
  await expect(page).toHaveURL(/\/gallery\/diary\/\d+/);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'カードの削除' }).click();
  await expect(page).toHaveURL(/\/gallery\/diary/);

  await context.close();
};

test.describe('Diaryページ > CardList', () => {
  let cardList: DiaryCardList;
  let monthSelector: MonthSelector;

  test.beforeAll(async ({ browser }) => {
    // 前回のテストの残りがないように一度クリーンアップ
    await cleanupDiaryCards(browser);
  });

  test.afterAll(async ({ browser }) => {
    await cleanupDiaryCards(browser);
  });

  test.beforeEach(async ({ page }) => {
    cardList = new DiaryCardList(page);
    monthSelector = new MonthSelector(page);
    await page.goto('/gallery/diary?date=2000-01');
    await cardList.expectAddCardButtonVisible();
  });

  test('パンくずリストが表示される', async () => {
    await cardList.expectBreadcrumbsVisible();
  });

  test('パンくずにdiaryリンクが含まれる', async ({ page }) => {
    await cardList.expectBreadcrumbsVisible();
    await expect(page.getByLabel('パンくずリスト').getByRole('link', { name: 'diary' })).toBeVisible();
  });

  test('MonthSelectorが表示される', async () => {
    await monthSelector.expectVisible();
  });

  test('「カードを追加」ボタンでモーダルが開く', async ({ page }) => {
    await cardList.clickAddCard();
    await expect(page.getByRole('group', { name: '日付' })).toBeVisible();
    await expect(page.getByRole('button', { name: '日付のカードを追加' })).toBeVisible();
  });

  test('新規Diaryカードを追加できる（リロード/DB反映を確認）', async ({ page }) => {
    await cardList.addCard('2000-01-01');
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' })).toBeVisible();
    await page.reload();
    await cardList.expectAddCardButtonVisible();
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' })).toBeVisible();
  });

  test('同じ日付で保存するとエラーが表示される', async ({ page }) => {
    // 前テストで 2000-01-01 のカードが作成済みのため同日付で追加を試みる
    await cardList.clickAddCard();
    await cardList.selectDateInModal('2000-01-01');
    await page.getByRole('button', { name: '日付のカードを追加' }).click();
    await expect(page.getByText('登録に失敗しました')).toBeVisible();
  });

  test('「次の月」ボタンで翌月に移動すると当月のカードが非表示になる', async ({ page }) => {
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' })).toBeVisible();
    // 翌月（2000-02）へ移動してカードがないことを確認
    await monthSelector.clickNextMonth();
    await cardList.expectAddCardButtonVisible();
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' })).toHaveCount(0);
  });

  test('「前の月」ボタンで前月に移動すると前月のカードが表示される', async ({ page }) => {
    // 2000-02 へ移動（カードは存在しない）
    await page.goto('/gallery/diary?date=2000-02');
    await cardList.expectAddCardButtonVisible();
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' })).toHaveCount(0);
    // 前月（2000-01）へ移動してカードがあることを確認
    await monthSelector.clickPrevMonth();
    await cardList.expectAddCardButtonVisible();
    await expect(page.locator('[data-testid="diary-card-item"]').filter({ hasText: '2000/01/01' })).toBeVisible();
  });

  test('?date=yyyy-MM で該当年月が MonthSelector に反映される', async ({ page }) => {
    await page.goto('/gallery/diary?date=2019-06');
    await monthSelector.expectVisible();
    const monthText = await monthSelector.getMonthText();
    expect(monthText).toContain('2019');
    expect(monthText).toContain('6');
  });

  test('カードをクリックするとカード詳細ページへ遷移する', async ({ page }) => {
    await cardList.expectCardsVisible();
    await cardList.clickFirstCard();
    await expect(page).toHaveURL(/\/gallery\/diary\/\d+/);
  });
});
