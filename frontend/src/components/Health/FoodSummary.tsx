import { fontSerif } from '@/styles';
import { theme } from '@/theme';
import type { Nutrition } from '@/types';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { memo, useEffect, useRef, useState } from 'react';
import { Loader } from '../ui';

interface AverageTextProps {
  average: number;
  label: string;
  targetValue: number;
}

const AverageText = memo(({ average, label, targetValue }: AverageTextProps) => (
  <Box
    sx={{
      alignItems: 'flex-start',
      display: 'flex',
      justifyContent: 'flex-end',
    }}
  >
    <span
      style={{
        backgroundColor: theme.palette.grey[200],
        border: `1px solid ${theme.palette.secondary.main}`,
        borderRadius: '999px',
        color: theme.palette.text.secondary,
        fontSize: '0.75rem',
        lineHeight: 1,
        marginRight: '0.75rem',
        marginTop: '0.25rem',
        padding: '0.35rem 0.75rem',
      }}
    >
      {label}
    </span>
    <div>
      <Typography
        align="right"
        data-testid={
          {
            たんぱく質: 'food-protein-average',
            炭水化物: 'food-carb-average',
            熱量: 'food-energy-average',
            脂質: 'food-fat-average',
            食塩相当量: 'food-salt-average',
          }[label]
        }
        sx={{ ...fontSerif, fontWeight: 700 }}
        variant="h6"
      >
        {average} {label === '熱量' ? 'kcal' : 'g'} / 日
      </Typography>
      <Typography
        align="right"
        color={theme.palette.text.secondary}
        sx={{
          display: 'block',
        }}
        variant="caption"
      >
        目標値 {targetValue} {label === '熱量' ? 'kcal' : 'g'} / 日
      </Typography>
    </div>
  </Box>
));

interface FoodSummaryProps {
  average: {
    carb: number;
    energy: number;
    fat: number;
    protein: number;
    salt: number;
  };
  nutrition: null | Nutrition;
}

export const FoodSummary = memo(({ average, nutrition }: FoodSummaryProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * 横幅を取得してboxWidthで調整
   */
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<null | number>(null);

  useEffect(() => {
    if (!boxRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setBoxWidth(entry.contentRect.width);
      }
    });

    observer.observe(boxRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!nutrition) {
    return (
      <Loader
        style={{
          minHeight: isMobile ? 'none' : '308px',
        }}
      />
    );
  }

  return (
    <Stack
      data-testid="food-summary"
      direction={isMobile ? 'column' : 'row'}
      sx={{ alignItems: 'stretch', height: '100%', justifyContent: 'space-between' }}
    >
      <Box
        sx={{
          flexGrow: 1,
          flexShrink: 1,
          height: { sm: '100%', xs: '70vw' },
          maxHeight: { sm: 'none', xs: '320px' },
          width: {
            sm: boxWidth ? `calc( 100% - ${String(boxWidth)}px)` : '60%',
            xs: '100%',
          },
        }}
      >
        <RadarChart
          divisions={5}
          radar={{
            metrics: [
              { max: nutrition.energy, name: '熱量' },
              { max: nutrition.protein, name: '蛋白質' },
              { max: nutrition.fat, name: '脂質' },
              { max: nutrition.carb, name: '炭水化物' },
              { max: nutrition.salt, name: '食塩' },
            ],
          }}
          series={[
            {
              color: theme.palette.routineColor.dark,
              data: [average.energy, average.protein, average.fat, average.carb, average.salt],
              fillArea: true,
              valueFormatter: (v, index) => `${v.toLocaleString()} ${index.dataIndex === 0 ? 'kcal' : 'g'}`,
            },
          ]}
          sx={{
            height: '100%',
            width: '100%',
          }}
        />
      </Box>
      <Stack
        ref={boxRef}
        sx={{
          flexGrow: 0,
          flexShrink: 0,
          height: '100%',
          justifyContent: 'space-between',
          margin: { sm: '0', xs: '0 auto' },
          padding: { sm: '1rem 1rem 1rem 0', xs: 0 },
          width: 'fit-content',
        }}
      >
        <AverageText average={average.energy} label="熱量" targetValue={nutrition.energy} />
        <AverageText average={average.protein} label="たんぱく質" targetValue={nutrition.protein} />
        <AverageText average={average.fat} label="脂質" targetValue={nutrition.fat} />
        <AverageText average={average.carb} label="炭水化物" targetValue={nutrition.carb} />
        <AverageText average={average.salt} label="食塩相当量" targetValue={nutrition.salt} />
      </Stack>
    </Stack>
  );
});
