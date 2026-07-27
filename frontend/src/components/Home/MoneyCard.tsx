import { selectMoneyCategoryMap, useAppSelector } from '@/redux';
import { theme } from '@/theme';
import type { Money } from '@/types';
import { Box, Card, CardActionArea, CardContent, Stack, Typography, useMediaQuery } from '@mui/material';
import { memo } from 'react';
import { convertToRemixIcon, Icon } from '../ui';

interface MoneyCardProps {
  changeColor?: boolean; // Homeで使用（レスポンシブに応じて、カードの色を変える必要がある）
  data: Money | undefined;
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentMoneyId: React.Dispatch<React.SetStateAction<number>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MoneyCard = memo(
  ({ changeColor, data, setButtonElement, setCurrentMoneyId, setIsModalOpen }: MoneyCardProps) => {
    const { expenseCategoryMap, incomeCategoryMap } = useAppSelector(selectMoneyCategoryMap);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (!data) return null;

    return (
      <Card
        data-testid="money-card"
        onClick={e => {
          const buttonElement = (e.currentTarget as HTMLElement).querySelector('button');
          setButtonElement(buttonElement);
          setCurrentMoneyId(data.id);
          setIsModalOpen(true);
        }}
        sx={{
          backgroundColor: changeColor ? (isMobile ? theme.palette.grey[100] : '#fff') : '#fff',
          borderLeft: `solid 3px ${data.type === '収入' ? theme.palette.privateColor.dark : theme.palette.workColor.dark}`,
          width: '100%',
        }}
      >
        <CardActionArea>
          <CardContent sx={{ padding: '0.75rem' }}>
            <Stack direction={'row'} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Box
                sx={{
                  flexGrow: 1,
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  {data.type === '収入' ? (
                    <>
                      <Icon
                        color={theme.palette.privateColor.main}
                        icon={convertToRemixIcon(incomeCategoryMap?.get(data.category)?.icon ?? '')}
                        size="1rem"
                        style={{
                          flexGrow: 0,
                          flexShrink: 0,
                          marginRight: '0.5rem',
                        }}
                      />
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          flexGrow: 1,
                          flexShrink: 1,
                          lineHeight: 1.35,
                        }}
                        variant="caption"
                      >
                        {incomeCategoryMap?.get(data.category)?.name}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Icon
                        color={theme.palette.workColor.main}
                        icon={convertToRemixIcon(expenseCategoryMap?.get(data.category)?.icon ?? '')}
                        size="1rem"
                        style={{
                          flexGrow: 0,
                          flexShrink: 0,
                          marginRight: '0.5rem',
                        }}
                      />
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          flexGrow: 1,
                          flexShrink: 1,
                          lineHeight: 1.35,
                        }}
                        variant="caption"
                      >
                        {expenseCategoryMap?.get(data.category)?.name}
                      </Typography>
                    </>
                  )}
                </Stack>
                <Typography
                  component={'h3'}
                  sx={{
                    fontWeight: 400,
                    lineHeight: 1.35,
                    marginTop: '6px',
                  }}
                  variant="body2"
                >
                  {data.content}
                </Typography>
              </Box>
              <Typography
                component={'h4'}
                sx={{
                  flexShrink: 0,
                  fontWeight: 700,
                  lineHeight: 1.35,
                }}
                variant="body2"
              >
                {`¥ ${data.amount.toLocaleString('ja-JP')}`}
              </Typography>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
);
