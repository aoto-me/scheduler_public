<?php

declare(strict_types=1);

/**
 * 特定期間のdiaryの一覧を取得
 */
function getDiaryListByPeriod(int $userId): void
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

        $table = "diaryCard";
        $itemTable = "diaryItem";

        // 該当期間のデータを取得
        $cards = getRecordsByConditionWithDateRange($pdo, $table, $start, $end, "date", ['user' => $userId], [
            'id',
            'title',
            'date',
            'updated',
        ]);
        if ($cards === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        // 各カードのサムネイルの取得
        $cardIds = array_column($cards, 'id');
        $thumb = [];

        if (!empty($cardIds)) {
            // 複数のカードIDに対する最小のsortを持つfileを取得する
            $placeholders = implode(',', array_fill(0, count($cardIds), '?'));

            $query = "
                SELECT cardId, file
                FROM (
                    SELECT cardId, file, sort, ROW_NUMBER() OVER (PARTITION BY cardId ORDER BY sort ASC, id ASC) AS row_num
                    FROM `$itemTable`
                    WHERE cardId IN ({$placeholders}) AND user = ?
                ) AS ranked
                WHERE row_num = 1
            ";

            $stmt = $pdo->prepare($query);
            $executeParams = [...$cardIds, $userId];
            $stmt->execute($executeParams);

            $thumb = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return ['result' => [
                        'card' => $cards,
                        'thumb' => $thumb
                        ]];
    });
}


/**
 * 対象のdiaryを取得
 */
function getDiaryItem(int $userId, int $id, string $target): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $table = "diaryCard";
        $itemTable = "diaryItem";

        $card = getSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId]);
        if ($card === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }
        if ($card === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }
        $content = $card['content'];

        $items = getRecordsByCondition($pdo, $itemTable, ['cardId' => $id, 'user' => $userId], ['id', 'cardId', 'sort', 'file']);
        if ($items === false) {
            throw new HttpException("{$itemTable}：データを取得できませんでした", 500);
        }

        return ['result' => [
                    'content' => $content,
                    'item' => $items
                    ]];

    });
}
