<?php

declare(strict_types=1);

/**
 * 特定期間のhealthデータとその関連itemを取得
 */
function getHealthDataByPeriod(int $userId): void
{
    handleGetRequest(function (PDO $pdo) use ($userId) {
        $start = $_GET['start'] ?? null;
        $end = $_GET['end'] ?? null;

        $missingFields = [];
        if (!$start) {
            $missingFields[] = 'start';
        }
        if (!$end) {
            $missingFields[] = 'end';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = "health";
        $itemTable = "healthItem";

        // 該当期間のデータを取得
        $health = getRecordsByConditionWithDateRange($pdo, $table, $start, $end, "date", ['user' => $userId], ['id', 'date', 'other', 'mental', 'exercise', 'memo']);
        if ($health === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        // idのみを抽出
        $ids = array_column($health, 'id');
        // idに該当するitemを取得
        $item = getRecordsByIdArray($pdo, $itemTable, 'healthId', $ids);
        if ($item === false) {
            throw new HttpException("{$itemTable}データを取得できませんでした", 500);
        }

        return ['result' => ['health' => $health, 'healthItem' => $item]];
    });
}
