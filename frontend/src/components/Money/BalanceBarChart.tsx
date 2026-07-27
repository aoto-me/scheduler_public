import { theme } from '@/theme';
import { legendClasses } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { memo } from 'react';
import { Loader } from '../ui';

const valueFormatter = (value: null | number) => `¥ ${String(value?.toLocaleString('ja-JP'))}`;

interface BalanceBarChartProps {
  moneyBalance: null | { expense: number; income: number; month: string }[];
}

export const BalanceBarChart = memo(({ moneyBalance }: BalanceBarChartProps) => {
  if (!moneyBalance) {
    return <Loader style={{ height: '100%' }} />;
  }

  return (
    <BarChart
      colors={[theme.palette.incomeColor.dark, theme.palette.expenseColor.dark]}
      data-testid="balance-bar-chart"
      dataset={moneyBalance}
      margin={{ bottom: 0, left: 0, right: 16, top: 10 }}
      series={[
        { dataKey: 'income', label: '収入', valueFormatter },
        { dataKey: 'expense', label: '支出', valueFormatter },
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
        height: '100%',
        width: '100%',
      }}
      xAxis={[
        {
          data: moneyBalance.map(data => data.month),
          scaleType: 'band',
        },
      ]}
    />
  );
});
