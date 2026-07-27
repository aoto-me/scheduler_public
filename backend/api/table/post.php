<?php

declare(strict_types=1);

/**
 * テーブルの新規追加
 */
function addTable(int $userId, int $postId, string $page): void
{
    handlePostRequest(function (PDO $pdo) use ($userId, $postId, $page) {
        $missingFields = [];
        if (!in_array($page, ['memo', 'project'])) {
            $missingFields[] = 'page';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $insertData = [
            'page' => $page,
            'postId' => $postId,
            'user' => $userId,
            'columnData' => "[]",
            'rowData' => "[]",
            'plainText' => "",
            'width' => 0,
            'height' => 1,
        ];

        $table = "dataTable";

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
