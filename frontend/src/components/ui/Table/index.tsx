import { useDeleteHealth, useDeleteMoney } from '@/hooks';
import { theme } from '@/theme';
import type { ExpenseCategory, IncomeCategory } from '@/types';
import { Box } from '@mui/material';
import { DataGrid, type GridRowId, type GridRowsProp } from '@mui/x-data-grid';
import { memo, useCallback, useMemo } from 'react';
import { CustomToolbar } from './CustomToolbar';
import { getColumns } from './getColumns';

interface TableProps {
  expenseCategory?: ExpenseCategory[];
  gridRows: GridRowsProp | null;
  iconMap?: Map<string, string>;
  incomeCategory?: IncomeCategory[];
  setButtonElement: (target: HTMLButtonElement | null) => void;
  setCurrentId?: React.Dispatch<React.SetStateAction<number>>;
  setFormType?: React.Dispatch<React.SetStateAction<string>>;
  setIsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  table: string;
}

const TableContent = ({
  expenseCategory,
  gridRows,
  iconMap,
  incomeCategory,
  setButtonElement,
  setCurrentId,
  setFormType,
  setIsModalOpen,
  table,
}: TableProps) => {
  const { deleteFood, deleteHealth } = useDeleteHealth();
  const { deleteMoney } = useDeleteMoney();

  // 行の編集（モーダルの編集画面を開く）
  const handleEdit = useCallback(
    (id: GridRowId) => () => {
      if (setCurrentId) setCurrentId(id as number);
      if (setFormType) setFormType(table);
      if (setIsModalOpen) setIsModalOpen(true);
    },
    [table, setCurrentId, setFormType, setIsModalOpen]
  );

  // 新規データの追加
  const handleAdd = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setButtonElement(e.currentTarget);
      if (setCurrentId) setCurrentId(0);
      if (setFormType) setFormType(table);
      if (setIsModalOpen) setIsModalOpen(true);
    },
    [table, setCurrentId, setFormType, setIsModalOpen, setButtonElement]
  );

  // 行の削除
  const handleDelete = useCallback(
    (id: GridRowId) => () => {
      const result = confirm('データを削除しますか？');
      if (!result) return;
      switch (table) {
        case 'food': {
          void deleteFood(Number(id));
          break;
        }
        case 'health': {
          void deleteHealth(Number(id));
          break;
        }
        case 'money': {
          void deleteMoney(Number(id));
          break;
        }
        default: {
          break;
        }
      }
    },
    [table, deleteHealth, deleteFood, deleteMoney]
  );

  // カラムの選択
  const columns = useMemo(() => {
    return getColumns(table, handleEdit, handleDelete, iconMap, expenseCategory, incomeCategory);
  }, [table, handleEdit, handleDelete, iconMap, expenseCategory, incomeCategory]);

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <DataGrid
        columns={columns}
        editMode="row"
        getRowHeight={() => (table === 'health' ? 'auto' : 52)}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        loading={!gridRows}
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
        pageSizeOptions={[10, 20, 30, 50, 100]}
        rows={gridRows ?? []}
        showToolbar
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        slots={{
          toolbar: props => <CustomToolbar {...props} onAdd={handleAdd} table={table} />,
        }}
        sx={{
          '& .MuiCircularProgress-root.MuiCircularProgress-indeterminate': {
            color: theme.palette.secondary.main,
            height: '30px !important',
            width: '30px !important',
          },
        }}
      />
    </Box>
  );
};

export const Table = memo(TableContent);
