import { BalanceBarChart, BalanceSummary, CategoryPieChart, MoneyForm } from '@/components/Money';
import { Modal, MonthSelector, Private, SectionTitle, Table } from '@/components/ui';
import { useAuthContext } from '@/contexts';
import { useFetchMoney, useFetchSettings, useModalFocusRestore } from '@/hooks';
import {
  selectMoneyBalanceByYear,
  selectMoneyCategories,
  selectMonthlyCategoryTotals,
  selectMonthlyMoneyGridRows,
  useAppSelector,
} from '@/redux';
import { center } from '@/styles';
import { theme } from '@/theme';
import type { MoneyType } from '@/types';
import { formatDateToKey } from '@/utils';
import { Box, Paper, Stack, useMediaQuery } from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const paperStyle = {
  ...center,
  borderRadius: '6px',
  minHeight: '350px',
  p: 2,
  width: '100%',
};

const Money = () => {
  const { isPrivate } = useAuthContext();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<MoneyType>('支出');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMoneyId, setCurrentMoneyId] = useState<number>(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { expenseCategory, incomeCategory } = useAppSelector(selectMoneyCategories);
  const gridRows = useAppSelector(state => selectMonthlyMoneyGridRows(state, formatDateToKey(currentMonth)));
  const moneyBalance = useAppSelector(state => selectMoneyBalanceByYear(state, currentMonth.getFullYear()));
  const categoryTotals = useAppSelector(state => selectMonthlyCategoryTotals(state, formatDateToKey(currentMonth)));
  const fetchedYearsRef = useRef<Set<number>>(new Set());
  const { fetchMoney } = useFetchMoney();
  const { fetchExpenseCategory, fetchIncomeCategory } = useFetchSettings();

  // データの取得 - Money
  useEffect(() => {
    if (isPrivate) return;

    const year = currentMonth.getFullYear();

    if (fetchedYearsRef.current.has(year)) return;

    fetchedYearsRef.current.add(year);
    void fetchMoney(currentMonth, 'year');
  }, [currentMonth]);

  // データの取得 - Category
  useEffect(() => {
    if (!expenseCategory || expenseCategory.length === 0) {
      void fetchExpenseCategory();
    }

    if (!incomeCategory || incomeCategory.length === 0) {
      void fetchIncomeCategory();
    }
  }, []);

  /**
   * 凡例文の高さの調整
   */
  const chartPaperRef = useRef<HTMLDivElement>(null);
  const barPaperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const chartPaper = chartPaperRef.current;
    const barPaper = barPaperRef.current;
    if (!chartPaper || !barPaper) return;

    const updateHeights = () => {
      const expenseCount = categoryTotals ? categoryTotals.expense.length : 0;
      const incomeCount = categoryTotals ? categoryTotals.income.length : 0;

      if (expenseCount === 0 && incomeCount === 0) {
        chartPaper.style.height = '350px';
        barPaper.style.height = '350px';
        return;
      }

      const legendEl = chartPaper.querySelector('.MuiChartsLegend-root.MuiChartsLegend-vertical');
      if (!legendEl) return;

      const selectHeight = chartPaper.querySelector('.MuiFormControl-root')?.clientHeight ?? 0;
      const legendHeight = legendEl.clientHeight || 0;
      const padding = 48;

      const chartHeight = selectHeight + legendHeight + padding;

      chartPaper.style.height = `${String(chartHeight)}px`;
      barPaper.style.height = isMobile ? '350px' : `${String(chartHeight)}px`;
    };

    // 初回実行
    updateHeights();

    // legend の変更を監視
    const observer = new MutationObserver(() => {
      updateHeights();
    });

    observer.observe(chartPaper, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [isMobile, categoryTotals, selectedType]);

  const { setButtonElement } = useModalFocusRestore(isModalOpen);

  if (isPrivate) {
    return <Private />;
  }

  return (
    <>
      <Stack
        spacing={6}
        sx={{
          height: '100%',
        }}
      >
        <MonthSelector currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
        <Stack direction={isMobile ? 'column' : 'row'} spacing={isMobile ? 6 : 2}>
          <Paper
            ref={chartPaperRef}
            sx={{
              flexDirection: 'column',
              ...paperStyle,
            }}
            variant="outlined"
          >
            {categoryTotals && (
              <CategoryPieChart
                categoryTotals={categoryTotals}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
            )}
          </Paper>
          <Paper
            ref={barPaperRef}
            sx={{
              ...paperStyle,
            }}
            variant="outlined"
          >
            <BalanceBarChart moneyBalance={moneyBalance ? moneyBalance.monthly : null} />
          </Paper>
        </Stack>
        <Table
          expenseCategory={expenseCategory ?? []}
          gridRows={gridRows}
          incomeCategory={incomeCategory ?? []}
          setButtonElement={setButtonElement}
          setCurrentId={setCurrentMoneyId}
          setIsModalOpen={setIsModalOpen}
          table="money"
        />
        <Box>
          <SectionTitle title={`${String(currentMonth.getFullYear())}年 収支一覧`} />
          <BalanceSummary
            balanceByMonthly={moneyBalance?.monthly ?? null}
            balanceByYear={moneyBalance?.yearly ?? null}
            currentYear={currentMonth.getFullYear()}
          />
        </Box>
      </Stack>

      <Modal isLoading={isLoading} isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <MoneyForm
          currentDay={format(currentMonth, 'yyyy-MM-dd')}
          currentMoneyId={currentMoneyId}
          setCurrentMoneyId={setCurrentMoneyId}
          setIsLoading={setIsLoading}
          setIsModalOpen={setIsModalOpen}
        />
      </Modal>
    </>
  );
};

export default Money;
