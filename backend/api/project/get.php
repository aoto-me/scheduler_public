<?php

declare(strict_types=1);

/**
 * 1件のprojectを取得
 */
function getProject(int $userId, int $id): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id) {
        $table = 'project';

        $result = getSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], ["id", "content", "title", "end"]);
        if ($result === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return ['result' => $result];
    });
}


/**
 * projectIdに関連するtodoとtaskTimeを取得
 */
function getTodosByProject(int $userId, int $projectId, string $table): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $projectId, $table) {
        $taskTimeTable = "taskTime";

        // 該当のデータを取得
        $todos = getRecordsByCondition($pdo, $table, ['user' => $userId, 'projectId' => $projectId], [
            'id',
            'content',
            'start',
            'end',
            'type',
            'projectId',
            'sectionId',
            'estimated',
            'completed',
            'visible',
            'memo',
            'sort'
        ]);
        if ($todos === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }

        // idのみを抽出
        $ids = array_column($todos, 'id');

        // idに該当するtaskTimeを取得
        $taskTimes = getRecordsByIdArray($pdo, $taskTimeTable, 'todoId', $ids);
        if ($taskTimes === false) {
            throw new HttpException("{$taskTimeTable}：データを取得できませんでした", 500);
        }

        return ['result' => [
                    'todo' => $todos,
                    'taskTime' => $taskTimes
                ]];
    });
}
