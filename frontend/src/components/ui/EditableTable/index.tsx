import { ICONS } from '@/configs';
import { useAuthContext, useErrorContext } from '@/contexts';
import { useDeleteTable, useSaveTable } from '@/hooks';
import { bgBlack } from '@/styles';
import { theme } from '@/theme';
import type { AgGridTable } from '@/types';
import { createFileUrl } from '@/utils';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import {
  AgColumn,
  AllCommunityModule,
  type ColDef,
  type ColumnMovedEvent,
  type ColumnResizedEvent,
  type GetRowIdParams,
  type ICellRendererParams,
  ModuleRegistry,
  type RowDragEndEvent,
  type RowSelectionOptions,
  type SelectionColumnDef,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import type { CustomHeaderProps } from 'ag-grid-react';
import { debounce } from 'lodash';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { ColumnForm, TableMenu } from './components';
import { AG_GRID_LOCALE_JP } from './settings/locale';
import { myTheme } from './settings/theme';
import './style.scss';
import { useImportExcel } from './useImportExcel';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * 配列内のオブジェクトから、最大のID値を取得
 * - 配列が空の場合は 0 を返す
 */
const getMaxId = (rows: { id: number }[]): number => {
  if (rows.length === 0) return 0;
  return Math.max(...rows.map(item => item.id));
};

const CustomHeader = memo(
  (
    props: CustomHeaderProps & {
      setCurrentColumn: React.Dispatch<React.SetStateAction<AgColumn | null>>;
      setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    }
  ) => {
    const { column, displayName, setCurrentColumn, setIsModalOpen, setSort, showColumnMenu } = props;

    const [sortType, setSortType] = useState<'asc' | 'desc' | null>(null);
    const [isFilterActive, setIsFilterActive] = useState(false);
    const refButton = useRef<HTMLButtonElement>(null);

    const handleSortRequested = (currentSort: 'asc' | 'desc' | null, event: React.PointerEvent<HTMLButtonElement>) => {
      const nextSort = currentSort === 'asc' ? 'desc' : currentSort === 'desc' ? null : 'asc';
      setSortType(nextSort);
      setSort(nextSort, event.shiftKey);
    };

    useEffect(() => {
      const handleSortChanged = () => {
        const sort = column.getSort();
        setSortType(sort ?? null);
      };

      const checkFilterState = () => {
        setIsFilterActive(column.isFilterActive());
      };

      column.addEventListener('sortChanged', handleSortChanged);
      column.addEventListener('filterChanged', checkFilterState);

      // 初期状態を設定
      handleSortChanged();
      checkFilterState();

      return () => {
        column.removeEventListener('sortChanged', handleSortChanged);
        column.removeEventListener('filterChanged', checkFilterState);
      };
    }, [column]);

    // メニューの開閉
    const onMenuClicked = () => {
      showColumnMenu(refButton.current!);
    };

    const buttonStyle = {
      alignItems: 'center',
      background: 'none',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      display: 'flex',
      font: 'inherit',
      outline: 'none',
      padding: 0,
    };

    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <button
          onPointerUp={event => {
            handleSortRequested(sortType, event);
          }}
          style={buttonStyle}
        >
          <span>{displayName}</span>
          {sortType === 'asc' && (
            <Icon icon={ICONS.arrowUp} size="1rem" style={{ marginLeft: '0.5rem', marginTop: '2px' }} />
          )}
          {sortType === 'desc' && (
            <Icon icon={ICONS.arrowDown} size="1rem" style={{ marginLeft: '0.5rem', marginTop: '2px' }} />
          )}
        </button>
        <Box>
          <IconButton
            onClick={onMenuClicked}
            ref={refButton}
            size="small"
            sx={{
              backgroundColor: isFilterActive ? theme.palette.action.selected : 'inherit',
              mr: '3px',
              p: '3px',
            }}
          >
            <Icon icon={ICONS.filterFill} size="1rem" />
          </IconButton>
          <IconButton
            onClick={() => {
              setCurrentColumn(column as AgColumn);
              setIsModalOpen(true);
            }}
            size="small"
            sx={{
              p: '3px',
            }}
          >
            <Icon icon={ICONS.editFill} size="1rem" />
          </IconButton>
        </Box>
      </Stack>
    );
  }
);

