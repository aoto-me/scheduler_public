import { useDeleteHealth, useSaveHealth } from '@/hooks';
import { selectAllFoodDBMap, selectFoodById, useAppSelector } from '@/redux';
import {
  autocompleteTextFieldStyle,
  datePickerWithLabel,
  textFieldOutlinedStyleWithGrayLabel,
  textFieldOutlinedStyleWithLabel,
  textFieldSelectStyle,
} from '@/styles';
import { type FoodDB, UNIT_TYPES, type UnitType } from '@/types';
import { foodSchema, type FoodSchema } from '@/validations/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete, Button, MenuItem, Stack, TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { useCallback, useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { DeleteButton, PrimaryButton } from '../ui';

interface FoodFormProps {
  currentDay: string;
  currentFoodId: number;
  setCurrentFoodId: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FoodForm = ({
  currentDay,
  currentFoodId,
  setCurrentFoodId,
  setIsLoading,
  setIsModalOpen,
}: FoodFormProps) => {
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isDelLoading, setIsDelLoading] = useState(false);
  const [autoFillData, setAutoFillData] = useState<null | {
    data: FoodDB;
    quantity: number;
    unit: string;
  }>(null);
  const food = useAppSelector(state => selectFoodById(state, currentFoodId));
  const foodDB = useAppSelector(selectAllFoodDBMap);
  const { saveFood } = useSaveHealth();
  const { deleteFood } = useDeleteHealth();

  const defaultValues = {
    carb: null,
    date: currentDay,
    energy: null,
    fat: null,
    name: '',
    protein: null,
    quantity: null,
    salt: null,
    unit: 'g' as UnitType,
  };

