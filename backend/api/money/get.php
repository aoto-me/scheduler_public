<?php

declare(strict_types=1);

/**
 * 特定期間のMoneyデータを取得
 */
function getMoneyDataByPeriod(int $userId): void
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

        $table = "money";

        // 該当期間のデータを取得
        $result = getRecordsByConditionWithDateRange($pdo, $table, $start, $end, "date", ['user' => $userId], ['id', 'date', 'type', 'category', 'amount', 'content']);
        if ($result === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        return ['result' => $result];
    });
}
