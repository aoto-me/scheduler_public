<?php

declare(strict_types=1);

/**
 * 1件のmemoを取得
 */
function getMemo(int $userId, int $id): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id) {
        $table = 'memo';

        $result = getSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], ["id", "content", "title"]);
        if ($result === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return ['result' => $result];
    });

}
