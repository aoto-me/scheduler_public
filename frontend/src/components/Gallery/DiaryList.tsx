import { API_ENDPOINTS, ICONS } from '@/configs';
import { useAuthContext } from '@/contexts';
import { useFetchDiary, useHttpRequest } from '@/hooks';
import {
  addDiary,
  addDirectory,
  selectDiaryCardById,
  selectDiaryCardByMonth,
  selectDirectories,
  useAppDispatch,
  useAppSelector,
} from '@/redux';
import { datePickerWithLabel } from '@/styles';
import { theme } from '@/theme';
import type { DiaryCard } from '@/types';
import { formatDateToKey, normalizeDateStr, splitDate, splitFileName } from '@/utils';
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import { Box, Button, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Backdrop, Breadcrumbs, Icon, Modal, MonthSelector, PageLoader, PageTitle, PrimaryButton } from '../ui';
import { CardThumbnail } from './CardThumbnail';

interface CardItemProps {
  card: DiaryCard | undefined;
  thumbnail: string;
}

const CardItem = memo(({ card, thumbnail }: CardItemProps) => {
  const navigate = useNavigate();

  const { day, month, year } = useMemo(() => splitDate(card?.date), [card]);

  const { extension, name } = useMemo(() => splitFileName(thumbnail), [thumbnail]);

  if (!card) return null;
  return (
    <Grid data-testid="diary-card-item" size={{ md: 4, sm: 6, xl: 3, xs: 12 }}>
      <Card
        sx={{
          boxShadow: theme.shadows[2],
        }}
      >
        <CardActionArea
          onClick={() => {
            void navigate(`/gallery/diary/${String(card.id)}`);
          }}
        >
          <CardThumbnail
            extension={extension}
            fileName={name}
            path={`diary/${year}/${month}/${day}/`}
            title={card.title}
          />
          <CardContent
            sx={{
              padding: '0.75rem',
            }}
          >
            <Typography
              gutterBottom
              sx={{
                fontWeight: 700,
              }}
              variant="h6"
            >
              {card.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  alignItems: 'center',
                  color: 'text.secondary',
                  display: 'flex',
                  mr: 2,
                }}
                variant="body2"
              >
                <Icon
                  icon={ICONS.calendar}
                  size="1rem"
                  style={{
                    marginRight: '0.5rem',
                  }}
                />
                {card.date ? normalizeDateStr(card.date) : '-- -- --'}
              </Typography>
              <Typography
                sx={{
                  alignItems: 'center',
                  color: 'text.secondary',
                  display: 'flex',
                }}
                variant={'body2'}
              >
                <Icon
                  icon={ICONS.update}
                  size="1rem"
                  style={{
                    marginRight: '0.5rem',
                  }}
                />
                {normalizeDateStr(card.updated)}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
});

