import { expect } from '@playwright/test';
import { format, parseISO } from 'date-fns';
import { FIXTURE_FOOD_NAME, test } from '../../fixtures/healthFixture.js';
import { uniqueContent } from '../../utils/testUtils.js';

// 体調テーブルの表示日付フォーマット（yyyy/M/dd）月はゼロなし
const toHealthDate = (isoDate: string): string => format(parseISO(isoDate), 'yyyy/M/dd');

test.describe('Healthページ > MonthSelector', () => {
  test.beforeEach(async ({ healthPage }) => {
    await healthPage.monthSelector.expectVisible();
  });

  test('前月ボタンで月が変わる', async ({ healthPage }) => {
    const before = await healthPage.monthSelector.getMonthText();
    await healthPage.monthSelector.clickPrevMonth();
    const after = await healthPage.monthSelector.getMonthText();
    expect(after).not.toBe(before);
  });

  test('翌月ボタンで月が変わる', async ({ healthPage }) => {
    const before = await healthPage.monthSelector.getMonthText();
    await healthPage.monthSelector.clickNextMonth();
    const after = await healthPage.monthSelector.getMonthText();
    expect(after).not.toBe(before);
  });

  test('パネルから年月移動ができる', async ({ healthPage }) => {
    const before = await healthPage.monthSelector.getMonthText();
    const currentYear = new Date().getFullYear();
    await healthPage.monthSelector.selectYearMonth(currentYear - 1, 1);
    const after = await healthPage.monthSelector.getMonthText();
    expect(after).not.toBe(before);
    // テスト後に当月に戻す
    await healthPage.monthSelector.selectYearMonth(currentYear, new Date().getMonth() + 1);
  });

  test('前月移動後に当月の食事データが表示されない', async ({ foodRecordPage, page }) => {
    // フィクスチャ食事データが当月に存在することを確認してから前月に移動
    await foodRecordPage.food.expectRowVisible(FIXTURE_FOOD_NAME);
    await foodRecordPage.monthSelector.clickPrevMonth();
    await page.waitForTimeout(500); // 判定が早すぎるとローディング段階でクリアしまうため
    await foodRecordPage.food.expectRowNotVisible(FIXTURE_FOOD_NAME);
  });
});

test.describe('Healthページ > Summary', () => {
  test('FoodSummaryセクションが表示される', async ({ healthPage }) => {
    await healthPage.expectFoodSummarySectionVisible();
  });

  test('HealthSummaryセクションが表示される', async ({ healthPage }) => {
    await healthPage.expectHealthSummarySectionVisible();
  });

  test('ExerciseSummaryセクションが表示される', async ({ healthPage }) => {
    await healthPage.expectExerciseSummarySectionVisible();
  });

  test('食事記録データ追加時に FoodSummary の全項目の平均値が更新される', async ({ healthPage }) => {
    const name = uniqueContent('FoodSummary反映テスト');

    // 追加前の全項目の値を記録
    const before = {
      carb: await healthPage.getFoodCarbAverageText(),
      energy: await healthPage.getFoodEnergyAverageText(),
      fat: await healthPage.getFoodFatAverageText(),
      protein: await healthPage.getFoodProteinAverageText(),
      salt: await healthPage.getFoodSaltAverageText(),
    };

    await healthPage.addFoodRecord(name, '100', '600', {
      carb: '50',
      fat: '20',
      protein: '30',
      salt: '2',
    });

    // 全項目が更新されていることを確認
    expect(await healthPage.getFoodEnergyAverageText()).not.toBe(before.energy);
    expect(await healthPage.getFoodProteinAverageText()).not.toBe(before.protein);
    expect(await healthPage.getFoodFatAverageText()).not.toBe(before.fat);
    expect(await healthPage.getFoodCarbAverageText()).not.toBe(before.carb);
    expect(await healthPage.getFoodSaltAverageText()).not.toBe(before.salt);

    // cleanup
    await healthPage.food.deleteFromTable(name);
    await healthPage.food.expectRowNotVisible(name);
  });

  test('体調データ追加時に HealthSummary の調子の平均が更新される（5日）', async ({ healthPage }) => {
    // 月データが空であること前提
    await healthPage.addHealthRecord(5, 3);

    // データが存在すること（'--' でない）を確認する
    const after = await healthPage.getMentalAverageText();
    expect(after).not.toBe('--');

    // cleanup
    const date = `${format(new Date(), 'yyyy-MM')}-05`;
    await healthPage.health.deleteFromTable(toHealthDate(date));
    await healthPage.health.expectRowNotVisible(toHealthDate(date));
  });

  test('症状にチェックを入れると HealthSummary の症状一覧に反映される（6日）', async ({ healthPage, page }) => {
    const categoryName = (await healthPage.addHealthRecord(6, 3, { checkFirstCategory: true })) ?? '';
    // HealthSummary の症状一覧にチェックしたカテゴリーが表示されていることを確認
    await expect(page.getByTestId('health-summary').getByText(categoryName, { exact: true })).toBeVisible();

    // cleanup
    const date = `${format(new Date(), 'yyyy-MM')}-06`;
    await healthPage.health.deleteFromTable(toHealthDate(date));
    await healthPage.health.expectRowNotVisible(toHealthDate(date));
  });

  test('その他フィールドにカンマ区切りで入力した症状が HealthSummary の症状一覧に反映される（7日）', async ({
    healthPage,
    page,
  }) => {
    const symptom1 = 'その他の症状A';
    const symptom2 = 'その他の症状B';

    await healthPage.addHealthRecord(7, 3, { other: `${symptom1}, ${symptom2}` });

    // HealthSummary の症状一覧に両方の症状が表示されていることを確認
    const summary = page.getByTestId('health-summary');
    await expect(summary.getByText(symptom1, { exact: true })).toBeVisible();
    await expect(summary.getByText(symptom2, { exact: true })).toBeVisible();

    // cleanup
    const date = `${format(new Date(), 'yyyy-MM')}-07`;
    await healthPage.health.deleteFromTable(toHealthDate(date));
    await healthPage.health.expectRowNotVisible(toHealthDate(date));
  });

  test('体調データ追加時に ExerciseSummary の運動日数が更新される（8日）', async ({ healthPage }) => {
    const before = await healthPage.getExerciseCountText();
    await healthPage.addHealthRecord(8, 2, { exercise: true });
    const after = await healthPage.getExerciseCountText();
    expect(after).not.toBe(before);
    // cleanup
    const date = `${format(new Date(), 'yyyy-MM')}-08`;
    await healthPage.health.deleteFromTable(toHealthDate(date));
    await healthPage.health.expectRowNotVisible(toHealthDate(date));
  });
});
