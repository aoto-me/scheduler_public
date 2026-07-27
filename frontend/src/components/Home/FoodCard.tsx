import { theme } from '@/theme';
import type { Food } from '@/types';
import { Box, Card, CardActionArea, CardContent, Typography, useMediaQuery } from '@mui/material';
import { memo } from 'react';

interface FoodCardProps {
  changeColor?: boolean; // Homeで使用（レスポンシブに応じて、カードの色を変える必要がある）
  data: Food | undefined;
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentFoodId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentHealthType: React.Dispatch<React.SetStateAction<'food' | 'health'>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FoodCard = memo(
  ({ changeColor, data, setButtonElement, setCurrentFoodId, setCurrentHealthType, setIsModalOpen }: FoodCardProps) => {
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    if (!data) return null;
    return (
      <Card
        data-testid="food-card"
        onClick={e => {
          const buttonElement = (e.currentTarget as HTMLElement).querySelector('button');
          setButtonElement(buttonElement);
          setCurrentHealthType('food');
          setCurrentFoodId(data.id);
          setIsModalOpen(true);
        }}
        sx={{
          backgroundColor: changeColor ? (isMobile ? theme.palette.grey[100] : '#fff') : '#fff',
          borderLeft: `solid 3px ${theme.palette.routineColor.dark}`,
          width: '100%',
        }}
      >
        <CardActionArea>
          <CardContent sx={{ padding: '0.75rem' }}>
            <Typography
              component={'h3'}
              sx={{
                fontWeight: 700,
                lineHeight: 1.35,
              }}
              variant="body2"
            >
              {`${data.name}  ${String(data.quantity)}${data.unit}`}
            </Typography>
            <Box
              sx={{
                columnGap: '0.75rem',
                display: 'flex',
                flexWrap: 'wrap',
                marginTop: '0.25rem',
                rowGap: '2px',
              }}
            >
              <Typography
                color={'textSecondary'}
                sx={{
                  lineHeight: 1.35,
                }}
                variant="caption"
              >
                熱量/{data.energy} kcal
              </Typography>
              {data.protein !== null && (
                <Typography
                  color={'textSecondary'}
                  sx={{
                    lineHeight: 1.35,
                  }}
                  variant="caption"
                >
                  たんぱく質/{data.protein} g
                </Typography>
              )}
              {data.fat !== null && (
                <Typography
                  color={'textSecondary'}
                  sx={{
                    lineHeight: 1.35,
                  }}
                  variant="caption"
                >
                  脂質/{data.fat} g
                </Typography>
              )}
              {data.carb !== null && (
                <Typography
                  color={'textSecondary'}
                  sx={{
                    lineHeight: 1.35,
                  }}
                  variant="caption"
                >
                  炭水化物/{data.carb} g
                </Typography>
              )}
              {data.salt !== null && (
                <Typography
                  color={'textSecondary'}
                  sx={{
                    lineHeight: 1.35,
                  }}
                  variant="caption"
                >
                  食塩相当量/{data.salt} g
                </Typography>
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
);
