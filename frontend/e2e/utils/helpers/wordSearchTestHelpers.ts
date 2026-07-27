import { expect } from '@playwright/test';
import { WordSearch } from '../../components/WordSearch.js';

interface WordSearchPage {
  wordSearch: WordSearch;
}

export const runWordSearchTests = (
  test: typeof import('@playwright/test').test,
  getPage: () => WordSearchPage,
  options: {
    basePath: string;
    nonExistentWord: string;
    searchWord: string;
  }
): void => {
  test('検索フォームが表示されている', async () => {
    const { wordSearch } = getPage();
    await wordSearch.formVisible();
  });

  test('初期メッセージが表示される', async () => {
    const { wordSearch } = getPage();
    await wordSearch.expectInitialMessage();
  });

  test('検索ワードで検索するとURLパラメータがセットされる', async ({ page }) => {
    const { wordSearch } = getPage();
    await wordSearch.search(options.searchWord);
    await expect(page).toHaveURL(/[?&]word=/);
    await wordSearch.expectResultVisible(options.searchWord);
  });

  test('検索結果が存在する場合、結果カードが表示される', async () => {
    const { wordSearch } = getPage();
    await wordSearch.search(options.searchWord);
    await wordSearch.expectResultCards();
  });

  test('データが見つからない場合メッセージが表示される', async () => {
    const { wordSearch } = getPage();
    await wordSearch.search(options.nonExistentWord);
    await wordSearch.expectNoResults();
  });

  test('URLの word パラメータで検索結果が表示される', async ({ page }) => {
    const { wordSearch } = getPage();
    await page.goto(`${options.basePath}?word=${encodeURIComponent(options.nonExistentWord)}`);
    await wordSearch.expectNoResults();
  });
};
