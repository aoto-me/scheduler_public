<?php

declare(strict_types=1);

/**
 * メニューの表示必要なデータを取得
 */
function getMenu(int $userId, string $type): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $type) {
        $itemTable = "{$type}";
        $itemOrderTable = "{$type}Order";
        $folderTable = "{$type}Folder";

        $condition = ['user' => $userId];

        // $itemTable から user に該当する idとtitle のみを取得
        $itemTableData = getRecordsByCondition($pdo, $itemTable, $condition, ['id', 'title']);
        if ($itemTableData === false) {
            throw new HttpException("{$itemTable}：データを取得できませんでした", 500);
        }

        // $itemOrderTable から user に該当する全てのデータを取得
        $itemOrderTableData = getRecordsByCondition($pdo, $itemOrderTable, $condition, ['id', 'itemId', 'folderId', 'sort']);
        if ($itemOrderTableData === false) {
            throw new HttpException("{$itemOrderTable}：データを取得できませんでした", 500);
        }

        // $folderTable から全てのデータを取得
        $folderTableData = getRecordsByCondition($pdo, $folderTable, $condition, [
            'id',
            'folderId',
            'name',
            'sort',
            'parentFolderId',
        ]);
        if ($folderTableData === false) {
            throw new HttpException("{$folderTable}：データを取得できませんでした", 500);
        }

        return ['result' => [
            'items' => $itemTableData,
            'itemOrder' => $itemOrderTableData,
            'folders' => $folderTableData,
        ]];
    });
}
