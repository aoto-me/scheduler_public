<?php

declare(strict_types=1);

/**
 * 特定期間のFoodデータを取得
 */
function getFoodDataByPeriod(int $userId): void
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

        $table = "food";

        // 該当期間のデータを取得
        $food = getRecordsByConditionWithDateRange($pdo, $table, $start, $end, "date", ['user' => $userId], ['id', 'date', 'name', 'quantity', 'unit', 'energy', 'protein', 'fat', 'carb', 'salt']);
        if ($food === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        return ['result' => $food];
    });
}

/**
 * foodDB_standardの全件取得
 */
function getFoodDBStandard(): void
{
    handleGetRequest(function (PDO $pdo) {
        $stmt = $pdo->query('SELECT id, name, perItem, energy, protein, fat, carb, salt, aliases FROM foodDB_standard');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = array_map(function (array $row): array {
            return [
                'id'       => (int) $row['id'],
                'name'     => $row['name'],
                'perItem'  => (int) $row['perItem'],
                'energy'   => (float) $row['energy'],
                'protein'  => $row['protein'] !== null ? (float) $row['protein'] : null,
                'fat'      => $row['fat'] !== null ? (float) $row['fat'] : null,
                'carb'     => $row['carb'] !== null ? (float) $row['carb'] : null,
                'salt'     => $row['salt'] !== null ? (float) $row['salt'] : null,
                'keywords' => array_values(array_filter(
                    array_map('trim', explode(',', $row['aliases'] ?? '')),
                    fn (string $k): bool => $k !== ''
                )),
            ];
        }, $rows);

        return ['result' => $result];
    });
}
