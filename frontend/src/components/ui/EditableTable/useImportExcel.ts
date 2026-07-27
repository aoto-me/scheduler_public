import { format } from 'date-fns';
import { useCallback } from 'react';
import readXlsxFile from 'read-excel-file/browser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// エクセルファイルかどうか（ファイルの拡張子と MIME タイプを検証）
const isValidExcelFile = (file: File): boolean => {
  const allowedExtensions = ['.xlsx'];
  const allowedMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
  return allowedExtensions.includes(fileExtension) && allowedMimeTypes.includes(file.type);
};

const formatCellValue = (value: boolean | Date | null | number | string) => {
  if (value instanceof Date) {
    return format(value, 'yyyy-MM-dd');
  }
  return value;
};

export const useImportExcel = () => {
  const importExcel = useCallback(
    async ({
      file,
      newId,
    }: {
      file: File;
      newId: number;
    }): Promise<
      | undefined
      | {
          columns: null | Record<string, string>;
          endId: null | number;
          rows:
            | null
            | {
                [key: string]: boolean | Date | null | number | string | undefined;
                id: string;
              }[];
        }
    > => {
      if (!isValidExcelFile(file)) {
        throw new Error('アップロードできるのはExcelファイルのみです');
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('ファイルサイズは10MB以下にしてください');
      }

      try {
        const allSheets = await readXlsxFile(file);
        const sheetData = allSheets[0].data;

        // 1行目（ヘッダー）を使ってcolumnsを生成
        const columns: Record<string, string> = {};
        for (const [index, cell] of sheetData[0].entries()) {
          const columnKey = String.fromCodePoint(65 + index); // 'A', 'B', 'C'...
          columns[columnKey] = String(cell ?? '');
        }

        // idが含まれているか、また、半角英数字のみかをチェック
        const hasId = Object.values(columns).includes('id');
        if (hasId) {
          throw new Error('Excelの項目に"id"が含まれています');
        }
        const isAlphaNumeric = Object.values(columns).every(value => /^[a-zA-Z0-9]+$/.test(value));
        if (!isAlphaNumeric) {
          throw new Error('Excelの項目に半角英数字以外の値が含まれています');
        }

        // 2行目以降のデータ行（A列がnullの行はスキップ）
        let addId = newId;
        const rows = sheetData
          .slice(1)
          .filter(row => row[0] !== null)
          .map(row => {
            const rowData: {
              [key: string]: boolean | Date | null | number | string | undefined;
              id: string;
            } = { id: String(addId + 1) };
            for (const [index, cell] of row.entries()) {
              const columnKey = String.fromCodePoint(65 + index);
              rowData[columns[columnKey]] = formatCellValue(cell as boolean | Date | null | number | string);
            }
            addId += 1;
            return rowData;
          });

        return { columns, endId: addId, rows };
      } catch {
        throw new Error('ファイルの読み込みに失敗しました');
      }
    },
    []
  );

  return importExcel;
};
