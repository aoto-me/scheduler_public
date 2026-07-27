import { FoodForm, HealthForm } from '@/components/Health';
import { Calendar, DrawerRight, MonthlyMemoArea, TodoForm } from '@/components/Home';
import { MainContainer, MainContainerInner } from '@/components/layout';
import { MoneyForm } from '@/components/Money';
import { Modal, PageLoader } from '@/components/ui';
import { useAuthContext } from '@/contexts';
import {
  useFetchDiary,
  useFetchHealth,
  useFetchMoney,
  useFetchMonthlyMemo,
  useFetchProject,
  useFetchSettings,
  useFetchTodo,
  useModalFocusRestore,
} from '@/hooks';
import {
  selectAllFoodTotal,
  selectCalendarYearEventMap,
  selectDiaryCardByDay,
  selectDiaryState,
  selectFetchedMonths,
  selectFoodByDay,
  selectFoodDB,
  selectFoodDBStandard,
  selectFoodState,
  selectHealthCategory,
  selectHealthDataWithItemByDay,
  selectHealthState,
  selectMoneyByDay,
  selectMoneyCategoryMap,
  selectMoneyState,
  selectMonthlyMemo,
  selectMonthlyMemoByMonth,
  selectNutrition,
  selectProjectMenuFetched,
  selectProjectTitleMap,
  selectSectionFetched,
  selectTaskTimes,
  selectTodoByDay,
  selectTodoById,
  setYearEvent,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { navHeight, navWidth } from '@/styles';
import type { Food, Money } from '@/types';
import { formatDateToKey } from '@/utils';
import { Box, Container } from '@mui/material';
import { addMonths, format, subMonths } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

const EMPTY_FOODS: Food[] = [];
const EMPTY_MONEYS: Money[] = [];
const DEFAULT_FOOD_TOTAL = { carb: 0, energy: 0, fat: 0, protein: 0, salt: 0 };

const Home = () => {
  const { isPrivate } = useAuthContext();
  const dispatch = useAppDispatch();
  const { fetchFood, fetchFoodDBStandard, fetchHealth } = useFetchHealth();
  const { fetchMoney } = useFetchMoney();
  const { fetchTodo } = useFetchTodo();
  const { fetchDiary } = useFetchDiary();
  const { fetchMonthlyMemo } = useFetchMonthlyMemo();
  const { fetchProject, fetchSection } = useFetchProject();
  const {
    fetchExpenseCategory,
    fetchFoodDB,
    fetchHealthCategory,
    fetchIncomeCategory,
    fetchNutrition,
    fetchYearEvent,
  } = useFetchSettings();

  // 選択・タイプ
  const [currentDay, setCurrentDay] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentType, setCurrentType] = useState<'diary' | 'health' | 'money' | 'todo'>('todo');
  const [currentHealthType, setCurrentHealthType] = useState<'food' | 'health'>('health');

  // 開閉
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setButtonElement } = useModalFocusRestore(isModalOpen);

  // -----------------------------------------------
  // YearEvent
  // -----------------------------------------------
  const calendarYearEventMap = useAppSelector(selectCalendarYearEventMap);

  // データの取得 - yearEvent
  useEffect(() => {
    // プライベートなら空配列かつデータを取得しない
    if (isPrivate) {
      dispatch(setYearEvent([]));
      return;
    }
    if (!calendarYearEventMap) {
      void fetchYearEvent();
    }
  }, []);

  // -----------------------------------------------
  // MonthlyMemo
  // -----------------------------------------------
  const monthlyMemo = useAppSelector(selectMonthlyMemo);
  const currentMonthlyMemo = useAppSelector(state => selectMonthlyMemoByMonth(state, formatDateToKey(currentMonth)));

  // -----------------------------------------------
  // Money
  // -----------------------------------------------
  const [currentMoneyId, setCurrentMoneyId] = useState<number>(0);
  // 全件データ
  const money = useAppSelector(selectMoneyState);
  // カテゴリー
  const { expenseCategoryMap, incomeCategoryMap } = useAppSelector(selectMoneyCategoryMap);
  // 選択中の日付に紐づくMoney
  const currentDayMoneys = useAppSelector(state => selectMoneyByDay(state, currentDay));

  // データの取得 - Category
  useEffect(() => {
    if (!expenseCategoryMap) {
      void fetchExpenseCategory();
    }

    if (!incomeCategoryMap) {
      void fetchIncomeCategory();
    }
  }, []);

  // -----------------------------------------------
  // Health
  // -----------------------------------------------
  const [currentHealthId, setCurrentHealthId] = useState<number>(0);
  // 全件データ
  const health = useAppSelector(selectHealthState);
  // カテゴリー
  const healthCategory = useAppSelector(selectHealthCategory);
  const healthIconMap = useMemo(() => new Map(healthCategory?.map(c => [c.name, c.icon])), [healthCategory]);
  // HealthWithItem の選択日のデータ
  const currentDayHealth = useAppSelector(state => selectHealthDataWithItemByDay(state, currentDay));

  // データの取得 - HealthCategory
  useEffect(() => {
    if (!healthCategory || healthCategory.length === 0) {
      void fetchHealthCategory();
    }
  }, []);

  // -----------------------------------------------
  // Food
  // -----------------------------------------------
  const [currentFoodId, setCurrentFoodId] = useState<number>(0);
  // 全件データ
  const food = useAppSelector(selectFoodState);
  // 目標栄養素
  const nutrition = useAppSelector(selectNutrition);
  // FoodDB
  const foodDB = useAppSelector(selectFoodDB);
  const foodDBStandard = useAppSelector(selectFoodDBStandard);
  // 選択中の日付に紐づくFood
  const currentDayFoods = useAppSelector(state => selectFoodByDay(state, currentDay));
  // 各日のfoodの合計栄養素
  const foodTotalMap = useAppSelector(selectAllFoodTotal);
  const foodTotal = useMemo(
    () => foodTotalMap.get(format(currentDay, 'yyyy-MM-dd')) ?? DEFAULT_FOOD_TOTAL,
    [foodTotalMap, currentDay]
  );

  // データの取得 - Nutrition, FoodDB, foodDBStandard
  useEffect(() => {
    if (!nutrition || nutrition.length === 0) {
      void fetchNutrition();
    }

    if (!foodDB || foodDB.length === 0) {
      void fetchFoodDB();
    }

    if (!foodDBStandard || foodDBStandard.length === 0) {
      void fetchFoodDBStandard();
    }
  }, []);

  // -----------------------------------------------
  // Todo
  // -----------------------------------------------
  const [currentTodoId, setCurrentTodoId] = useState<number>(0);
  const projectFetched = useAppSelector(selectProjectMenuFetched);
  const sectionFetched = useAppSelector(selectSectionFetched);
  const projectTitleMap = useAppSelector(selectProjectTitleMap);
  // id別のtaskTime
  const taskTime = useAppSelector(selectTaskTimes);
  // 月別データの取得フラグ
  const todoFetched = useAppSelector(selectFetchedMonths);
  // 選択中の日付に紐づくTodo
  const currentDayTodos = useAppSelector(state => selectTodoByDay(state, isPrivate ?? false, currentDay));
  // 選択Idのデータ
  const currentTodo = useAppSelector(state => selectTodoById(state, currentTodoId));

  // データの取得 - Project
  useEffect(() => {
    if (projectFetched && projectTitleMap) return;
    void fetchProject();
  }, []);

  // データの取得 - Section
  useEffect(() => {
    if (sectionFetched) return;
    void fetchSection();
  }, []);

  // -----------------------------------------------
  // Diary
  // -----------------------------------------------
  // 全件データ
  const diary = useAppSelector(selectDiaryState);
  // 選択中の日付に紐づくDiary
  const currentDayDiaryCard = useAppSelector(state => selectDiaryCardByDay(state, currentDay));

  // -----------------------------------------------
  // 選択月が変更されたらデータを取得
  // -----------------------------------------------
  useEffect(() => {
    // 当月、来月、先月のデータがあるか調べる、なければ取得する
    const months = [currentMonth, addMonths(currentMonth, 1), subMonths(currentMonth, 1)];
    for (const date of months) {
      const key = formatDateToKey(date);
      // 未取得 or keyのデータがなければ、データを取得する
      if (!todoFetched[key]) void fetchTodo(date);
      if (!money[key]?.fetched) void fetchMoney(date, 'month');
      if (!health[key]?.fetched && !isPrivate) void fetchHealth(date);
      if (!food[key]?.fetched) void fetchFood(date);
      if (!diary[key]?.fetched && !isPrivate) void fetchDiary(date);
      if (!monthlyMemo[key]) void fetchMonthlyMemo(date);
    }
  }, [currentMonth]);

  if (
    !calendarYearEventMap ||
    !incomeCategoryMap ||
    !expenseCategoryMap ||
    !healthCategory ||
    !nutrition ||
    !projectTitleMap
  ) {
    return (
      <MainContainer>
        <MainContainerInner>
          <PageLoader />
        </MainContainerInner>
      </MainContainer>
    );
  }

  return (
    <>
      <Container
        component="main"
        disableGutters
        maxWidth={false}
        sx={{
          display: 'flex',
          minHeight: '100svh',
          paddingBottom: { md: 0, xs: navHeight },
          paddingLeft: { md: navWidth, xs: 0 },
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Calendar
            currentDay={currentDay}
            currentType={currentType}
            healthIconMap={healthIconMap}
            setCurrentDay={setCurrentDay}
            setCurrentMonth={setCurrentMonth}
            setCurrentTodoId={setCurrentTodoId}
            setCurrentType={setCurrentType}
            setIsDrawerOpen={setIsDrawerOpen}
            setIsModalOpen={setIsModalOpen}
          />
          <MonthlyMemoArea
            currentMonth={currentMonth}
            key={`monthlyMemo-${String(currentMonthlyMemo?.id ?? 0)}`}
            monthlyMemo={currentMonthlyMemo}
          />
        </Box>
        <DrawerRight
          currentDay={currentDay}
          currentDayDiary={currentDayDiaryCard}
          currentDayFoods={currentDayFoods ?? EMPTY_FOODS}
          currentDayHealth={currentDayHealth}
          currentDayMoneys={currentDayMoneys ?? EMPTY_MONEYS}
          currentDayTodos={currentDayTodos}
          currentType={currentType}
          foodTotal={foodTotal}
          healthIconMap={healthIconMap}
          isDrawerOpen={isDrawerOpen}
          setButtonElement={setButtonElement}
          setCurrentFoodId={setCurrentFoodId}
          setCurrentHealthId={setCurrentHealthId}
          setCurrentHealthType={setCurrentHealthType}
          setCurrentMoneyId={setCurrentMoneyId}
          setCurrentTodoId={setCurrentTodoId}
          setIsDrawerOpen={setIsDrawerOpen}
          setIsModalOpen={setIsModalOpen}
        />
      </Container>
      <Modal isLoading={isLoading} isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        {currentType === 'todo' && (
          <TodoForm
            currentDay={currentDay}
            currentTodoId={currentTodoId}
            setCurrentTodoId={setCurrentTodoId}
            setIsLoading={setIsLoading}
            setIsModalOpen={setIsModalOpen}
            taskTime={currentTodo ? (taskTime[currentTodo.id] ?? []) : []}
            todo={currentTodo}
          />
        )}
        {currentType === 'money' && (
          <MoneyForm
            currentDay={format(currentDay, 'yyyy-MM-dd')}
            currentMoneyId={currentMoneyId}
            setCurrentMoneyId={setCurrentMoneyId}
            setIsLoading={setIsLoading}
            setIsModalOpen={setIsModalOpen}
          />
        )}

        {currentType === 'health' && currentHealthType === 'health' && (
          <HealthForm
            currentDay={format(currentDay, 'yyyy-MM-dd')}
            currentHealthId={currentHealthId}
            setCurrentHealthId={setCurrentHealthId}
            setIsLoading={setIsLoading}
            setIsModalOpen={setIsModalOpen}
          />
        )}
        {currentType === 'health' && currentHealthType === 'food' && (
          <FoodForm
            currentDay={format(currentDay, 'yyyy-MM-dd')}
            currentFoodId={currentFoodId}
            setCurrentFoodId={setCurrentFoodId}
            setIsLoading={setIsLoading}
            setIsModalOpen={setIsModalOpen}
          />
        )}
      </Modal>
    </>
  );
};

export default Home;
