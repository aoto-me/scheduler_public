import { PrivateSwitch, SettingSection } from '@/components/Setting';
import { useFetchSettings } from '@/hooks';
import {
  selectFoodDB,
  selectHealthCategory,
  selectMoneyCategories,
  selectNutrition,
  selectRssList,
  selectYearEvent,
  useAppSelector,
} from '@/redux';
import type { YearEvent } from '@/types';
import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';

// DataTable用に string → Date に変換
const normalizeEvents = (events: YearEvent[]): YearEvent[] =>
  events.map(event => ({
    ...event,
    date: new Date(event.date),
  }));

const Setting = () => {
  const [gridYearEvent, setGridYearEvent] = useState<null | YearEvent[]>(null);
  const yearEvent = useAppSelector(selectYearEvent);
  const { expenseCategory, incomeCategory } = useAppSelector(selectMoneyCategories);
  const healthCategory = useAppSelector(selectHealthCategory);
  const foodDB = useAppSelector(selectFoodDB);
  const nutrition = useAppSelector(selectNutrition);
  const rssList = useAppSelector(selectRssList);
  const {
    fetchExpenseCategory,
    fetchFoodDB,
    fetchHealthCategory,
    fetchIncomeCategory,
    fetchNutrition,
    fetchRssList,
    fetchYearEvent,
  } = useFetchSettings();

  useEffect(() => {
    const fetchGridYearEvent = async () => {
      if (yearEvent && yearEvent.length > 0) {
        setGridYearEvent(normalizeEvents(yearEvent));
        return;
      }

      const responseData = await fetchYearEvent();
      if (!responseData) return;
      setGridYearEvent(normalizeEvents(responseData));
    };

    void fetchGridYearEvent();

    if (!expenseCategory || expenseCategory.length === 0) {
      void fetchExpenseCategory();
    }

    if (!incomeCategory || incomeCategory.length === 0) {
      void fetchIncomeCategory();
    }

    if (!healthCategory || healthCategory.length === 0) {
      void fetchHealthCategory();
    }

    if (!foodDB || foodDB.length === 0) {
      void fetchFoodDB();
    }

    if (!nutrition || nutrition.length === 0) {
      void fetchNutrition();
    }

    if (!rssList || rssList.length === 0) {
      void fetchRssList();
    }
  }, []);

  return (
    <Stack spacing={6}>
      <PrivateSwitch />

      <SettingSection
        data={rssList}
        description={
          <>
            RSSの有無を調べる：
            <a
              href="https://berss.com/feed"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
              }}
              target="_blank"
            >
              RSSフィード取得・検出ツール
            </a>
          </>
        }
        table="rss"
        title="RSS"
      />

      <SettingSection
        data={incomeCategory}
        description={
          <>
            アイコンは
            <a
              href="https://remixicon.com"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
              }}
              target="_blank"
            >
              Remix Icon（version 4.8.0）
            </a>
            を利用
          </>
        }
        table="incomeCategory"
        title="収入カテゴリー"
      />

      <SettingSection
        data={expenseCategory}
        description={
          <>
            アイコンは
            <a
              href="https://remixicon.com"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
              }}
              target="_blank"
            >
              Remix Icon（version 4.8.0）
            </a>
            を利用
          </>
        }
        table="expenseCategory"
        title="支出カテゴリー"
      />

      <SettingSection
        data={healthCategory}
        description={
          <>
            アイコンは
            <a
              href="https://remixicon.com"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
              }}
              target="_blank"
            >
              Remix Icon（version 4.8.0）
            </a>
            を利用
          </>
        }
        table="healthCategory"
        title="体調カテゴリー"
      />

      <SettingSection
        data={foodDB}
        description={
          <>
            <a
              href="https://fooddb.mext.go.jp/"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
              }}
              target="_blank"
            >
              食品成分データベース
            </a>
            の内容は既に登録済み（全て100gあたりの数値）。
            <br />
            100gあたり、もしくは1個あたりの数値を登録すると自動入力が可能になる。
            <br />
            名称が被った場合、後に登録したものに上書きされるため、登録時は名称被りに注意。
          </>
        }
        table="foodDB"
        title="食品栄養データベース"
      />

      <SettingSection data={nutrition} table="nutrition" title="1日の目標栄養値" />

      <SettingSection
        data={gridYearEvent}
        description={
          <>
            カレンダー上に表示する毎年共通の日付のイベントを登録。
            <br />
            登録した日付の年部分は表示に関係なし。
          </>
        }
        table="yearEvent"
        title="年間イベント"
      />
    </Stack>
  );
};

export default Setting;
