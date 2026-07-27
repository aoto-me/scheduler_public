<?php

declare(strict_types=1);

/**
 * テーブルデータの更新
 */
function updateTable(int $userId, int $id, string $page): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $page) {
        $inputData = parseJsonInput();
        $target = $inputData['target'] ?? null; // 更新対象のカラム名
        $width = $inputData['width'] ?? null;
        $height = $inputData['height'] ?? null;
        $columnData = $inputData['columnData'] ?? null;
        $rowData = $inputData['rowData'] ?? null;
        $text = $inputData['text'] ?? null;

        $missingFields = [];
        if (!$target) {
            $missingFields[] = 'target';
        }
        if ($target === 'width' && $width === null) {
            $missingFields[] = 'width';
        }
        if ($target === 'height' && $height === null) {
            $missingFields[] = 'height';
        }
        if ($target === 'columnData' && !$columnData) {
            $missingFields[] = 'columnData';
        }
        if ($target === 'rowData' && !$rowData) {
            $missingFields[] = 'rowData';
        }
        if ($target === 'rowData' && $text === null) { // 空文字許容
            $missingFields[] = 'text';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        if ($target === 'width' && (!is_int($width) || $width < 0)) {
            throw new HttpException('widthは0以上の整数である必要があります', 400);
        }
        if ($target === 'height' && (!is_int($height) || $height < 1)) {
            throw new HttpException('heightは1以上の整数である必要があります', 400);
        }

        $table = "dataTable";

        $columnMap = [
            'width' => [$target => $width],
            'height' => [$target => $height],
            'columnData' => [$target => $columnData],
        ];

        if ($target === 'rowData') {
            $decodedRowData = base64_decode($rowData);
            $decodedText = base64_decode($text);

            if ($decodedRowData === false) {
                throw new HttpException('rowDataの形式が不正です', 400);
            }

            $columnMap['rowData'] = [
                'rowData' => $decodedRowData,
                'plainText' => $decodedText
            ];
        }

        if (!isset($columnMap[$target])) {
            throw new HttpException("{$table}：無効なカラムです", 400);
        }

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId, 'page' => $page], $columnMap[$target]);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を更新しました",
            'result' => 'ok'
        ];
    });
}
