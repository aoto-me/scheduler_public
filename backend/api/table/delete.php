<?php

declare(strict_types=1);

/**
 * テーブルの削除
 */
function deleteTable(int $userId, int $id, string $page): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id, $page) {
        $table = "dataTable";

        $result = deleteSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId, 'page' => $page]);
        if ($result === false) {
            throw new HttpException("{$table}：削除に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を削除しました",
            'result' => $result ? 'ok' : null
            ];
    });
}
