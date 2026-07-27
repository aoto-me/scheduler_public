<?php

declare(strict_types=1);

/**
 * Todoの削除
 */
function deleteTodo(int $userId, int $id): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "todo";
        $taskTimeTable = "taskTime";

        // taskTimeTableのtodoIdに一致するものがあれば、削除する前にIDを取得
        $deletedTaskTimeIds = [];
        $taskTimeData = getRecordsByCondition($pdo, $taskTimeTable, ['todoId' => $id, 'user' => $userId], ['id']);
        if ($taskTimeData === false) {
            throw new HttpException("{$taskTimeTable}：データを取得できませんでした", 500);
        }
        $deletedTaskTimeIds = array_column($taskTimeData, 'id');

        // taskTimeTableから取得したidのレコードを削除
        if (count($deletedTaskTimeIds) > 0) {
            $deleteTaskTime = deleteRecordsByIds($pdo, $taskTimeTable, $deletedTaskTimeIds);
            if ($deleteTaskTime === false) {
                throw new HttpException("{$taskTimeTable}：削除に失敗しました", 500);
            }
        }

        // todoの削除
        $result = deleteSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId]);
        if ($result === false) {
            throw new HttpException("{$table}：削除に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を削除しました",
            'result' => $deletedTaskTimeIds,
            ];
    });
}

/**
 * TaskTimeデータの削除
 */
function deleteTaskTime(int $userId, int $id, string $target): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $table = "taskTime";

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
