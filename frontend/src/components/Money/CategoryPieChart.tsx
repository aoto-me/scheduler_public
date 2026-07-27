import { theme } from '@/theme';
import type { MoneyType, PieChartData } from '@/types';
import { convertHexToRgb, convertRgbToHex } from '@/utils/color';
import { FormControl, MenuItem, Select } from '@mui/material';
import { type SelectChangeEvent } from '@mui/material/Select';
import { legendClasses } from '@mui/x-charts';
import { PieChart } from '@mui/x-charts/PieChart';
import { type Dispatch, memo, type SetStateAction, useCallback, useMemo } from 'react';
import { Loader } from '../ui';

interface CategoryPieChartProps {
  categoryTotals: null | {
    expense: PieChartData[];
    income: PieChartData[];
  };
  selectedType: MoneyType;
  setSelectedType: Dispatch<SetStateAction<MoneyType>>;
}

// 色Aから色Bまでを分割した配列を生成する関数
const generateGradientColors = (colorA: string, colorB: string, steps: number) => {
  if (steps <= 1) {
    return [colorA]; // ステップが1以下の場合は、開始色のみを返す
  }
  const rgbA = convertHexToRgb(colorA);
  const rgbB = convertHexToRgb(colorB);
  const colors = Array.from({ length: steps }, (_, i) => {
    const ratio = i / (steps - 1); // 0から1までの割合
    const r = Math.round(rgbA.r + ratio * (rgbB.r - rgbA.r));
    const g = Math.round(rgbA.g + ratio * (rgbB.g - rgbA.g));
    const b = Math.round(rgbA.b + ratio * (rgbB.b - rgbA.b));
    return convertRgbToHex(r, g, b);
  });
  return colors;
};

export const CategoryPieChart = memo(({ categoryTotals, selectedType, setSelectedType }: CategoryPieChartProps) => {
  const handleTypeChange = useCallback(
    (e: SelectChangeEvent<'収入' | '支出'>) => {
      setSelectedType(e.target.value);
    },
    [setSelectedType]
  );

  const incomeColors = useMemo(() => {
    if (!categoryTotals) return null;
    const hasOther = categoryTotals.income.some(item => item.label === 'その他');
    const step = hasOther ? categoryTotals.income.length - 1 : categoryTotals.income.length;
    return generateGradientColors(theme.palette.incomeColor.dark, theme.palette.incomeColor.light, step);
  }, [categoryTotals]);

  const expenseColors = useMemo(() => {
    if (!categoryTotals) return null;
    const hasOther = categoryTotals.expense.some(item => item.label === 'その他');
    const step = hasOther ? categoryTotals.expense.length - 1 : categoryTotals.expense.length;
    return generateGradientColors(theme.palette.expenseColor.dark, theme.palette.expenseColor.light, step);
  }, [categoryTotals]);

  if (!incomeColors || !expenseColors || !categoryTotals) {
    return <Loader style={{ height: '100%' }} />;
  }

  return (
    <>
      <FormControl fullWidth>
        <Select
          id="type-select"
          inputProps={{ 'aria-label': '表示する収支の種類' }}
          labelId="type-select-label"
          onChange={handleTypeChange}
          size="small"
          sx={{
            marginBottom: '1rem',
          }}
          value={selectedType}
        >
          <MenuItem value="収入">収入</MenuItem>
          <MenuItem value="支出">支出</MenuItem>
        </Select>
      </FormControl>
      <PieChart
        colors={selectedType === '収入' ? incomeColors : expenseColors}
        data-testid="category-pie-chart"
        series={[
          {
            data: selectedType === '収入' ? categoryTotals.income : categoryTotals.expense,
          },
        ]}
        slotProps={{
          legend: {
            sx: {
              [`.${legendClasses.mark}`]: {
                height: 15,
                width: 15,
              },
              columnGap: '12px',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.35,
              rowGap: '8px',
            },
          },
        }}
        sx={{
          height: 'calc(100% - 56px)',
          width: '100%',
        }}
      />
    </>
  );
});
