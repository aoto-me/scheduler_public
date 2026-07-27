<?php

declare(strict_types=1);

/**
 * ROUTE_TYPE($table)に応じたデータを取得
 */
function getSettingByTable(int $userId, string $table): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $table) {

        $tableMap = [
            'healthCategory' => ['table' => 'healthCategory', 'columns' => ['id', 'name', 'icon']],
            'foodDB' => ['table' => 'foodDB', 'columns' => ['id', 'name', 'perItem', 'energy', 'protein', 'fat', 'carb', 'salt']],
            'expenseCategory' => ['table' => 'expenseCategory', 'columns' => ['id', 'name', 'icon']],
            'incomeCategory' => ['table' => 'incomeCategory', 'columns' => ['id', 'name', 'icon']],
            'nutrition' => ['table' => 'nutrition', 'columns' => ['id', 'energy', 'protein', 'fat', 'carb', 'salt']],
            'yearEvent' => ['table' => 'yearEvent', 'columns' => ['id', 'date', 'name']],
            'rssList' => ['table' => 'rss', 'columns' => ['id', 'url', 'siteName']],
        ];

        if (!isset($tableMap[$table])) {
            throw new HttpException("{$table}: 無効なテーブルです", 400);
        }

        $tableInfo = $tableMap[$table];
        $tableName = $tableInfo['table'];
        $columns = $tableInfo['columns'];

        $condition = ['user' => $userId];
        $records = getRecordsByCondition($pdo, $tableName, $condition, $columns);
        if ($records === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        return ['result' => $records];
    });
}
