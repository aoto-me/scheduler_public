import { ICONS } from '@/configs';
import { useDeleteHealth, useSaveHealth } from '@/hooks';
import { selectHealthById, selectHealthCategory, useAppSelector } from '@/redux';
import { datePickerWithLabel } from '@/styles';
import { theme } from '@/theme';
import type { HealthItem } from '@/types';
import { healthSchema, type HealthSchema } from '@/validations/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  type IconContainerProps,
  Rating,
  Stack,
  TextField,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { useCallback, useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { DeleteButton, FormTitle, PrimaryButton } from '../ui';
import { MentalIcons } from './MentalIcons';

interface HealthFormProps {
  currentDay: string;
  currentHealthId: number;
  setCurrentHealthId: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HealthForm = ({
  currentDay,
  currentHealthId,
  setCurrentHealthId,
  setIsLoading,
  setIsModalOpen,
}: HealthFormProps) => {
  'use no memo';
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isDelLoading, setIsDelLoading] = useState(false);
  const { health, healthItem } = useAppSelector(state => selectHealthById(state, currentHealthId));
  const healthCategory = useAppSelector(selectHealthCategory);
  const { saveHealth } = useSaveHealth();
  const { deleteHealth } = useDeleteHealth();

  const defaultValues = {
    date: currentDay,
    exercise: false,
    item: [],
    memo: '',
    mental: 0,
    other: '',
  };

  // ReactHookForm
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setValue,
  } = useForm<HealthSchema>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(healthSchema),
  });

  // 既存データがあれば、フォームにデータをセット
  useEffect(() => {
    if (currentHealthId === 0 || !health) {
      reset(defaultValues);
      return;
    }

    setValue('date', health.date);
    setValue('mental', health.mental);
    setValue('other', health.other);
    setValue('memo', health.memo);
    setValue('exercise', health.exercise !== 0);
    setValue(
      'item',
      healthItem.filter(item => item.healthId === currentHealthId).map(item => item.categoryId)
    );
  }, [currentHealthId]);

  /**
   * 新規・更新
   */
  const onSubmit: SubmitHandler<HealthSchema> = useCallback(() => {
    setIsSaveLoading(true);
    setIsLoading(true);

    const formData = getValues();
    const { exercise, item, ...rest } = formData;

    // healthItemの整形
    const nextIds = new Set(item);
    // 削除アイテム（既存 − 今回）
    const delItems: HealthItem[] = healthItem.filter(item => !nextIds.has(item.categoryId));
    // 保存アイテム（既存 + 新規）
    const addItems: HealthItem[] = item.map(categoryId => {
      const existing = healthItem.find(item => item.categoryId === categoryId);
      // 既存データ
      if (existing) {
        return existing;
      }
      // 新規登録
      return {
        categoryId,
        healthId: currentHealthId,
        id: 0,
      };
    });

    saveHealth({
      ...rest,
      addItems,
      delItems,
      exercise: exercise ? 1 : 0,
      id: currentHealthId,
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
  }, [getValues, healthItem, currentHealthId, saveHealth, setIsLoading, setIsModalOpen]);

  /**
   * 削除
   */
  const handleDelete = useCallback(() => {
    if (currentHealthId === 0) return;
    setIsDelLoading(true);
    setIsLoading(true);

    deleteHealth(currentHealthId)
      .then(response => {
        if (response === 'ok') {
          setIsDelLoading(false);
          setIsLoading(false);
          setIsModalOpen(false);
          setCurrentHealthId(0);
        } else {
          setIsDelLoading(false);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsDelLoading(false);
        setIsLoading(false);
      });
  }, [deleteHealth, currentHealthId, setIsLoading, setIsModalOpen, setCurrentHealthId]);

  const IconContainer = (props: IconContainerProps) => {
    const { value, ...other } = props;
    return <span {...other}>{MentalIcons[value].icon}</span>;
  };

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={3.5}>
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <LocalizationProvider adapterLocale={ja} dateAdapter={AdapterDateFns}>
            <DatePicker
              disabled={currentHealthId !== 0}
              label="日付"
              onChange={e => {
                const date = e instanceof Date ? format(e, 'yyyy-MM-dd') : '';
                field.onChange(date);
              }}
              slotProps={{
                textField: {
                  error: !!errors.date,
                  helperText: currentHealthId === 0 ? (errors.date?.message ?? '') : '更新時は日付の変更はできません',
                },
              }}
              sx={datePickerWithLabel}
              value={field.value ? new Date(field.value) : null}
            />
          </LocalizationProvider>
        )}
      />

      <Stack spacing={1}>
        <FormTitle icon={ICONS.medicalKitFill} title="症状" />
        <Controller
          control={control}
          name="item"
          render={({ field }) => {
            const val = field.value;
            return (
              <FormGroup
                sx={{
                  columnGap: '0.5rem',
                  flexDirection: 'row',
                  marginTop: '0.25rem !important',
                  rowGap: 0,
                }}
              >
                {(healthCategory ?? []).map(category => {
                  const isChecked = val.includes(category.id);
                  return (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => {
                            const updatedValue = isChecked
                              ? val.filter(id => id !== category.id)
                              : [...val, category.id];
                            field.onChange(updatedValue); // 更新された配列を onChange 経由で反映
                          }}
                          size="small"
                        />
                      }
                      key={category.id}
                      label={category.name}
                    />
                  );
                })}
              </FormGroup>
            );
          }}
        />
        <Controller
          control={control}
          name="other"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              error={!!errors.other}
              helperText={errors.other?.message ?? '複数ある場合はカンマ+半角スペース区切りで入力'}
              id="other"
              label="その他"
              placeholder="その他の症状を入力"
              size="small"
              type="text"
              variant="outlined"
            />
          )}
        />
      </Stack>
      <Stack spacing={1.5}>
        <FormTitle icon={ICONS.healthStateFill} title="調子" />
        <Controller
          control={control}
          name="mental"
          render={({ field }) => (
            <Rating
              {...field}
              getLabelText={(value: number) => MentalIcons[value].label}
              highlightSelectedOnly
              id="mental"
              onChange={(_, value) => {
                field.onChange(value);
              }}
              slotProps={{
                icon: {
                  component: IconContainer,
                },
              }}
              sx={{
                '& .MuiRating-iconEmpty .MuiSvgIcon-root': {
                  color: theme.palette.action.disabled,
                },
                gap: '0.5rem',
              }}
              value={field.value || 0}
            />
          )}
        />
      </Stack>
      <Controller
        control={control}
        name="exercise"
        render={({ field }) => (
          <FormControlLabel
            {...field}
            checked={field.value}
            control={
              <Checkbox
                id="exercise"
                size="small"
                sx={{
                  marginLeft: '-10px',
                }}
              />
            }
            label="運動"
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="memo"
        render={({ field }) => (
          <TextField
            {...field}
            autoComplete="off"
            error={!!errors.memo}
            helperText={errors.memo?.message}
            id="memo"
            label="メモ"
            multiline
            placeholder="メモを入力（500文字以内）"
            spellCheck="false"
          />
        )}
      />
      <Stack spacing={1.5}>
        <PrimaryButton loading={isSaveLoading} type="submit">
          {currentHealthId === 0 ? '保存' : '更新'}
        </PrimaryButton>
        {currentHealthId !== 0 && (
          <DeleteButton loading={isDelLoading} onClick={handleDelete}>
            削除
          </DeleteButton>
        )}
      </Stack>
    </Stack>
  );
};
