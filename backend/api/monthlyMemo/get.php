<?php

declare(strict_types=1);

/**
 * 該当月のメモを取得
 */
function getMemo(int $userId): void
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

        $table = "monthlyMemo";

        // 該当期間のデータを取得
        $result = getRecordsByConditionWithDateRange($pdo, $table, $start, $end, "date", ['user' => $userId], [
        'id',
        'date',
        'memo',
        ]);
        if ($result === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        // メモがない場合もあるので、responseをnullだけで返すとフロント側でエラーになる
        // データがない場合は id = 0 を返すようにしてフラグにしている
        return ['result' => $result[0] ?? ['id' => 0]];
    });
}