  // ReactHookForm
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<FoodSchema>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(foodSchema),
  });

  // 現在のフォームの項目を監視して autoFillData を作成
  const currentName = watch('name');
  const currentQuantity = watch('quantity');
  const currentUnit = watch('unit');
  useEffect(() => {
    if (!currentName) {
      setAutoFillData(null);
      return;
    }

    const foodData = foodDB.get(currentName);
    if (!foodData || !currentQuantity) {
      setAutoFillData(null);
      return;
    }

    const DBunit = foodData.perItem ? '個' : 'g';
    if (currentUnit !== DBunit) {
      setAutoFillData(null);
      return;
    }

    setAutoFillData({
      data: foodData,
      quantity: currentQuantity,
      unit: currentUnit,
    });
  }, [currentName, currentQuantity, currentUnit, foodDB]);

  const handleAutoFill = useCallback(() => {
    if (!autoFillData) return;
    const data = autoFillData.data;
    const currentQuantity = autoFillData.quantity;
    const currentUnit = autoFillData.unit;

    const roundToThreeDecimals = (value: null | number): null | number => {
      if (value === null) return null;
      return Math.round(value * 1000) / 1000;
    };

    const calculateValue = (baseValue: null | number, multiplier: number): null | number => {
      if (baseValue === null) return null;
      return roundToThreeDecimals(baseValue * multiplier);
    };

    if (currentUnit === '個') {
      setValue('energy', calculateValue(data.energy, currentQuantity) ?? 0);
      setValue('protein', calculateValue(data.protein, currentQuantity));
      setValue('fat', calculateValue(data.fat, currentQuantity));
      setValue('carb', calculateValue(data.carb, currentQuantity));
      setValue('salt', calculateValue(data.salt, currentQuantity));
    }

    if (currentUnit === 'g') {
      const ratio = currentQuantity / 100; // 100gあたりで食品DBが登録されているため
      setValue('energy', calculateValue(data.energy, ratio) ?? 0);
      setValue('protein', calculateValue(data.protein, ratio));
      setValue('fat', calculateValue(data.fat, ratio));
      setValue('carb', calculateValue(data.carb, ratio));
      setValue('salt', calculateValue(data.salt, ratio));
    }
  }, [autoFillData, setValue]);

  // 既存データがあれば、フォームにデータをセット
  useEffect(() => {
    if (currentFoodId === 0 || !food) {
      reset(defaultValues);
      return;
    }
    setValue('date', food.date);
    setValue('name', food.name);
    setValue('quantity', food.quantity);
    setValue('unit', food.unit);
    setValue('energy', food.energy);
    setValue('protein', food.protein);
    setValue('fat', food.fat);
    setValue('carb', food.carb);
    setValue('salt', food.salt);
  }, [currentFoodId]);

  /**
   * 新規・更新
   */
  const onSubmit: SubmitHandler<FoodSchema> = useCallback(() => {
    setIsSaveLoading(true);
    setIsLoading(true);
    const formData = getValues();
    const { energy, name, quantity, ...rest } = formData;

    saveFood({
      energy: energy ?? 0,
      name: name,
      quantity: quantity ?? 0,
      ...rest,
      id: currentFoodId,
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
  }, [currentFoodId, saveFood, getValues, setIsLoading, setIsModalOpen]);

  /**
   * 削除
   */
  const handleDelete = useCallback(() => {
    if (currentFoodId === 0) return;
    setIsDelLoading(true);
    setIsLoading(true);

    deleteFood(currentFoodId)
      .then(response => {
        if (response === 'ok') {
          setIsDelLoading(false);
          setIsLoading(false);
          setIsModalOpen(false);
          setCurrentFoodId(0);
        } else {
          setIsDelLoading(false);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsDelLoading(false);
        setIsLoading(false);
      });
  }, [currentFoodId, deleteFood, setCurrentFoodId, setIsDelLoading, setIsLoading, setIsModalOpen]);

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
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
        name="name"
        render={({ field }) => (
          <Autocomplete
            {...field}
            disablePortal
            freeSolo
            getOptionLabel={option => option}
            id="name"
            noOptionsText="該当するデータはありません"
            onChange={(_, newValue) => {
              field.onChange(newValue ?? '');
            }}
            onInputChange={(_, inputValue) => {
              field.onChange(inputValue);
            }}
            options={[...foodDB.keys()]}
            renderInput={params => (
              <TextField
                {...params}
                error={!!errors.name}
                helperText={errors.name?.message}
                label="名称を選択 or 入力"
                placeholder="名称を選択 or 入力"
                size="small"
                sx={autocompleteTextFieldStyle}
                variant="filled"
              />
            )}
          />
        )}
      />

      <Stack
        direction={'row'}
        spacing={1}
        sx={{
          flexWrap: 'nowrap',
        }}
      >
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.quantity}
              helperText={errors.quantity?.message}
              id="quantity"
              label="量"
              onChange={event => {
                const newValue = event.target.value;
                field.onChange(newValue === '' ? null : Number(newValue));
              }}
              placeholder="量を設定"
              required
              size="small"
              sx={{
                ...textFieldOutlinedStyleWithLabel,
                flexGrow: 1,
              }}
              type="number"
              value={field.value ?? ''}
            />
          )}
        />

        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.unit}
              helperText={errors.unit?.message}
              hiddenLabel
              id="unit"
              required
              select
              size="small"
              sx={{
                ...textFieldSelectStyle,
                flexShrink: 0,
                minWidth: '5rem',
                width: 'fit-content',
              }}
              variant="filled"
            >
              {UNIT_TYPES.map((item, index) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>

      <Button
        disabled={autoFillData === null}
        onClick={handleAutoFill}
        sx={{
          width: 'fit-content',
        }}
        variant="contained"
      >
        データベースから自動入力
      </Button>

      <Controller
        control={control}
        name="energy"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.energy}
            helperText={errors.energy?.message}
            id="energy"
            label="熱量（kcal）"
            onChange={event => {
              const newValue = event.target.value;
              field.onChange(newValue === '' ? null : Number(newValue));
            }}
            placeholder="熱量を設定"
            required
            size="small"
            sx={textFieldOutlinedStyleWithLabel}
            type="number"
            value={field.value ?? ''}
            variant="outlined"
          />
        )}
      />
      <Controller
        control={control}
        name="protein"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.protein}
            helperText={errors.protein?.message}
            id="protein"
            label="たんぱく質（g）"
            onChange={event => {
              const newValue = event.target.value;
              field.onChange(newValue === '' ? null : Number(newValue));
            }}
            placeholder="たんぱく質を設定"
            size="small"
            sx={textFieldOutlinedStyleWithGrayLabel}
            type="number"
            value={field.value ?? ''}
            variant="outlined"
          />
        )}
      />

      <Controller
        control={control}
        name="fat"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.fat}
            helperText={errors.fat?.message}
            id="fat"
            label="脂質（g）"
            onChange={event => {
              const newValue = event.target.value;
              field.onChange(newValue === '' ? null : Number(newValue));
            }}
            placeholder="脂質を設定"
            size="small"
            sx={textFieldOutlinedStyleWithGrayLabel}
            type="number"
            value={field.value ?? ''}
            variant="outlined"
          />
        )}
      />

      <Controller
        control={control}
        name="carb"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.carb}
            helperText={errors.carb?.message}
            id="carb"
            label="炭水化物（g）"
            onChange={event => {
              const newValue = event.target.value;
              field.onChange(newValue === '' ? null : Number(newValue));
            }}
            placeholder="炭水化物を設定"
            size="small"
            sx={textFieldOutlinedStyleWithGrayLabel}
            type="number"
            value={field.value ?? ''}
            variant="outlined"
          />
        )}
      />

      <Controller
        control={control}
        name="salt"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.salt}
            helperText={errors.salt?.message}
            id="salt"
            label="食塩相当量（g）"
            onChange={event => {
              const newValue = event.target.value;
              field.onChange(newValue === '' ? null : Number(newValue));
            }}
            placeholder="食塩相当量を設定"
            size="small"
            sx={textFieldOutlinedStyleWithGrayLabel}
            type="number"
            value={field.value ?? ''}
            variant="outlined"
          />
        )}
      />

      <Stack spacing={1.5}>
        <PrimaryButton loading={isSaveLoading} type="submit">
          {currentFoodId === 0 ? '保存' : '更新'}
        </PrimaryButton>
        {currentFoodId !== 0 && (
          <DeleteButton loading={isDelLoading} onClick={handleDelete}>
            削除
          </DeleteButton>
        )}
      </Stack>
    </Stack>
  );
};