export const DiaryList = memo(() => {
  const { postId, subPage } = useParams();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const directories = useAppSelector(selectDirectories);
  const { userId } = useAuthContext();
  const dispatch = useAppDispatch();
  const { postRequest } = useHttpRequest();
  const { fetchDiary } = useFetchDiary();

  // dateのパラメーターの年月から表示
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const initialMonth = dateParam ? parse(dateParam, 'yyyy-MM', new Date()) : new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);

  const { month, year } = useMemo(() => splitDate(currentMonth), [currentMonth]);

  // 該当月のデータ
  const { cardMap, fetched, ids, thumbnailMap } = useAppSelector(state =>
    selectDiaryCardByMonth(state, formatDateToKey(currentMonth))
  );

  // subPageに渡すcard
  const card = useAppSelector(state => selectDiaryCardById(state, formatDateToKey(currentMonth), Number(subPage)));

  const uploadUrl = useMemo(() => {
    if (subPage && card) {
      const { day: _day, month: _month, year: _year } = splitDate(card.date);
      return `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/diary/${_year}/${_month}/${_day}/`;
    } else {
      return `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/diary/${year}/${month}/`;
    }
  }, [userId, subPage, card, month, year]);

  const path = useMemo(() => {
    if (subPage && card) {
      const { day: _day, month: _month, year: _year } = splitDate(card.date);
      return `diary/${_year}/${_month}/${_day}/`;
    }
    return `diary/${year}/${month}/`;
  }, [subPage, year, month, card]);

  const outletProps = useMemo(
    () => ({
      card,
      path,
      postId,
      setIsUploading,
      uploadUrl,
    }),
    [postId, card, uploadUrl, path]
  );

  // データの取得 - galleryCard(contentは含まない) と thumbnail
  useEffect(() => {
    if (fetched) return;
    void fetchDiary(currentMonth);
  }, [currentMonth, fetchDiary]);

  /***
   * モーダル開閉時に元の位置にフォーカスを戻す
   */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastFocusedButtonRef = useRef<HTMLButtonElement | null>(null);

  const setButtonElement = (target: HTMLButtonElement | null) => {
    lastFocusedButtonRef.current = target;
  };

  useEffect(() => {
    if (!isModalOpen && lastFocusedButtonRef.current) {
      const timeout = setTimeout(() => {
        lastFocusedButtonRef.current?.focus();
      }, 500); // モーダルが閉じるアニメーションの時間

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isModalOpen]);

  /**
   * 新規カードの追加
   */
  const [value, setValue] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isModalOpen) {
      setValue(null);
      setError('');
    }
  }, [isModalOpen]);

  const handleCreateCard = useCallback(() => {
    if (!value) {
      setError('日付を選択してください');
      return null;
    }
    setIsSaveLoading(true);
    // 新規カードの登録処理
    const title = format(value, 'yyyy/MM/dd');
    const date = format(value, 'yyyy-MM-dd');
    const updated = format(new Date(), 'yyyy-MM-dd');
    const data = {
      date,
      title,
    };
    postRequest<number>({
      apiUrl: `${API_ENDPOINTS.diary}card/`,
      data,
    })
      .then(response => {
        if (!response) {
          setError('登録に失敗しました');
          setIsSaveLoading(false);
          return;
        }
        // 新規カードの登録
        const newCard = {
          date,
          id: response,
          title,
          updated,
        };
        dispatch(addDiary(newCard));

        // directories に diary/year/month/day のディレクトリを追加
        if (directories) {
          const { day, month, year } = splitDate(data);
          dispatch(addDirectory({ name: day, path: `diary/${year}/${month}` }));
        }
        setIsSaveLoading(false);
        setIsModalOpen(false);
        setValue(null);
        setError('');
      })
      .catch(() => {
        console.error('カードの新規保存に失敗しました');
        setError('登録に失敗しました');
        setIsSaveLoading(false);
      });
  }, [value, directories, dispatch, postRequest]);

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          {
            path: '/gallery',
            title: 'gallery',
          },
          {
            path: `/gallery/${String(postId)}`,
            title: String(postId),
          },
          ...(subPage && cardMap
            ? [
                {
                  path: `/gallery/${String(postId)}/${subPage}`,
                  title: cardMap.get(Number(subPage))?.title ?? '',
                },
              ]
            : []),
        ]}
      />
      {subPage && cardMap && card ? (
        <>
          <PageTitle
            cardId={Number(subPage)}
            date={card.date}
            key={`diary-${subPage}`}
            title={cardMap.get(Number(subPage))?.title ?? ''}
          />
          <Outlet context={outletProps} />
        </>
      ) : (
        <>
          <MonthSelector
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            style={{
              marginBottom: '2rem',
              marginTop: '1rem',
            }}
          />
          {!cardMap || !thumbnailMap ? (
            <PageLoader
              style={{
                flexGrow: 1,
              }}
            />
          ) : (
            <>
              <Grid container spacing={2}>
                {ids.map(id => (
                  <CardItem card={cardMap.get(id)} key={`diary-${String(id)}`} thumbnail={thumbnailMap.get(id) ?? ''} />
                ))}
                <Grid size={{ md: 4, sm: 6, xl: 3, xs: 12 }}>
                  <Button
                    fullWidth
                    onClick={e => {
                      setButtonElement(e.currentTarget);
                      setIsModalOpen(true);
                    }}
                    startIcon={<AddCircleSharpIcon color="primary" />}
                    sx={{ letterSpacing: 0.5, textTransform: 'none' }}
                    variant="outlined"
                  >
                    カードを追加
                  </Button>
                </Grid>
              </Grid>
              <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} width="500px">
                <Stack
                  spacing={3}
                  sx={{
                    padding: '0.5rem',
                  }}
                >
                  <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
                    <DatePicker
                      autoFocus={true}
                      label="日付"
                      onChange={value => {
                        if (value) {
                          setValue(value);
                          setError('');
                        }
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: error,
                        },
                      }}
                      sx={{
                        ...datePickerWithLabel,
                        '& .MuiFormHelperText-root': {
                          color: theme.palette.error.main,
                        },
                      }}
                    />
                  </LocalizationProvider>
                  <PrimaryButton loading={isSaveLoading} onClick={handleCreateCard}>
                    日付のカードを追加
                  </PrimaryButton>
                </Stack>
              </Modal>
            </>
          )}
        </>
      )}
      <Backdrop isLoading={isUploading} />
    </>
  );
});
