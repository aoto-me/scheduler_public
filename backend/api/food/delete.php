<?php

declare(strict_types=1);

/**
 * foodデータを削除
 */
function deleteFoodData(int $userId, int $id): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "food";

        $result = deleteSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId]);
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
