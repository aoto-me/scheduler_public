import {
  textFieldOutlinedStyleWithGrayLabel,
  textFieldOutlinedStyleWithLabel,
  textFieldSelectStyleWithLabel,
} from '@/styles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { AgColumn, type CellStyle, type ColDef, type ValueFormatterParams } from 'ag-grid-community';
import { useEffect, useMemo, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { DeleteButton, PrimaryButton } from '../../Button';
import { type AlignType, type CellDataType, columnSchema, type ColumnSchema } from '../settings/schema';

export const valueFormatters = {
  numberFormatter: (params: ValueFormatterParams) =>
    params.value == null ? '' : (params.value as number).toLocaleString(),
};

const cellDataTypeMap = new Map([
  ['boolean', 'チェックボックス'],
  ['dateString', '日付'],
  ['img', '画像'],
  ['number', '数値'],
  ['select', '選択'],
  ['text', 'テキスト'],
  ['url', 'URL'],
]);

const alignMap = new Map([
  ['center', '中央揃え'],
  ['left', '左揃え'],
  ['right', '右揃え'],
]);

interface ColumnFormProps {
  colIds: (string | undefined)[];
  currentColumn: AgColumn | null;
  defaultColDef: ColDef;
  onDeleteColumn: (colId: string) => void;
  onUpdateColumn: (newColDef: ColDef) => void;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ColumnForm = ({
  colIds,
  currentColumn,
  defaultColDef,
  onDeleteColumn,
  onUpdateColumn,
  setIsModalOpen,
}: ColumnFormProps) => {
  const [idError, setIdError] = useState('');

  const colDef = useMemo(() => {
    if (!currentColumn) return null;
    return currentColumn.getColDef();
  }, [currentColumn]);

  const defaultValues = {
    align: 'left' as AlignType,
    autoHeight: false,
    cellDataType: 'text' as CellDataType,
    field: '',
    headerName: '',
    pinned: false,
    selectItem: '',
    wrapText: false,
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
  } = useForm<ColumnSchema>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(columnSchema),
  });

  // idの重複チェック
  const currentCellDataType = watch('cellDataType');
  const currentField = watch('field');
  useEffect(() => {
    if (colIds.includes(currentField)) {
      setIdError('IDが重複しています');
    } else {
      setIdError('');
    }
  }, [currentField, colIds]);

  useEffect(() => {
    if (!currentColumn || !colDef) {
      reset(defaultValues);
      return;
    }

    // cellEditorParams の処理 (選択項目)
    const cellEditorParams = colDef.cellEditorParams ? (colDef.cellEditorParams as { values?: string[] }).values : null;
    const editorParamsValue = cellEditorParams ? cellEditorParams.join(', ') : '';
    const { cellDataType, cellRenderer } = colDef as {
      cellDataType?: CellDataType;
      cellRenderer?: string;
    };
    let cellDataTypeValue = cellDataType;

    // 文字揃え位置
    const cellStyle = colDef.cellStyle as CellStyle;
    const textAlign = (cellStyle.textAlign || 'left') as AlignType;

    if (cellDataType === 'text' && editorParamsValue !== '') {
      // 'text'かつ editorParamsValueがあればselect
      cellDataTypeValue = 'select';
    } else if (cellRenderer) {
      if (cellRenderer === 'myImageRenderer') {
        cellDataTypeValue = 'img';
      } else if (cellRenderer === 'myUrlRenderer') {
        cellDataTypeValue = 'url';
      }
    }
    setValue('field', colDef.field ?? '');
    setValue('headerName', colDef.headerName ?? '');
    setValue('cellDataType', cellDataTypeValue ?? 'text');
    setValue('align', textAlign);
    setValue('pinned', Boolean(colDef.pinned));
    setValue('autoHeight', Boolean(colDef.autoHeight));
    setValue('wrapText', Boolean(colDef.wrapText));
    setValue('selectItem', editorParamsValue);
  }, [currentColumn]);

  // 新規保存・更新処理
  const onSubmit: SubmitHandler<ColumnSchema> = () => {
    const formData = getValues();
    const { cellDataType } = formData;
    const newCellDataType = () => {
      if (['boolean', 'dateString', 'number', 'text'].includes(cellDataType)) {
        return cellDataType;
      }
      if (['img', 'select', 'url'].includes(cellDataType)) {
        return 'text'; // AgGridにないデータ形式はtextに戻す
      }
    };

    const newColDef: ColDef = {
      ...defaultColDef,

      // 既存データにwidthがあれば上書き
      // widthがない場合はinitialWidthを格納する
      ...(colDef && { initialWidth: colDef.width ?? colDef.initialWidth }),

      autoHeight: formData.autoHeight,
      cellDataType: newCellDataType(),
      cellStyle: { textAlign: formData.align },
      field: formData.field,
      headerName: formData.headerName,
      pinned: formData.pinned ? 'left' : null,
      wrapText: formData.wrapText,

      ...(['img', 'text', 'url'].includes(cellDataType) && {
        cellEditor: 'agLargeTextCellEditor', // 大きなセルエディター
        cellEditorPopup: true, // セルエディターがポップアップに表示される
      }),

      ...(cellDataType === 'number' && {
        valueFormatter: valueFormatters.numberFormatter,
      }),
      ...(cellDataType === 'text' && {
        cellRenderer: 'myTextRenderer',
      }),
      ...(cellDataType === 'img' && {
        cellRenderer: 'myImageRenderer',
      }),
      ...(cellDataType === 'url' && {
        cellRenderer: 'myUrlRenderer',
      }),
      ...(cellDataType === 'select' && {
        cellEditor: 'agSelectCellEditor', // 選択式のセルエディター
        cellEditorParams: {
          values: formData.selectItem.split(',').map(item => item.trim()),
        }, // 選択式のセルエディターの選択項目
        cellRenderer: 'mySelectRenderer',
      }),
    };

    onUpdateColumn(newColDef);
    setIsModalOpen(false);
  };

  // 削除
  const onDelete: () => void = () => {
    onDeleteColumn(currentColumn?.getColId() ?? '');
    setIsModalOpen(false);
  };

  return (
    <>
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)} spacing={3.5}>
        <Controller
          control={control}
          name="field"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              disabled={!!currentColumn}
              error={!!errors.field || (!currentColumn && !!idError)}
              helperText={currentColumn ? '更新時はIDの変更はできません' : (errors.field?.message ?? idError)}
              id="field"
              label="ID"
              placeholder="IDを入力"
              size="small"
              sx={textFieldOutlinedStyleWithLabel}
              type="text"
              variant="outlined"
            />
          )}
        />

        <Controller
          control={control}
          name="headerName"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              error={!!errors.headerName}
              helperText={errors.headerName?.message}
              id="headerName"
              label="カラム名"
              placeholder="カラム名を入力"
              size="small"
              sx={textFieldOutlinedStyleWithLabel}
              type="text"
              variant="outlined"
            />
          )}
        />

        <Box>
          <Controller
            control={control}
            name="cellDataType"
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.cellDataType}
                helperText={errors.cellDataType?.message}
                id="cellDataType"
                label="データタイプ"
                required
                select
                size="small"
                sx={textFieldSelectStyleWithLabel}
                variant="filled"
              >
                {['text', 'number', 'boolean', 'dateString', 'select', 'img', 'url'].map((item, index) => (
                  <MenuItem key={`cellDataType-${String(index)}`} value={item}>
                    {cellDataTypeMap.get(item)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {currentCellDataType === 'select' && (
            <Controller
              control={control}
              name="selectItem"
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.selectItem}
                  helperText={errors.selectItem?.message ?? '複数ある場合はカンマ区切りで入力'}
                  id="selectItem"
                  label="選択項目"
                  placeholder="選択項目を入力"
                  size="small"
                  sx={{
                    ...textFieldOutlinedStyleWithGrayLabel,
                    marginTop: '0.75rem',
                  }}
                  type="text"
                  variant="outlined"
                />
              )}
            />
          )}
        </Box>

        <Controller
          control={control}
          name="align"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.align}
              helperText={errors.align?.message}
              id="align"
              label="文字揃え"
              required
              select
              size="small"
              sx={textFieldSelectStyleWithLabel}
              variant="filled"
            >
              {['left', 'center', 'right'].map((item, index) => (
                <MenuItem key={`align-${String(index)}`} value={item}>
                  {alignMap.get(item)}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Box>
          <Controller
            control={control}
            name="autoHeight"
            render={({ field }) => (
              <FormControlLabel
                {...field}
                checked={field.value}
                control={<Checkbox id="autoHeight" size="small" />}
                label="高さを自動変動（テキストを折り返す場合は、併用）"
                onChange={field.onChange}
                sx={{
                  width: '100%',
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="wrapText"
            render={({ field }) => (
              <FormControlLabel
                {...field}
                checked={field.value}
                control={<Checkbox id="wrapText" size="small" />}
                label="テキストを折り返す"
                onChange={field.onChange}
                sx={{
                  width: '100%',
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="pinned"
            render={({ field }) => (
              <FormControlLabel
                {...field}
                checked={field.value}
                control={<Checkbox id="pinned" size="small" />}
                label="列を左固定"
                onChange={field.onChange}
                sx={{
                  width: '100%',
                }}
              />
            )}
          />
        </Box>

        <Stack spacing={1.5}>
          <PrimaryButton type="submit">{currentColumn ? '更新' : '保存'}</PrimaryButton>
          {currentColumn && <DeleteButton onClick={onDelete}>削除</DeleteButton>}
        </Stack>
      </Stack>
    </>
  );
};
