import { useDeleteMoney, useSaveMoney } from '@/hooks';
import { selectMoneyById, selectMoneyCategories, useAppSelector } from '@/redux';
import { datePickerWithLabel, textFieldOutlinedStyleWithLabel, textFieldSelectStyle } from '@/styles';
import { theme } from '@/theme';
import type { ExpenseCategory, IncomeCategory, MoneyType } from '@/types';
import { moneySchema, type MoneySchema } from '@/validations/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, ButtonGroup, MenuItem, Stack, TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { convertToRemixIcon, DeleteButton, Icon, PrimaryButton } from '../ui';

interface MoneyFormProps {
  currentDay: string;
  currentMoneyId: number;
  setCurrentMoneyId: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MoneyForm = memo(
  ({ currentDay, currentMoneyId, setCurrentMoneyId, setIsLoading, setIsModalOpen }: MoneyFormProps) => {
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [isDelLoading, setIsDelLoading] = useState(false);
    const money = useAppSelector(state => selectMoneyById(state, currentMoneyId));
    const { expenseCategory, incomeCategory } = useAppSelector(selectMoneyCategories);
    const { saveMoney } = useSaveMoney();
    const { deleteMoney } = useDeleteMoney();

    const expenseCategoryMap: Map<number, ExpenseCategory> = useMemo(() => {
      if (!expenseCategory) return new Map<number, ExpenseCategory>();
      return new Map<number, ExpenseCategory>(expenseCategory.map((e: ExpenseCategory) => [e.id, e]));
    }, [expenseCategory]);

    const incomeCategoryMap: Map<number, IncomeCategory> = useMemo(() => {
      if (!incomeCategory) return new Map<number, IncomeCategory>();
      return new Map<number, IncomeCategory>(incomeCategory.map((e: IncomeCategory) => [e.id, e]));
    }, [incomeCategory]);

    const defaultValues = {
      amount: null,
      category: 0,
      content: '',
      date: currentDay,
      type: '支出' as MoneyType,
    };

    // reactHookForm
    const {
      control,
      formState: { errors },
      getValues,
      handleSubmit,
      reset,
      setValue,
      watch,
    } = useForm<MoneySchema>({
      defaultValues,
      resolver: zodResolver(moneySchema),
    });

    // 現在の収支タイプを監視
    const currentType = watch('type');
    const categories = useMemo(() => {
      if (currentType === '収入') {
        const category = [...incomeCategoryMap.values()].map(category => category);
        return [
          {
            icon: '',
            id: 0,
            name: 'カテゴリを選択',
          },
          ...category,
        ];
      }
      const category = [...expenseCategoryMap.values()].map(category => category);
      return [
        {
          icon: '',
          id: 0,
          name: 'カテゴリを選択',
        },
        ...category,
      ];
    }, [currentType, incomeCategoryMap, expenseCategoryMap]);

    // 既存データがあれば、フォームにデータをセット
    useEffect(() => {
      if (currentMoneyId === 0 || !money) {
        reset(defaultValues);
        return;
      }
      setValue('date', money.date);
      setValue('type', money.type);
      setValue('category', money.category);
      setValue('amount', money.amount);
      setValue('content', money.content);
    }, [currentMoneyId]);

    /**
     * 新規・更新
     */
    const onSubmit: SubmitHandler<MoneySchema> = useCallback(() => {
      setIsSaveLoading(true);
      setIsLoading(true);
      const formData = getValues();
      const { amount, type, ...rest } = formData;

      saveMoney({
        ...rest,
        amount: amount ?? 0,
        id: currentMoneyId,
        type: type,
      })
        .then(response => {
          if (response) {
            setIsSaveLoading(false);
            setIsLoading(false);
            setIsModalOpen(false);
          } else {
            setIsSaveLoading(false);
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsSaveLoading(false);
          setIsLoading(false);
        });
    }, [currentMoneyId, getValues, setIsLoading, setIsModalOpen, setIsSaveLoading, saveMoney]);

    /**
     * 削除
     */
    const handleDelete = useCallback(() => {
      if (currentMoneyId === 0) return;
      setIsDelLoading(true);
      setIsLoading(true);

      deleteMoney(currentMoneyId)
        .then(response => {
          if (response === 'ok') {
            setIsDelLoading(false);
            setIsLoading(false);
            setIsModalOpen(false);
            setCurrentMoneyId(0);
          } else {
            setIsDelLoading(false);
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsDelLoading(false);
          setIsLoading(false);
        });
    }, [deleteMoney, currentMoneyId, setCurrentMoneyId, setIsDelLoading, setIsLoading, setIsModalOpen]);

    return (
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ButtonGroup fullWidth>
              <Button
                color="secondary"
                onClick={() => {
                  field.onChange('支出');
                  setValue('category', 0);
                }}
                sx={
                  field.value === '支出'
                    ? {
                        backgroundColor: theme.palette.expenseColor.dark,
                        color: '#fff',
                        pointerEvents: 'none',
                      }
                    : {
                        '@media (hover: hover)': {
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.expenseColor.dark, 0.1),
                            borderColor: theme.palette.expenseColor.dark,
                            color: theme.palette.expenseColor.dark,
                          },
                        },
                        outlineColor: `${theme.palette.expenseColor.dark} !important`,
                      }
                }
                variant={field.value === '支出' ? 'contained' : 'outlined'}
              >
                支出
              </Button>
              <Button
                color="secondary"
                onClick={() => {
                  field.onChange('収入');
                  setValue('category', 0);
                }}
                sx={
                  field.value === '収入'
                    ? {
                        backgroundColor: theme.palette.incomeColor.dark,
                        color: '#fff',
                        pointerEvents: 'none',
                      }
                    : {
                        '@media (hover: hover)': {
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.incomeColor.dark, 0.1),
                            borderColor: theme.palette.incomeColor.dark,
                            color: theme.palette.incomeColor.dark,
                          },
                        },
                        outlineColor: `${theme.palette.incomeColor.dark} !important`,
                      }
                }
                variant={field.value === '収入' ? 'contained' : 'outlined'}
              >
                収入
              </Button>
            </ButtonGroup>
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
              <DatePicker
                label="日付"
                onChange={e => {
                  const date = e instanceof Date ? format(e, 'yyyy-MM-dd') : '';
                  field.onChange(date);
                }}
                slotProps={{
                  textField: {
                    error: !!errors.date,
                    helperText: errors.date?.message,
                    id: 'date',
                  },
                }}
                sx={datePickerWithLabel}
                value={field.value ? new Date(field.value) : null}
              />
            </LocalizationProvider>
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.category}
              helperText={errors.category?.message}
              hiddenLabel
              id="category"
              required
              select
              size="small"
              sx={textFieldSelectStyle}
              variant="filled"
            >
              {categories.map(category => (
                <MenuItem
                  key={category.id}
                  sx={{
                    ...(category.id === 0 && {
                      color: theme.palette.text.disabled,
                    }),
                  }}
                  value={category.id}
                >
                  <Icon
                    icon={convertToRemixIcon(category.icon)}
                    size="1.15rem"
                    style={{
                      marginRight: '0.5rem',
                      verticalAlign: 'middle',
                    }}
                  />
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              error={!!errors.content}
              helperText={errors.content?.message}
              id="content"
              label="内容"
              onChange={event => {
                const newValue = event.target.value;
                field.onChange(newValue);
              }}
              placeholder="内容を入力"
              required
              size="small"
              sx={textFieldOutlinedStyleWithLabel}
              type="text"
              value={field.value}
              variant="outlined"
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.amount}
              helperText={errors.amount?.message}
              id="amount"
              label="金額"
              onChange={event => {
                const newValue = event.target.value;
                field.onChange(newValue === '' ? null : Number(newValue));
              }}
              placeholder="金額を入力"
              required
              size="small"
              sx={textFieldOutlinedStyleWithLabel}
              type="number"
              value={field.value ?? ''}
              variant="outlined"
            />
          )}
        />

        <Stack spacing={1.5}>
          <PrimaryButton loading={isSaveLoading} type="submit">
            {currentMoneyId === 0 ? '保存' : '更新'}
          </PrimaryButton>
          {currentMoneyId !== 0 && (
            <DeleteButton loading={isDelLoading} onClick={handleDelete}>
              削除
            </DeleteButton>
          )}
        </Stack>
      </Stack>
    );
  }
);
