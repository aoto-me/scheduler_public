import { ICONS } from '@/configs';
import { bgBlack, center, fontSerif } from '@/styles';
import { theme } from '@/theme';
import type { BalanceByMonthly, BalanceByYear } from '@/types';
import { Box, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import * as Icons from '@remixicon/react';
import { memo } from 'react';
import { Icon, Loader } from '../ui';

interface BalanceSummaryProps {
  balanceByMonthly: BalanceByMonthly[] | null;
  balanceByYear: BalanceByYear[] | null;
  currentYear: number;
}

const yearEmptyData = [
  {
    amount: null,
    icon: ICONS.arrowRightUp as keyof typeof Icons,
    label: '収入',
    type: 'income',
  },
  {
    amount: null,
    icon: ICONS.arrowRightDown as keyof typeof Icons,
    label: '支出',
    type: 'expense',
  },
  {
    amount: null,
    icon: ICONS.lineChart as keyof typeof Icons,
    label: '収支',
    type: 'balance',
  },
];

const monthlyEmptyData = [
  { expense: null, income: null, month: '1月' },
  { expense: null, income: null, month: '2月' },
  { expense: null, income: null, month: '3月' },
  { expense: null, income: null, month: '4月' },
  { expense: null, income: null, month: '5月' },
  { expense: null, income: null, month: '6月' },
  { expense: null, income: null, month: '7月' },
  { expense: null, income: null, month: '8月' },
  { expense: null, income: null, month: '9月' },
  { expense: null, income: null, month: '10月' },
  { expense: null, income: null, month: '11月' },
  { expense: null, income: null, month: '12月' },
];

export const BalanceSummary = memo(({ balanceByMonthly, balanceByYear, currentYear }: BalanceSummaryProps) => (
  <Grid container spacing={2}>
    {(balanceByYear ?? yearEmptyData).map(data => (
      <Grid key={data.type} size={{ sm: 4, xs: 12 }}>
        <Stack
          spacing={2}
          sx={{
            borderRadius: '6px',
            p: 2,
            position: 'relative',
            ...bgBlack,
            '&::before': {
              border: '1px solid #fff',
              borderRadius: '4px',
              content: "''",
              height: 'calc(100% - 8px)',
              left: '50%',
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 8px)',
              zIndex: 2,
            },
          }}
        >
          <span
            style={{
              color: theme.palette.grey[200],
              fontSize: '0.875rem',
              letterSpacing: '0.075em',
            }}
          >
            <Icon color="#fff" icon={data.icon} style={{ marginRight: '0.5rem' }} />
            年間{data.label}
          </span>
          {data.amount === null ? (
            <Box
              sx={{
                height: '32px',
                width: '100%',
                ...center,
              }}
            >
              <CircularProgress color="secondary" size={20} />
            </Box>
          ) : (
            <Typography
              sx={{
                color: '#fff',
                fontWeight: 700,
                textAlign: 'right',
                ...fontSerif,
              }}
              variant="h6"
            >
              ¥ {data.amount.toLocaleString('ja-JP')}
            </Typography>
          )}
        </Stack>
      </Grid>
    ))}
    {(balanceByMonthly ?? monthlyEmptyData).map((data, index) => (
      <Grid key={index} size={{ lg: 3, md: 4, sm: 6, xs: 12 }}>
        <Paper
          sx={{
            borderRadius: '6px',
            p: 2,
            width: '100%',
          }}
          variant="outlined"
        >
          <Typography
            component="h4"
            sx={{
              ...fontSerif,
              fontWeight: 700,
            }}
            variant="body1"
          >
            {currentYear}年{index + 1}月
          </Typography>
          {data.income === null ? (
            <Loader
              style={{
                height: '110px',
              }}
            />
          ) : (
            <>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: theme.palette.incomeColor.light,
                    borderRadius: '2px',
                    lineHeight: 1,
                    padding: '6px',
                  }}
                >
                  <Icon color={theme.palette.incomeColor.dark} icon={ICONS.arrowRightUp} size="1rem" />
                </span>

                <span>¥ {data.income.toLocaleString('ja-JP')}</span>
              </Stack>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginTop: '0.35rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: theme.palette.expenseColor.light,
                    borderRadius: '2px',
                    lineHeight: 1,
                    padding: '6px',
                  }}
                >
                  <Icon color={theme.palette.expenseColor.dark} icon={ICONS.arrowRightDown} size="1rem" />
                </span>
                <span>¥ {data.expense.toLocaleString('ja-JP')}</span>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'flex-start',
                  borderTop: `solid 1px ${theme.palette.divider}`,
                  justifyContent: 'space-between',
                  marginTop: '0.6rem',
                  paddingTop: '0.25rem',
                }}
              >
                <span
                  style={{
                    borderRight: `solid 1px ${theme.palette.divider}`,
                    color: theme.palette.secondary.dark,
                    fontSize: '0.875rem',
                    letterSpacing: '0.075em',
                    marginTop: '3px',
                    paddingRight: '0.5rem',
                  }}
                >
                  収支
                </span>
                <span
                  style={{
                    fontWeight: 700,
                  }}
                >
                  ¥ {(data.income - data.expense).toLocaleString('ja-JP')}
                </span>
              </Stack>
            </>
          )}
        </Paper>
      </Grid>
    ))}
  </Grid>
));
