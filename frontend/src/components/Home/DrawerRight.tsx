import { ICONS } from '@/configs';
import { useAuthContext } from '@/contexts';
import { useFetchDiary } from '@/hooks';
import { selectNutrition, useAppSelector } from '@/redux';
import { fontSerif, navHeight, scrollbarTransparent } from '@/styles';
import { theme } from '@/theme';
import type { DiaryCard, Food, HealthWithItem, ImageItem, Money, Todo } from '@/types';
import { splitDate, splitFileName } from '@/utils';
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import { Box, Button, Chip, Drawer, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { type JSONContent } from '@tiptap/core';
import { format } from 'date-fns';
import { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageSlider } from '../Gallery';
import { MentalIcons } from '../Health';
import { BlockEditor, convertToRemixIcon, FormTitle, Icon } from '../ui';
import { DailyPieChart } from './DailyPieChart';
import { FoodCard } from './FoodCard';
import { MoneyCard } from './MoneyCard';
import { TodoCard } from './TodoCard';

const addButtonStyle = {
  letterSpacing: 0.5,
  minWidth: '0px',
  textTransform: 'none',
};

const DisabledPaper = ({ text }: { text: string }) => {
  return (
    <Paper
      sx={{
        backgroundColor: '#ffffffa8',
        padding: '0.75rem',
      }}
      variant={'outlined'}
    >
      <Typography
        color="textDisabled"
        sx={{
          textAlign: 'center',
        }}
        variant={'body2'}
      >
        {text}
      </Typography>
    </Paper>
  );
};

/**
 * DiaryContent
 */
interface DiaryContentProps {
  currentDay: Date;
  currentDayDiary: DiaryCard | null;
  diaryContent: JSONContent | null;
  imageItems: ImageItem[];
  isPrivate: boolean | null;
  path: string;
}

const DiaryContent = ({
  currentDay,
  currentDayDiary,
  diaryContent,
  imageItems,
  isPrivate,
  path,
}: DiaryContentProps) => {
  const navigate = useNavigate();
  const key = currentDayDiary ? currentDayDiary.date.slice(0, 7) : format(currentDay, 'yyyy-MM');

  if (isPrivate) {
    return <DisabledPaper text="プライベートモードです" />;
  }

  if (!currentDayDiary || !diaryContent) {
    return (
      <Button
        fullWidth
        onClick={() => {
          void navigate(`/gallery/diary?date=${key}`);
        }}
        startIcon={<AddCircleSharpIcon color="primary" />}
        sx={addButtonStyle}
      >
        日記を書く
      </Button>
    );
  }

  return (
    <>
      <Paper
        sx={{
          backgroundColor: '#ffffffa8',
          padding: '0.75rem',
        }}
        variant={'outlined'}
      >
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            lineHeight: 1.5,
            marginBottom: '1rem',
          }}
          variant="h3"
        >
          {currentDayDiary.title}
        </Typography>
        {imageItems.length > 0 && (
          <ImageSlider
            currentIndex={0}
            itemMap={new Map(imageItems.map(i => [i.id, i]))}
            items={imageItems.map(item => item.id)}
            path={path}
            style={{
              marginBottom: '1rem',
            }}
          />
        )}
        <div className="noEditable">
          <BlockEditor content={diaryContent} isEditable={false} outer={false} />
        </div>
      </Paper>
      <Button
        fullWidth
        onClick={() => {
          void navigate(`/gallery/diary/${String(currentDayDiary.id)}?date=${key}`);
        }}
        startIcon={<AddCircleSharpIcon color="primary" />}
        sx={addButtonStyle}
      >
        日記を編集
      </Button>
    </>
  );
};

/**
 * TodoContent
 */