const TextRenderer = (params: ICellRendererParams) => {
  // Excelからインポートしている都合で、どんなデータが入っているか分からないため分岐を設けている
  const value = params.value as unknown;
  if (typeof value === 'string') {
    return (
      <>
        {value.split('\n').map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </>
    );
  }
  // 数値の場合はそのまま表示
  if (typeof value === 'number') {
    return <span>{value}</span>;
  }
  // 配列やオブジェクトなど他の型はJSONで確認
  return <span>{value ? JSON.stringify(value) : ''}</span>;
};

const ImgRenderer = (params: ICellRendererParams) => {
  const { userId } = useAuthContext();
  const uploadURL = `${import.meta.env.VITE_UPLOAD_URL}/user${String(userId)}/`;

  if (typeof params.value !== 'string' || !params.value) {
    return <span></span>;
  }

  // uploadURLから始まるかどうか
  const src = params.value.startsWith(uploadURL)
    ? (() => {
        // uploadURL 以降のパス部分を取り出す
        const relativePath = params.value.slice(uploadURL.length);
        const parts = relativePath.split('/');
        const file = parts.pop() ?? '';
        const path = parts.join('/');
        return createFileUrl(file, path);
      })()
    : params.value;

  return <img alt="" src={src} />;
};

const UrlRenderer = (params: ICellRendererParams) =>
  params.value == null ? (
    <span></span>
  ) : (
    <a href={params.value as string} rel="noopener noreferrer" target="_blank">
      {params.value}
    </a>
  );

const SelectRenderer = (params: ICellRendererParams) => {
  // value が string かどうかチェック
  const val = typeof params.value === 'string' ? params.value : '';

  if (!val) {
    return <span></span>;
  }

  const [num, text] = val.split('.');

  if (num && text) {
    return (
      <span className="select" data-num={num}>
        {text}
      </span>
    );
  }

  return <span className="select">{val}</span>;
};

const buttonStyle = {
  '&[aria-expanded="true"]': {
    bgcolor: 'rgba(255, 255, 255, 0.15)',
  },
  '@media (hover: hover)': {
    '&:hover': {
      bgcolor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  borderRadius: '3px',
  color: theme.palette.secondary.light,
  flexShrink: 0,
  lineHeight: 1.35,
  padding: '10px 6px',
};

interface EditableTableProps {
  pathname: string;
  postId: string;
  tableData: AgGridTable;
}

interface TableHistory {
  columnDefs: ColDef[];
  label: string;
  newId: number;
  rowData: unknown[];
}
/* eslint-disable */
export const EditableTable = ({ pathname, postId, tableData }: EditableTableProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState(tableData.rowData);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(tableData.columnData);
  const [currentColumn, setCurrentColumn] = useState<AgColumn | null>(null);
  const [selectedRows, setSelectedRows] = useState<unknown[]>([]);
  const [newId, setNewId] = useState<number>(getMaxId(tableData.rowData)); // 現在のrowDataの最大数値を取得
  const isFirstRender = useRef(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const getRowId = useCallback((params: GetRowIdParams) => (params.data as { id: string }).id, []);
  const colIds = useMemo(() => columnDefs.map(col => col.field), [columnDefs]); // カラムのID一覧
  const { setErrors } = useErrorContext();
  const { updateTable } = useSaveTable();
  const { deleteTable } = useDeleteTable();
  const importExcel = useImportExcel();

  // クイックフィルターのテキストが変更されたときの処理
  const onQuickFilterChange = useCallback(() => {
    gridRef.current!.api.setGridOption(
      'quickFilterText',
      document.querySelector<HTMLInputElement>('#quickFilterForm')!.value
    );
  }, []);

  /**
   * テーブルの復元
   */
  // セルの復元の設定（削除した行やカラムには無効なのでtableHistoryで対応）
  const undoRedoCellEditing = true;
  const undoRedoCellEditingLimit = 20;

  const [tableHistory, setTableHistory] = useState<TableHistory[]>([]);

  // テーブルの状態を1つ前に戻す
  const handleUndoTable = useCallback(() => {
    setTableHistory(prev => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];

      setColumnDefs(last.columnDefs);
      setRowData(last.rowData);
      setNewId(last.newId);

      return prev.slice(0, -1); // 最後を削除
    });
  }, []);

  // 現状データの登録
  const saveHistory = useCallback(
    (label: string) => {
      setTableHistory(prev => [
        ...prev,
        {
          columnDefs: [...columnDefs],
          label,
          newId,
          rowData: [...rowData],
        },
      ]);
    },
    [columnDefs, newId, rowData]
  );

  /**
   * カラムの定義
   */
  // デフォルトのカラム定義
  const defaultColDef = useMemo<ColDef>(
    () => ({
      editable: true,
      filter: true,
      headerComponent: CustomHeader,
      headerComponentParams: {
        setCurrentColumn,
        setIsModalOpen,
      },
      initialWidth: 100,
      minWidth: 50,
    }),
    []
  );

  // 行選択の設定
  const rowSelection = useMemo<'multiple' | 'single' | RowSelectionOptions>(
    () => ({ headerCheckbox: false, mode: 'multiRow' }),
    []
  );

  // 行選択のチェックボックスの設定
  const selectionColumnDef: SelectionColumnDef = useMemo(
    () => ({
      filter: false,
      headerComponent: null,
      lockPosition: 'left',
      maxWidth: 70, // 矛盾しているけど、両方必要
      pinned: 'left',
      resizable: false,
      rowDrag: true, // rowDrag = true：すべての列で行のドラッグを有効にするには、 1つの列 (通常は最初の列) に列プロパティを設定
      sortable: false,
      width: 120, // 矛盾しているけど、両方必要
    }),
    []
  );

  // 行の選択状態が変更されたときの処理
  const onSelectionChanged = useCallback(() => {
    const selected = gridRef.current!.api.getSelectedRows();
    setSelectedRows(selected);
  }, []);

  /**
   * テーブルの表示幅と高さの設定
   */
  const [fullWidth, setFullWidth] = useState<boolean>(tableData.width);
  const [autoHeight, setAutoHeight] = useState<boolean>(true); // 現行は初期値trueで固定

  // テーブルの表示サイズを保存
  const saveTableSize = useCallback(
    (target: 'height' | 'width', size: boolean) => {
      void updateTable({
        data: size,
        id: tableData.id,
        pathname,
        postId,
        target,
      });
    },
    [pathname, tableData.id, postId, updateTable]
  );

  // 高さの切り替え
  const handleChangeHeight = useCallback(() => {
    setAutoHeight(prev => !prev);
    // 高さは保存せずに、毎回初期値からはじめる
  }, []);

  // 横幅の切り替え
  const handleChangeWidth = useCallback(() => {
    const newFullWidth = !fullWidth;
    setFullWidth(newFullWidth);
    saveTableSize('width', newFullWidth);
  }, [fullWidth, saveTableSize]);

  /**
   * テーブルの削除
   */
  const handleDeleteTable = useCallback(() => {
    const isConfirmed = globalThis.confirm('テーブルを削除しますか？');
    if (!isConfirmed) return;
    void deleteTable({
      id: tableData.id,
      pathname,
      postId,
    });
  }, [tableData.id, pathname, postId, deleteTable]);

  /**
   * 行の保存
   */
  const rowToPlainText = (row: Record<string, any>) => {
    return Object.values(row)
      .map(val => String(val ?? '')) // nullやundefinedも文字列化
      .join(' '); // 各カラムを空白でつなげる
  };

  const debounceSaveRowData = useMemo(() => {
    return debounce((rowData: any[]) => {
      const data = JSON.stringify(rowData);
      const plainRowData = rowData.map(row => rowToPlainText(row));
      const text = plainRowData.join('\n');

      void updateTable({
        data,
        id: tableData.id,
        pathname,
        postId,
        target: 'rowData',
        text,
      });
    }, 1000);
  }, [pathname, tableData.id, postId, updateTable]);

  // rowDataの更新に伴い保存
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // 初回は保存しない
    }
    debounceSaveRowData(rowData);
  }, [rowData, debounceSaveRowData]);

  // 行の追加
  const handleAddRow = useCallback(() => {
    const newStore = [...rowData];
    const focusedCell = gridRef.current!.api.getFocusedCell();
    // フォーカスされている次の行に新規行を追加
    if (focusedCell) {
      // focusedCell.rowIndex + 1	の位置から
      // 0 何も削除せず
      // { id: String(newId + 1) }	の要素を挿入
      newStore.splice(focusedCell.rowIndex + 1, 0, { id: String(newId + 1) });
    } else {
      newStore.push({ id: String(newId + 1) });
    }
    setRowData(newStore);
    setNewId(newId + 1);
  }, [rowData, newId]);

  // 選択行の削除
  const handleDeleteRows = useCallback(() => {
    const isConfirmed = globalThis.confirm('選択した行を削除しますか？');
    if (!isConfirmed) return;
    saveHistory('行の削除前');
    const selectedRowNodes = gridRef.current!.api.getSelectedNodes();
    const selectedIds = new Set(selectedRowNodes.map(rowNode => rowNode.id));
    const filteredData = rowData.filter(dataItem => !selectedIds.has((dataItem as { id: string }).id));
    setRowData(filteredData);
  }, [rowData, saveHistory]);

  // セルの編集が完了したときの処理（編集状態が解除された時に発火）
  const onCellValueChanged = useCallback(() => {
    debounceSaveRowData(rowData);
  }, [rowData, debounceSaveRowData]);

  /**
   * 列の保存
   */
  const debounceSaveColumnDefs = useMemo(() => {
    return debounce((saveColumnDefs: ColDef[]) => {
      const data = JSON.stringify(saveColumnDefs);
      void updateTable({
        data,
        id: tableData.id,
        pathname,
        postId,
        target: 'columnData',
      });
    }, 1000);
  }, [pathname, tableData.id, postId, updateTable]);

  // columnDefsの更新に伴い保存
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // 初回は保存しない
    }

    // 必要なデータだけに整形
    const saveColumnDefs: ColDef[] = columnDefs.map(col => {
      const {
        autoHeight, // autoHeight=trueでセルの内容に基づいて行の高さを設定。autoHeightは通常、wrapTextと併用される
        cellDataType,
        cellEditor,
        cellEditorParams, // 選択項目
        cellEditorPopup, // 入力欄の大きさの設定
        cellRenderer,
        cellStyle,
        field,
        headerName,
        initialWidth,
        pinned,
        width, // 現在の横幅
        wrapText, // wrapText=trueでテキストを切り捨てるのではなくセル内で折り返す
      } = col;
      return {
        autoHeight,
        cellDataType,
        cellEditor,
        cellEditorParams,
        cellEditorPopup,
        cellRenderer,
        cellStyle: typeof cellStyle === 'object' ? { ...cellStyle } : {},
        field,
        headerName,
        initialWidth: width ?? initialWidth, // 現在の横幅を次回の初回の幅にする
        pinned,
        wrapText,
      };
    });
    debounceSaveColumnDefs(saveColumnDefs);
  }, [columnDefs, debounceSaveColumnDefs]);

  // 列の新規追加・更新
  const handleUpdateColumn = useCallback(
    (newColDef: ColDef) => {
      const columns = gridRef.current!.api.getColumns();
      if (!columns) return;
      saveHistory('カラムの編集前');
      let isNew = true;
      const oldColDefs = columns.map(col => col.getColDef());
      const newColDefs = oldColDefs.map(col => {
        if (col.field === newColDef.field) {
          isNew = false;
          return newColDef;
        }
        return col;
      });
      if (isNew) newColDefs.push(newColDef);
      setColumnDefs(newColDefs);
    },
    [saveHistory]
  );

  // 列の削除
  const handleDeleteColumn = useCallback(
    (colId: string) => {
      const columns = gridRef.current!.api.getColumns();
      if (!columns) return;
      saveHistory('カラム削除前');
      const newColDefs = columns.map(col => col.getColDef()).filter(col => col.field !== colId);
      setColumnDefs(newColDefs);
      const newRowData = rowData.map(row => {
        const { [colId]: delItem, ...rest } = row as Record<string, unknown>; // colIdを除いた新しいオブジェクトを作成
        return rest;
      });
      setRowData(newRowData);
    },
    [saveHistory, rowData]
  );

  /**
   * 行・列の移動
   */
  // 列の移動
  const handleColumnMoved = useCallback(
    (event: ColumnMovedEvent) => {
      const newColumnOrder = event.api.getColumnDefs()?.map((column: ColDef) => column.field) ?? [];
      // columnDefsの順序をnewColumnOrderに合わせて更新
      const newColumnDefs = newColumnOrder.map(colId => columnDefs.find(col => col.field === colId));
      setColumnDefs(newColumnDefs as ColDef[]);
    },
    [columnDefs]
  );

  // 行の移動
  const handleRowDragEnd = useCallback((event: RowDragEndEvent) => {
    const newRowData: unknown[] = [];
    event.api.forEachNodeAfterFilterAndSort(node => {
      newRowData.push(node.data);
    });
    setRowData(newRowData);
  }, []);

  /**
   * カラム幅の更新
   */
  const debouncedResizeHandler = useMemo(() => {
    return debounce((e: ColumnResizedEvent) => {
      const newWidth = e.column?.getActualWidth();
      const colDef = e.column?.getColDef();
      if (!newWidth || !colDef) return;
      const newColDef = { ...colDef, width: newWidth };
      const newColDefs = columnDefs.map(col => {
        if (col.field === newColDef.field) {
          return newColDef;
        }
        return col;
      });
      setColumnDefs(newColDefs);
    }, 1000);
  }, [columnDefs]);

  const debounceColumnResized = useCallback(
    (e: ColumnResizedEvent) => {
      debouncedResizeHandler(e);
    },
    [debouncedResizeHandler]
  );

  /**
   * Excelのインポート
   */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerImportExcel = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // インポートされたExcelの処理
  const handleImportExcel = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const result = await importExcel({ file, newId });
        if (!result) return;

        if (!result.columns || !result.endId) return;
        saveHistory('Excelインポート前');
        setColumnDefs(prev => {
          const addColumns = Object.values(result.columns!).map(col => ({
            ...defaultColDef,
            cellDataType: 'text',
            cellRenderer: 'myTextRenderer',
            cellStyle: {
              textAlign: 'left',
            },
            field: col,
            headerName: col,
          }));
          return [...prev, ...addColumns];
        });
        setRowData(prev => [...(prev as unknown[]), ...result.rows!] as unknown[]);
        setNewId(result.endId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
        return;
      }
    },
    [saveHistory, importExcel, defaultColDef, newId, setErrors]
  );

  // CSVのエクスポート
  const handleExportCsv = useCallback(() => {
    gridRef.current!.api.exportDataAsCsv();
  }, []);

  return (
    <>
      <Box
        sx={{
          height: 'auto',
          margin: '0 auto',
          maxWidth: fullWidth ? 'none' : '1024px',
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            borderRadius: '6px 6px 0 0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            margin: '0 auto',
            padding: '0.5rem',
            position: 'relative',
            width: 'calc(100% - 2px)',
            zIndex: 3,
            ...bgBlack,
          }}
        >
          <TableMenu
            autoHeight={autoHeight}
            canUndo={tableHistory.length > 0 ? false : true}
            fullWidth={fullWidth}
            onChangeHeight={handleChangeHeight}
            onChangeWidth={handleChangeWidth}
            onDeleteTable={handleDeleteTable}
            onExportCsv={handleExportCsv}
            onImportExcel={triggerImportExcel}
            onUndoTable={handleUndoTable}
            undoLabel={tableHistory.length > 0 ? tableHistory[tableHistory.length - 1].label : ''}
          />

          <input
            accept=".xlsx"
            id="upload-excel"
            onChange={handleImportExcel}
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
          />

          <Divider
            orientation="vertical"
            sx={{
              borderColor: theme.palette.secondary.light,
              flexShrink: 0,
              height: '22px',
            }}
          />

          <Button
            onClick={handleAddRow}
            size="small"
            startIcon={<Icon color={theme.palette.secondary.light} icon={ICONS.addCircle} size="1rem" />}
            sx={buttonStyle}
          >
            行の追加
          </Button>

          <Button
            disabled={selectedRows.length === 0}
            onClick={handleDeleteRows}
            size="small"
            startIcon={
              <Icon
                color={selectedRows.length > 0 ? theme.palette.secondary.light : theme.palette.secondary.dark}
                icon={ICONS.delete}
                size="1rem"
              />
            }
            sx={{
              ...buttonStyle,
              '&.Mui-disabled': {
                backgroundColor: 'transparent !important',
                color: theme.palette.secondary.dark,
              },
            }}
          >
            行の削除
          </Button>

          <Button
            onClick={() => {
              setCurrentColumn(null);
              setIsModalOpen(true);
            }}
            size="small"
            startIcon={<Icon color={theme.palette.secondary.light} icon={ICONS.addCircle} size="1rem" />}
            sx={{
              marginRight: 'auto !important',
              ...buttonStyle,
            }}
          >
            列の追加
          </Button>

          <TextField
            aria-label="検索"
            autoComplete="off"
            id="quickFilterForm"
            onInput={onQuickFilterChange}
            placeholder="検索..."
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
            spellCheck="false"
            sx={{
              '& .MuiInputBase-root.MuiOutlinedInput-root': {
                backgroundColor: '#fff',
              },
              '& fieldset': {
                borderColor: `${theme.palette.secondary.light} !important`,
              },
              maxWidth: 260,
              width: '100%',
            }}
            type="search"
          />
        </Box>
        <Box
          sx={{
            height: autoHeight ? 'auto' : '500px',
          }}
        >
          <AgGridReact
            columnDefs={columnDefs}
            components={{
              myImageRenderer: ImgRenderer,
              mySelectRenderer: SelectRenderer,
              myTextRenderer: TextRenderer,
              myUrlRenderer: UrlRenderer,
            }}
            defaultColDef={defaultColDef}
            domLayout={autoHeight ? 'autoHeight' : 'normal'}
            getRowId={getRowId} // 特定の行を一意に識別する文字列IDを返す純粋関数を提供。グリッドはデータの変更や更新を最適に処理できるようになる
            localeText={AG_GRID_LOCALE_JP}
            onCellValueChanged={onCellValueChanged}
            onColumnMoved={handleColumnMoved}
            onColumnResized={debounceColumnResized}
            onRowDragEnd={handleRowDragEnd} // rowDragEnd: グリッド上でのドラッグが終了
            onSelectionChanged={onSelectionChanged}
            ref={gridRef}
            rowData={rowData}
            rowDragManaged={true} // rowDragManaged=true:マネージドドラッグでは、行がドラッグされたときにグリッドが行の再配置を担当。並べ替え中は機能しない
            rowDragMultiRow={true} // 選択した複数行を同時にドラッグ可能にする
            rowSelection={rowSelection}
            selectionColumnDef={selectionColumnDef}
            suppressDragLeaveHidesColumns={true}
            suppressMoveWhenColumnDragging={true}
            suppressMoveWhenRowDragging={true} // デフォルトでは、管理された行ドラッグはドラッグ中に行を移動する。この動作が望ましくない場合はsuppressMoveWhenRowDragging設定
            theme={myTheme}
            undoRedoCellEditing={undoRedoCellEditing} // 編集のやり直しを有効
            undoRedoCellEditingLimit={undoRedoCellEditingLimit} // やり直しの上限のステップ（デフォルトは10）
          />
        </Box>
      </Box>
      <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <ColumnForm
          colIds={colIds}
          currentColumn={currentColumn}
          defaultColDef={defaultColDef}
          onDeleteColumn={handleDeleteColumn}
          onUpdateColumn={handleUpdateColumn}
          setIsModalOpen={setIsModalOpen}
        />
      </Modal>
    </>
  );
};
