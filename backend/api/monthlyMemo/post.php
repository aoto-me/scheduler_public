<?php

declare(strict_types=1);

/**
 * 新規メモの保存
 */
function createMemo(int $userId): void
{
    handlePostRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }
        validateDate($date, 'date');

        $insertData = [
            'user' => $userId,
            'date' => $date,
            'memo' => "",
        ];

        $table = "monthlyMemo";

        // 新規保存処理
        $newId = insertRecordAndGetId($pdo, $table, $insertData);
        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        return [
            'message' => "{$table}を作成しました",
            'result' => $newId
            ];
    });
}
