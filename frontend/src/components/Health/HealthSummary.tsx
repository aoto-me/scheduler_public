import { selectHealthCategory, useAppSelector } from '@/redux';
import { fontSerif } from '@/styles';
import { theme } from '@/theme';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { memo, useMemo } from 'react';
import { convertToRemixIcon, Icon, Loader } from '../ui';
import { MentalIcons } from './MentalIcons';

interface HealthSummaryProps {
  average: {
    average: number;
    icon: number;
  };
  healthItemNames: null | string[];
}

export const HealthSummary = memo(({ average, healthItemNames }: HealthSummaryProps) => {
  const healthCategory = useAppSelector(selectHealthCategory);
  const iconMap = useMemo(() => {
    if (!healthCategory) return null;
    return new Map(healthCategory.map(item => [item.name, item.icon]));
  }, [healthCategory]);

  if (!iconMap || !healthItemNames) {
    return (
      <Loader
        style={{
          height: '100%',
          minHeight: '150px',
        }}
      />
    );
  }

  return (
    <Box data-testid="health-summary" sx={{ width: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', padding: '0.75rem 0.5rem 1rem' }}>
        <p
          style={{
            fontSize: '3.5rem',
            lineHeight: 1,
            marginRight: '1rem',
          }}
        >
          {average.icon > 0 ? (
            MentalIcons[average.icon].icon
          ) : (
            <SentimentSatisfiedIcon
              color="disabled"
              sx={{
                fontSize: 'inherit',
              }}
            />
          )}
        </p>
        <Box>
          <Typography color={theme.palette.secondary.dark} variant={'subtitle2'}>
            調子の平均
          </Typography>
          {average.average === 0 ? (
            <Typography color={theme.palette.text.disabled} data-testid="mental-average-value" variant="h5">
              --
            </Typography>
          ) : (
            <Typography
              data-testid="mental-average-value"
              sx={{
                ...fontSerif,
                fontWeight: 700,
              }}
              variant="h5"
            >
              {average.average}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider
        sx={{
          '&::before': {
            width: '0%',
          },
          '& >.MuiDivider-wrapper': {
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          },
          marginBottom: '0.75rem',
        }}
        textAlign="left"
      >
        症状一覧
      </Divider>
      {healthItemNames.length > 0 ? (
        <>
          {healthItemNames.map((item: string, index: number) => (
            <Chip
              icon={
                <Icon
                  icon={convertToRemixIcon(iconMap.get(item) ?? 'dossier-line')}
                  style={{
                    flexShrink: 0,
                    marginLeft: '0.25rem',
                    marginRight: '-0.25rem',
                  }}
                />
              }
              key={`healthItemName-${String(index)}`}
              label={item}
              size="small"
              sx={{
                height: 'auto',
                margin: '4px',
                padding: '3px',
              }}
            />
          ))}
        </>
      ) : (
        <Typography
          color={theme.palette.text.disabled}
          sx={{
            padding: '0.25rem 0 0.75rem',
            textAlign: 'center',
          }}
          variant="body2"
        >
          症状はありません
        </Typography>
      )}
    </Box>
  );
});
