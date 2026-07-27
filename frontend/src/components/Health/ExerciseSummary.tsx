import { ICONS } from '@/configs';
import { fontSerif } from '@/styles';
import { theme } from '@/theme';
import { Stack, Typography } from '@mui/material';
import { getDaysInMonth } from 'date-fns';
import { memo, useMemo } from 'react';
import { Icon, Loader } from '../ui';

interface ExerciseSummaryProps {
  count: number;
  currentMonth: Date;
}

export const ExerciseSummary = memo(({ count, currentMonth }: ExerciseSummaryProps) => {
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  if (!daysInMonth) {
    return (
      <Loader
        style={{
          height: '100%',
          minHeight: '78px',
        }}
      />
    );
  }

  return (
    <>
      <Stack direction="row" sx={{ alignItems: 'center', mb: '1.25rem' }}>
        <Icon icon={ICONS.runFill} size="1.5rem" style={{ marginRight: '0.25rem' }} />
        <Typography
          color={theme.palette.secondary.dark}
          sx={{
            lineHeight: 1.5,
          }}
          variant={'subtitle2'}
        >
          運動した日
        </Typography>
      </Stack>
      <Typography
        data-testid="exercise-count-value"
        sx={{ ...fontSerif, fontWeight: 700, textAlign: 'right' }}
        variant="h5"
      >
        {`${String(count)}日 / `}
        <span style={{ fontSize: '1rem' }}>{`${String(daysInMonth)}日`}</span>
      </Typography>
    </>
  );
});