interface TodoContentProps {
  currentDay: Date;
  currentDayTodos: Todo[];
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentTodoId: React.Dispatch<React.SetStateAction<number>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TodoContent = ({
  currentDay,
  currentDayTodos,
  setButtonElement,
  setCurrentTodoId,
  setIsModalOpen,
}: TodoContentProps) => {
  return (
    <>
      {currentDayTodos.map(todo => (
        <TodoCard
          changeColor={true}
          key={`todoCard-${String(todo.id)}`}
          setButtonElement={setButtonElement}
          setCurrentTodoId={setCurrentTodoId}
          setIsModalOpen={setIsModalOpen}
          todo={todo}
        />
      ))}
      <Button
        fullWidth
        onClick={e => {
          setButtonElement(e.currentTarget);
          setCurrentTodoId(0);
          setIsModalOpen(true);
        }}
        startIcon={<AddCircleSharpIcon color="primary" />}
        sx={addButtonStyle}
      >
        ToDoを追加
      </Button>
      <Paper
        data-testid="daily-pie-chart"
        sx={{
          backgroundColor: '#ffffffa8',
          height: '380px',
          padding: '1rem 0.75rem',
        }}
        variant={'outlined'}
      >
        <DailyPieChart currentDay={currentDay} currentDayTodos={currentDayTodos} />
      </Paper>
    </>
  );
};

/**
 * MoneyContent
 */
interface MoneyContentProps {
  currentDayMoneys: Money[];
  isPrivate: boolean | null;
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentMoneyId: React.Dispatch<React.SetStateAction<number>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MoneyContent = ({
  currentDayMoneys,
  isPrivate,
  setButtonElement,
  setCurrentMoneyId,
  setIsModalOpen,
}: MoneyContentProps) => {
  if (isPrivate) {
    return <DisabledPaper text="プライベートモードです" />;
  }

  return (
    <>
      {currentDayMoneys.map(money => (
        <MoneyCard
          changeColor={true}
          data={money}
          key={`money-${String(money.id)}`}
          setButtonElement={setButtonElement}
          setCurrentMoneyId={setCurrentMoneyId}
          setIsModalOpen={setIsModalOpen}
        />
      ))}
      <Button
        fullWidth
        onClick={e => {
          setButtonElement(e.currentTarget);
          setCurrentMoneyId(0);
          setIsModalOpen(true);
        }}
        startIcon={<AddCircleSharpIcon color="primary" />}
        sx={addButtonStyle}
      >
        収支を追加
      </Button>
    </>
  );
};

/**
 * HealthContent
 */
interface HealthContentProps {
  currentDayFoods: Food[];
  currentDayHealth: HealthWithItem | null;
  foodTotal: {
    carb: number;
    energy: number;
    fat: number;
    protein: number;
    salt: number;
  };
  healthIconMap: Map<string, string>;
  isPrivate: boolean | null;
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentFoodId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentHealthId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentHealthType: React.Dispatch<React.SetStateAction<'food' | 'health'>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SummaryText = memo(({ base, title, total }: { base: number; title: string; total: number }) => (
  <Box
    sx={{
      alignItems: 'center',
      backgroundColor: theme.palette.grey[200],
      borderRadius: '3px',
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.25rem 0.5rem',
    }}
  >
    <span
      style={{
        color: theme.palette.text.secondary,
        flexShrink: 0,
        fontSize: '0.75rem',
        lineHeight: 1,
        marginRight: '0.75rem',
      }}
    >
      {title}
    </span>
    <Typography
      align="right"
      sx={{
        fontWeight: 700,
      }}
      variant="caption"
    >
      {total} / {base} {title === '熱量' ? 'kcal' : 'g'}
    </Typography>
  </Box>
));

const HealthContent = ({
  currentDayFoods,
  currentDayHealth,
  foodTotal,
  healthIconMap,
  isPrivate,
  setButtonElement,
  setCurrentFoodId,
  setCurrentHealthId,
  setCurrentHealthType,
  setIsModalOpen,
}: HealthContentProps) => {
  const nutritionList = useAppSelector(selectNutrition);
  const nutrition = nutritionList?.[0];

  if (!nutrition) return null;

  if (isPrivate) {
    return <DisabledPaper text="プライベートモードです" />;
  }

  return (
    <>
      {currentDayHealth ? (
        <Paper
          sx={{
            backgroundColor: '#ffffffa8',
            padding: '0.75rem 1rem',
          }}
          variant={'outlined'}
        >
          <Stack spacing={2}>
            {currentDayHealth.mental > 0 && (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    marginRight: '0.5rem',
                    marginTop: '6px',
                  }}
                  variant="body2"
                >
                  調子
                </Typography>
                <p
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    marginTop: '0.25rem',
                  }}
                >
                  {MentalIcons[currentDayHealth.mental].icon}
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.825rem',
                      marginLeft: '0.5rem',
                      verticalAlign: 'middle',
                    }}
                  >{`( ${String(currentDayHealth.mental)} / 5 )`}</span>
                </p>
              </Box>
            )}
            {currentDayHealth.item.length > 0 && (
              <Box>
                <FormTitle color={theme.palette.secondary.main} icon={ICONS.medicalKitFill} title="症状" />
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    marginTop: '0.35rem',
                  }}
                >
                  {currentDayHealth.item.map((item: string, index: number) => (
                    <Chip
                      icon={
                        <Icon
                          icon={convertToRemixIcon(healthIconMap.get(item) ?? 'dossier-line')}
                          style={{
                            flexShrink: 0,
                            marginLeft: '4px',
                            marginRight: '-4px',
                          }}
                        />
                      }
                      key={`healthItem-${String(index)}`}
                      label={item}
                      size="small"
                      sx={{
                        height: 'auto',
                        padding: '3px',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {currentDayHealth.memo.length > 0 && (
              <Box>
                <FormTitle color={theme.palette.secondary.main} icon={ICONS.memoFill} title="メモ" />
                <Typography
                  sx={{
                    lineHeight: '1.6',
                    marginTop: '0.2rem',
                  }}
                  variant={'body2'}
                >
                  {currentDayHealth.memo.split('\n').map((line: string, index: number) => (
                    <Fragment key={index}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
                </Typography>
              </Box>
            )}
            {currentDayHealth.exercise === 1 && (
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    marginRight: '0.5rem',
                  }}
                  variant="body2"
                >
                  運動
                </Typography>
                <span>
                  <Icon color="primary" icon={ICONS.checkFill} size="1.5rem" />
                </span>
              </Box>
            )}
          </Stack>
        </Paper>
      ) : (
        <DisabledPaper text="記録がありません" />
      )}
      <Button
        fullWidth
        onClick={e => {
          setButtonElement(e.currentTarget);
          setCurrentHealthType('health');
          setCurrentHealthId(currentDayHealth ? currentDayHealth.id : 0);
          setIsModalOpen(true);
        }}
        startIcon={<AddCircleSharpIcon color="primary" />}
        sx={addButtonStyle}
      >
        体調を{currentDayHealth ? '更新' : '記録'}
      </Button>
      <Paper
        data-testid="food-radar-chart"
        sx={{
          backgroundColor: '#ffffffa8',
          padding: '1rem 0.75rem',
        }}
        variant={'outlined'}
      >
        <Box
          sx={{
            height: '70vw',
            maxHeight: '260px',
            width: '100%',
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
                data: [foodTotal.energy, foodTotal.protein, foodTotal.fat, foodTotal.carb, foodTotal.salt],
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
        <Stack spacing={1}>
          <SummaryText base={nutrition.energy} title="熱量" total={foodTotal.energy} />
          <SummaryText base={nutrition.protein} title="たんぱく質" total={foodTotal.protein} />
          <SummaryText base={nutrition.fat} title="脂質" total={foodTotal.fat} />
          <SummaryText base={nutrition.carb} title="炭水化物" total={foodTotal.carb} />
          <SummaryText base={nutrition.salt} title="食塩相当量" total={foodTotal.salt} />
        </Stack>
      </Paper>
      {currentDayFoods.map(food => (
        <FoodCard
          changeColor={true}
          data={food}
          key={`foodCard-${String(food.id)}`}
          setButtonElement={setButtonElement}
          setCurrentFoodId={setCurrentFoodId}
          setCurrentHealthType={setCurrentHealthType}
          setIsModalOpen={setIsModalOpen}
        />
      ))}
      <Button
        fullWidth
        onClick={e => {
          setButtonElement(e.currentTarget);
          setCurrentHealthType('food');
          setCurrentFoodId(0);
          setIsModalOpen(true);
        }}
        startIcon={<AddCircleSharpIcon color="primary" />}
        sx={addButtonStyle}
      >
        食事記録を追加
      </Button>
    </>
  );
};

interface DrawerRightProps {
  currentDay: Date;
  currentDayDiary: DiaryCard | null;
  currentDayFoods: Food[];
  currentDayHealth: HealthWithItem | null;
  currentDayMoneys: Money[];
  currentDayTodos: Todo[];
  currentType: 'diary' | 'health' | 'money' | 'todo';
  foodTotal: {
    carb: number;
    energy: number;
    fat: number;
    protein: number;
    salt: number;
  };
  healthIconMap: Map<string, string>;
  isDrawerOpen: boolean;
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentFoodId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentHealthId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentHealthType: React.Dispatch<React.SetStateAction<'food' | 'health'>>;
  setCurrentMoneyId: React.Dispatch<React.SetStateAction<number>>;
  setCurrentTodoId: React.Dispatch<React.SetStateAction<number>>;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DrawerRight = memo(
  ({
    currentDay,
    currentDayDiary,
    currentDayFoods,
    currentDayHealth,
    currentDayMoneys,
    currentDayTodos,
    currentType,
    foodTotal,
    healthIconMap,
    isDrawerOpen,
    setButtonElement,
    setCurrentFoodId,
    setCurrentHealthId,
    setCurrentHealthType,
    setCurrentMoneyId,
    setCurrentTodoId,
    setIsDrawerOpen,
    setIsModalOpen,
  }: DrawerRightProps) => {
    const menuDrawerWidth = 380;
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [diaryContent, setDiaryContent] = useState<JSONContent | null>(null);
    const [imageItems, setImageItems] = useState<ImageItem[]>([]);
    const { isPrivate, userId } = useAuthContext();
    const { fetchDiaryItem } = useFetchDiary();

    // 閉じた時にドロワー内からフォーカスを外す
    useEffect(() => {
      if (!isMobile) return;
      if (!isDrawerOpen) {
        const activeEl = document.activeElement as HTMLElement | null; // 現在フォーカスされている要素
        if (activeEl) activeEl.blur();
      }
    }, [isDrawerOpen, isMobile]);

    const { path, uploadFolder } = useMemo(() => {
      const { day, month, year } = splitDate(currentDay);
      return {
        path: `diary/${year}/${month}/${day}/`,
        uploadFolder: `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/diary/${year}/${month}/${day}/`,
      };
    }, [currentDay, userId]);

    // データの取得 - diary(contentと画像のみ)
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiaryContent(null);

      setImageItems([]);
      if (!currentDayDiary) return;
      fetchDiaryItem(currentDayDiary.id)
        .then(response => {
          if (!response) return;
          setDiaryContent(JSON.parse(response.content) as JSONContent);
          // sortの順番に並べ替え
          const sortedItems = response.item.sort((a, b) => a.sort - b.sort);
          // 取得したデータを整形
          const itemData = sortedItems.map(item => {
            const { extension, name } = splitFileName(item.file);
            return {
              cardId: item.cardId,
              extension,
              id: item.id,
              name,
              sort: item.sort,
              url: `${uploadFolder}${item.file}`,
            };
          });
          setImageItems(itemData);
        })
        .catch(() => {
          console.error('diaryの取得に失敗しました');
        });
    }, [currentDayDiary, fetchDiaryItem]);

    const renderContent = () => {
      switch (currentType) {
        case 'diary': {
          return (
            <DiaryContent
              currentDay={currentDay}
              currentDayDiary={currentDayDiary}
              diaryContent={diaryContent}
              imageItems={imageItems}
              isPrivate={isPrivate}
              path={path}
            />
          );
        }
        case 'health': {
          return (
            <HealthContent
              currentDayFoods={currentDayFoods}
              currentDayHealth={currentDayHealth}
              foodTotal={foodTotal}
              healthIconMap={healthIconMap}
              isPrivate={isPrivate}
              setButtonElement={setButtonElement}
              setCurrentFoodId={setCurrentFoodId}
              setCurrentHealthId={setCurrentHealthId}
              setCurrentHealthType={setCurrentHealthType}
              setIsModalOpen={setIsModalOpen}
            />
          );
        }
        case 'money': {
          return (
            <MoneyContent
              currentDayMoneys={currentDayMoneys}
              isPrivate={isPrivate}
              setButtonElement={setButtonElement}
              setCurrentMoneyId={setCurrentMoneyId}
              setIsModalOpen={setIsModalOpen}
            />
          );
        }
        case 'todo': {
          return (
            <TodoContent
              currentDay={currentDay}
              currentDayTodos={currentDayTodos}
              setButtonElement={setButtonElement}
              setCurrentTodoId={setCurrentTodoId}
              setIsModalOpen={setIsModalOpen}
            />
          );
        }
        default: {
          return <></>;
        }
      }
    };

    return (
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        inert={isMobile ? !isDrawerOpen : false}
        ModalProps={{
          keepMounted: true,
        }}
        onClose={() => {
          setIsDrawerOpen(false);
        }}
        open={isDrawerOpen}
        sx={{
          '& .MuiDrawer-paper': {
            border: 'none',
            boxSizing: 'border-box',
            maxWidth: isMobile ? '100%' : menuDrawerWidth,
            width: isMobile ? 'auto' : 'calc(28% - 24px)',
            ...scrollbarTransparent,
            ...(isMobile && {
              backgroundColor: '#fff',
              borderRadius: '12px 12px 0 0',
              height: '80vh',
            }),
            ...(!isMobile && {
              backgroundColor: 'transparent',
              borderRadius: 0,
              height: '100vh',
              top: 0,
            }),
          },
          backgroundColor: 'transparent',
          maxWidth: isMobile ? '100%' : menuDrawerWidth,
          width: isMobile ? 'auto' : '28%',
        }}
        variant={isMobile ? 'temporary' : 'permanent'}
      >
        <Stack
          component="section"
          spacing={1.5}
          sx={{
            padding: { md: '32px 20px 32px 4px', xs: `20px 20px calc(${navHeight} + 20px)` },
          }}
        >
          <Typography
            aria-label="選択日"
            component={'h2'}
            sx={{ ...fontSerif, fontWeight: 700, letterSpacing: '0.025em' }}
            variant="h6"
          >
            {format(currentDay, 'yyyy年M月d日')}
          </Typography>
          {renderContent()}
        </Stack>
      </Drawer>
    );
  }
);
