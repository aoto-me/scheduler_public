import { ExerciseSummary, FoodForm, FoodSummary, HealthForm, HealthSummary } from '@/components/Health';
import { Modal, MonthSelector, Private, SectionTitle, Table } from '@/components/ui';
import { useAuthContext } from '@/contexts';
import { useFetchHealth, useFetchSettings, useModalFocusRestore } from '@/hooks';
import {
  selectFoodAverageAndTotalByMonth,
  selectFoodDB,
  selectFoodDBStandard,
  selectHealthCategory,
  selectIsFoodFetchedForMonth,
  selectIsHealthFetchedForMonth,
  selectMonthlyAverageMental,
  selectMonthlyExerciseCount,
  selectMonthlyFoodGridRows,
  selectMonthlyHealthGridRows,
  selectMonthlyHealthItemNames,
  selectNutrition,
  useAppSelector,
} from '@/redux';
import { center } from '@/styles';
import { theme } from '@/theme';
import { formatDateToKey } from '@/utils';
import { Box, Paper, Stack, useMediaQuery } from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

const paperStyle = {
  borderRadius: '6px',
  p: 2,
};

const Health = () => {
  const { isPrivate } = useAuthContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formType, setFormType] = useState<string>('health');
  const [currentHealthId, setCurrentHealthId] = useState<number>(0);
  const [currentFoodId, setCurrentFoodId] = useState<number>(0);
  const { fetchFood, fetchFoodDBStandard, fetchHealth } = useFetchHealth();
  const { fetchFoodDB, fetchHealthCategory, fetchNutrition } = useFetchSettings();

  // Health
  const healthFetched = useAppSelector(state => selectIsHealthFetchedForMonth(state, formatDateToKey(currentMonth)));
  const healthCategory = useAppSelector(selectHealthCategory);
  const monthlyHealthItemNames = useAppSelector(state =>
    selectMonthlyHealthItemNames(state, formatDateToKey(currentMonth))
  );
  const monthlyAverageMental = useAppSelector(state =>
    selectMonthlyAverageMental(state, formatDateToKey(currentMonth))
  );
  const monthlyExerciseCount = useAppSelector(state =>
    selectMonthlyExerciseCount(state, formatDateToKey(currentMonth))
  );
  const healthGridRows = useAppSelector(state => selectMonthlyHealthGridRows(state, formatDateToKey(currentMonth)));

  // Food
  const foodFetched = useAppSelector(state => selectIsFoodFetchedForMonth(state, formatDateToKey(currentMonth)));
  const foodDB = useAppSelector(selectFoodDB);
  const foodDBStandard = useAppSelector(selectFoodDBStandard);
  const nutrition = useAppSelector(selectNutrition);
  const { average } = useAppSelector(state => selectFoodAverageAndTotalByMonth(state, formatDateToKey(currentMonth)));
  const foodGridRows = useAppSelector(state => selectMonthlyFoodGridRows(state, formatDateToKey(currentMonth)));

  // データの取得 - Health(1か月分)
  useEffect(() => {
    if (isPrivate) return;
    if (healthFetched) return;
    void fetchHealth(currentMonth);
  }, [currentMonth, fetchHealth]);

  // データの取得 - Food(1か月分)
  useEffect(() => {
    if (isPrivate) return;
    if (foodFetched) return;
    void fetchFood(currentMonth);
  }, [currentMonth, fetchFood]);

  // データの取得 - Setting
  useEffect(() => {
    if (!healthCategory || healthCategory.length === 0) {
      void fetchHealthCategory();
    }

    if (!foodDB || foodDB.length === 0) {
      void fetchFoodDB();
    }

    if (!nutrition || nutrition.length === 0) {
      void fetchNutrition();
    }

    if (!foodDBStandard || foodDBStandard.length === 0) {
      void fetchFoodDBStandard();
    }
  }, []);

  const { setButtonElement } = useModalFocusRestore(isModalOpen);

  /***
   * summaryの高さを揃えるための処理
   */
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState(350);

  useEffect(() => {
    if (!boxRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setBoxHeight(entry.contentRect.height);
      }
    });

    observer.observe(boxRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (isPrivate) {
    return <Private />;
  }

  return (
    <>
      <Stack spacing={6}>
        <MonthSelector currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{
            alignItems: 'stretch',
          }}
        >
          <Paper
            sx={{
              height: {
                md: boxHeight ? `${String(boxHeight)}px` : '350px',
                sm: '350px',
                xs: 'auto',
              },
              minHeight: '340px',
              width: { md: '60%', xs: '100%' },
              ...paperStyle,
            }}
            variant="outlined"
          >
            <FoodSummary average={average} nutrition={nutrition ? nutrition[0] : null} />
          </Paper>
          <Stack
            direction={'column'}
            ref={boxRef}
            spacing={2}
            sx={{
              justifyContent: 'space-between',
              minWidth: { md: '280px', xs: 'none' },
              width: { md: '40%', xs: '100%' },
            }}
          >
            <Paper
              sx={{
                height: '100%',
                width: '100%',
                ...center,
                ...paperStyle,
              }}
              variant="outlined"
            >
              <HealthSummary average={monthlyAverageMental} healthItemNames={monthlyHealthItemNames} />
            </Paper>
            <Paper
              sx={{
                width: '100%',
                ...paperStyle,
              }}
              variant="outlined"
            >
              <ExerciseSummary count={monthlyExerciseCount} currentMonth={currentMonth} />
            </Paper>
          </Stack>
        </Stack>

        <Box>
          <SectionTitle title="食事記録" />
          <Table
            gridRows={foodGridRows}
            setButtonElement={setButtonElement}
            setCurrentId={setCurrentFoodId}
            setFormType={setFormType}
            setIsModalOpen={setIsModalOpen}
            table="food"
          />
        </Box>

        <Box>
          <SectionTitle title="体調" />
          <Table
            gridRows={healthGridRows}
            iconMap={healthCategory ? new Map(healthCategory.map(item => [item.name, item.icon])) : new Map()}
            setButtonElement={setButtonElement}
            setCurrentId={setCurrentHealthId}
            setFormType={setFormType}
            setIsModalOpen={setIsModalOpen}
            table="health"
          />
        </Box>
      </Stack>

      <Modal isLoading={isLoading} isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        {formType === 'food' && (
          <FoodForm
            currentDay={format(currentMonth, 'yyyy-MM-dd')}
            currentFoodId={currentFoodId}
            setCurrentFoodId={setCurrentFoodId}
            setIsLoading={setIsLoading}
            setIsModalOpen={setIsModalOpen}
          />
        )}
        {formType === 'health' && (
          <HealthForm
            currentDay={format(currentMonth, 'yyyy-MM-dd')}
            currentHealthId={currentHealthId}
            setCurrentHealthId={setCurrentHealthId}
            setIsLoading={setIsLoading}
            setIsModalOpen={setIsModalOpen}
          />
        )}
      </Modal>
    </>
  );
};

export default Health;
