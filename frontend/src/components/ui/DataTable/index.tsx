import { useDeleteSettings, useSaveSettings } from '@/hooks';
import type {
  ExpenseCategoryWithNew,
  FoodDBWithNew,
  HealthCategoryWithNew,
  IncomeCategoryWithNew,
  Nutrition,
  RSSListWithNew,
  YearEventWithNew,
} from '@/types';
import { Box } from '@mui/material';
import {
  DataGrid,
  type GridEventListener,
  GridRowEditStopReasons,
  type GridRowId,
  GridRowModes,
  type GridRowModesModel,
  type GridRowsProp,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { CustomToolbar } from './CustomToolbar';
import { getColumns } from './getColumns';

interface DataTableProps {
  ariaLabel?: string;
  gridRows: GridRowsProp | null;
  table: string;
}

// 編集中の行からフォームが外れたとき
const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
  if (params.reason === GridRowEditStopReasons.rowFocusOut) {
    event.defaultMuiPrevented = true;
  }
};

const DataTableContent = ({ ariaLabel, gridRows, table }: DataTableProps) => {
  const [rows, setRows] = useState<GridRowsProp>(gridRows ?? []);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (gridRows) setRows(gridRows);
  }, [gridRows]);

  const {
    saveExpenseCategory,
    saveFoodDB,
    saveHealthCategory,
    saveIncomeCategory,
    saveNutrition,
    saveRssList,
    saveYearEvent,
  } = useSaveSettings();
  const {
    deleteExpenseCategory,
    deleteFoodDB,
    deleteHealthCategory,
    deleteIncomeCategory,
    deleteRssList,
    deleteYearEvent,
  } = useDeleteSettings();

  /**
   * 行の編集
   */
  const handleEditClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    },
    [rowModesModel]
  );

  /**
   * 行の保存
   */
  const handleSaveClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    },
    [rowModesModel]
  );

  /**
   * 行の削除
   */
  const handleDeleteClick = useCallback(
    (id: GridRowId) => async () => {
      const result = confirm(`データを削除しますか？`);
      if (!result) return;
      let response: null | string = null;

      switch (table) {
        case 'expenseCategory': {
          response = await deleteExpenseCategory(id as number);
          break;
        }
        case 'foodDB': {
          response = await deleteFoodDB(id as number);
          break;
        }
        case 'healthCategory': {
          response = await deleteHealthCategory(id as number);
          break;
        }
        case 'incomeCategory': {
          response = await deleteIncomeCategory(id as number);
          break;
        }
        case 'rss': {
          response = await deleteRssList(id as number);
          break;
        }
        case 'yearEvent': {
          response = await deleteYearEvent(id as number);
          break;
        }
        default: {
          break;
        }
      }

      if (response !== 'ok') throw new Error('処理をキャンセル');
      setRows(rows.filter(row => row.id !== id));
    },
    [
      rows,
      table,
      deleteExpenseCategory,
      deleteFoodDB,
      deleteHealthCategory,
      deleteIncomeCategory,
      deleteRssList,
      deleteYearEvent,
    ]
  );

  /**
   * 編集のキャンセル
   */
  const handleCancelClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({
        ...rowModesModel,
        [id]: { ignoreModifications: true, mode: GridRowModes.View },
      });
      const editedRow = rows.find(row => row.id === id);
      if (editedRow!.isNew) {
        // 新規追加行の場合
        setRows(rows.filter(row => row.id !== id));
      }
    },
    [rows, rowModesModel]
  );

  /**
   * 行の更新
   */
  const processRowUpdate = useCallback(
    async (newRow: GridValidRowModel): Promise<GridValidRowModel> => {
      const newId = newRow.id as number; // idの初期値を設定
      const oldRow = rows.find(row => row.id === newRow.id);
      let updatedRow = {
        ...oldRow,
        id: newId,
        isNew: false,
      }; // 初期値として更新前の行をセット
      let response: unknown = null;

      switch (table) {
        case 'expenseCategory': {
          response = await saveExpenseCategory(newRow as ExpenseCategoryWithNew);
          break;
        }
        case 'foodDB': {
          response = await saveFoodDB(newRow as FoodDBWithNew);
          break;
        }
        case 'healthCategory': {
          response = await saveHealthCategory(newRow as HealthCategoryWithNew);
          break;
        }
        case 'incomeCategory': {
          response = await saveIncomeCategory(newRow as IncomeCategoryWithNew);
          break;
        }
        case 'nutrition': {
          response = await saveNutrition(newRow as Nutrition);
          break;
        }
        case 'rss': {
          response = await saveRssList(newRow as RSSListWithNew);
          break;
        }
        case 'yearEvent': {
          response = await saveYearEvent(newRow as YearEventWithNew);
          break;
        }
        default: {
          break;
        }
      }

      if (!response) throw new Error('処理をキャンセル');

      updatedRow = { ...(response as { id: number }), isNew: false }; // 更新後の行をセット
      setRows(rows.map(row => (row.id === newRow.id ? updatedRow : row)));

      // 更新された行を返す
      return updatedRow;
    },
    [
      rows,
      table,
      saveRssList,
      saveYearEvent,
      saveFoodDB,
      saveIncomeCategory,
      saveExpenseCategory,
      saveHealthCategory,
      saveNutrition,
    ]
  );

  // 編集 → 表示 に切り替え
  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  // カラムの選択
  const columns = useMemo(() => {
    return getColumns(table, rowModesModel, handleSaveClick, handleCancelClick, handleEditClick, handleDeleteClick);
  }, [table, rowModesModel, handleSaveClick, handleCancelClick, handleEditClick, handleDeleteClick]);

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <DataGrid
        aria-label={ariaLabel}
        columns={columns}
        editMode="row"
        getRowHeight={() => (table === 'file' ? 'auto' : 52)}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        loading={gridRows ? false : true}
        localeText={{
          // Actions cell more text
          actionsCellMore: 'もっと見る',
          aggregationFunctionLabelAvg: '平均',
          aggregationFunctionLabelMax: '最大値',
          aggregationFunctionLabelMin: '最小値',
          aggregationFunctionLabelSize: 'サイズ',
          aggregationFunctionLabelSum: '和',
          // Aggregation
          aggregationMenuItemHeader: '合計',
          booleanCellFalseLabel: '偽',
          // Boolean cell text
          booleanCellTrueLabel: '真',
          // Checkbox selection text
          checkboxSelectionHeaderName: 'チェックボックス',
          checkboxSelectionSelectAllRows: 'すべての行を選択',
          checkboxSelectionSelectRow: '行を選択',
          checkboxSelectionUnselectAllRows: 'すべての行選択を解除',
          checkboxSelectionUnselectRow: '行選択を解除',
          collapseDetailPanel: '折りたたみ',
          columnHeaderFiltersLabel: 'フィルター表示',
          // Column header text
          columnHeaderFiltersTooltipActive: count => `${String(count)}件のフィルターを適用中`,
          columnHeaderSortIconLabel: 'ソート',
          columnMenuFilter: 'フィルター',
          columnMenuHideColumn: '列非表示',
          // Column menu text
          columnMenuLabel: 'メニュー',
          columnMenuManageColumns: '列管理',
          columnMenuShowColumns: '列表示',
          columnMenuSortAsc: '昇順ソート',
          columnMenuSortDesc: '降順ソート',
          columnMenuUnsort: 'ソート解除',
          columnsManagementNoColumns: 'カラムなし',
          columnsManagementReset: 'リセット',
          // Columns management text
          columnsManagementSearchTitle: '検索',
          columnsManagementShowHideAllText: 'すべて表示/非表示',
          // Master/detail
          detailPanelToggle: '詳細パネルの切り替え',
          expandDetailPanel: '展開',
          'filterOperator!=': '!=',
          'filterOperator<': '<',
          'filterOperator<=': '<=',
          'filterOperator=': '=',
          'filterOperator>': '>',
          'filterOperator>=': '>=',
          filterOperatorAfter: '...より後ろ',
          filterOperatorBefore: '...より前',
          // Filter operators text
          filterOperatorContains: '...を含む',
          filterOperatorDoesNotContain: '...を含まない',
          filterOperatorDoesNotEqual: '...に等しくない',
          filterOperatorEndsWith: '...で終わる',
          filterOperatorEquals: '...に等しい',
          filterOperatorIs: '...である',
          filterOperatorIsAnyOf: '...のいずれか',
          filterOperatorIsEmpty: '...空である',
          filterOperatorIsNotEmpty: '...空でない',
          filterOperatorNot: '...でない',
          filterOperatorOnOrAfter: '...以降',
          filterOperatorOnOrBefore: '...以前',
          filterOperatorStartsWith: '...で始まる',
          // columnsManagementDeleteIconLabel: 'Clear',
          // Filter panel text
          filterPanelAddFilter: 'フィルター追加',
          // filterPanelColumns: '列',
          filterPanelColumn: '列',
          filterPanelDeleteIconLabel: '削除',
          filterPanelInputLabel: '値',
          filterPanelInputPlaceholder: '値を入力…',
          filterPanelLogicOperator: '論理演算子',
          filterPanelOperator: '演算子',
          filterPanelOperatorAnd: 'And',
          filterPanelOperatorOr: 'Or',
          filterPanelRemoveAll: 'すべて削除',
          // Filter values text
          filterValueAny: 'いずれか',
          filterValueFalse: '偽',
          filterValueTrue: '真',
          // Rows selected footer text
          footerRowSelected: count => `${String(count)}行を選択中`,
          // Total row amount footer text
          footerTotalRows: '総行数:',
          // Total visible row amount footer text
          footerTotalVisibleRows: (visibleCount, totalCount) =>
            `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
          groupColumn: name => `${name}でグループ化`,
          // Grouping columns
          groupingColumnHeaderName: 'グループ',
          'headerFilterOperator!=': '等しくない',
          'headerFilterOperator<': '未満',
          'headerFilterOperator<=': '以下',
          'headerFilterOperator=': '等しい',
          'headerFilterOperator>': 'より大きい',
          'headerFilterOperator>=': '以上',
          headerFilterOperatorAfter: '...より後ろ',
          headerFilterOperatorBefore: '...より前',
          // Header filter operators text
          headerFilterOperatorContains: '含む',
          headerFilterOperatorDoesNotContain: '含まない',
          headerFilterOperatorDoesNotEqual: '等しくない',
          headerFilterOperatorEndsWith: 'で終わる',
          headerFilterOperatorEquals: '等しい',
          headerFilterOperatorIs: 'である',
          headerFilterOperatorIsAnyOf: 'いずれか',
          headerFilterOperatorIsEmpty: '空白',
          headerFilterOperatorIsNotEmpty: '空白ではない',
          headerFilterOperatorNot: 'ではない',
          headerFilterOperatorOnOrAfter: '...以降',
          headerFilterOperatorOnOrBefore: '...以前',
          headerFilterOperatorStartsWith: 'で始まる',
          noResultsOverlayLabel: '結果がありません。',
          // Root
          noRowsLabel: 'データがありません。',
          // Column pinning text
          pinToLeft: '左側に固定',
          pinToRight: '右側に固定',
          // Row reordering text
          rowReorderingHeaderName: '行並び替え',
          // Columns selector toolbar button text
          toolbarColumns: '列の表示',
          toolbarColumnsLabel: '列選択を表示',
          // Density selector toolbar button text
          toolbarDensity: '行間隔',
          toolbarDensityComfortable: '広め',
          toolbarDensityCompact: 'コンパクト',
          toolbarDensityLabel: '行間隔',
          toolbarDensityStandard: '標準',
          // Export selector toolbar button text
          toolbarExport: 'エクスポート',
          toolbarExportCSV: 'CSVダウンロード',
          toolbarExportExcel: 'Excelダウンロード',
          toolbarExportLabel: 'エクスポート',
          toolbarExportPrint: '印刷',
          // Filters toolbar button text
          toolbarFilters: 'フィルター',
          toolbarFiltersLabel: 'フィルター',
          toolbarFiltersTooltipActive: count => `${String(count)}件のフィルターを適用中`,
          toolbarFiltersTooltipHide: 'フィルター非表示',
          toolbarFiltersTooltipShow: 'フィルターを表示',
          toolbarQuickFilterDeleteIconLabel: 'クリア',
          toolbarQuickFilterLabel: '検索',
          // Quick filter toolbar field
          toolbarQuickFilterPlaceholder: '検索…',
          treeDataCollapse: '折りたたみ',
          treeDataExpand: '展開',
          // Tree Data
          treeDataGroupingHeaderName: 'グループ',
          unGroupColumn: name => `${name}のグループを解除`,
          unpin: '固定解除',
        }}
        onRowEditStop={handleRowEditStop}
        onRowModesModelChange={handleRowModesModelChange}
        pageSizeOptions={[10, 20, 30, 50, 100]}
        processRowUpdate={processRowUpdate}
        rowModesModel={rowModesModel}
        rows={rows}
        showToolbar
        slotProps={{
          toolbar: { setRowModesModel, setRows, showQuickFilter: true },
        }}
        slots={{
          toolbar: props => <CustomToolbar {...props} rows={rows} table={table} />,
        }}
      />
    </Box>
  );
};

export const DataTable = memo(DataTableContent);
