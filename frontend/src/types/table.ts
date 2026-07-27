import type { ColDef } from 'ag-grid-community';

/**
 * AG-grid内で利用するTableデータ
 * - height: boolean も保持しているが、現在利用なし
 */
export interface AgGridTable extends BaseTable {
  columnData: ColDef[];
  height: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowData: any[];
  width: boolean;
}

/**
 * DBから取得したTableデータ
 */
export interface ResponseTable extends BaseTable {
  columnData: string;
  height: number;
  rowData: string;
  width: number;
}

/**
 * Reduxで保管するTableデータ
 * - columnDataとrowDataはstringのまま保持する
 */
export interface Table extends BaseTable {
  columnData: string;
  height: boolean;
  rowData: string;
  width: boolean;
}

export type TableColumnType = 'columnData' | 'height' | 'rowData' | 'width';

interface BaseTable {
  id: number;
  page: string;
  postId: number;
}
