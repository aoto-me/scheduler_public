<?php

declare(strict_types=1);

/**
 * healthデータの削除
 */
function deleteHealthData(int $userId, int $id): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "health";
        $itemTable = "healthItem";

        $itemResult = deleteRecord($pdo, $itemTable, ['healthId' => $id, 'user' => $userId]);
        if ($itemResult === false) {
            throw new HttpException("{$itemTable}：削除に失敗しました", 500);
        }

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
