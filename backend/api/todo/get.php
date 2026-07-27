<?php

declare(strict_types=1);

/**
 * 特定期間のtodoとtaskTimeを取得
 */
function getTodosByPeriod(int $userId): void
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

        $table = "todo";
        $taskTimeTable = "taskTime";

        // 該当期間のデータを取得
        $result = getRecordsByConditionWithDateRange($pdo, $table, $start, $end, "start", ['user' => $userId], [
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
            'sort',
        ]);
        if ($result === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }

        // idのみを抽出
        $ids = array_column($result, 'id');

        // idに該当するtaskTimeを取得
        $taskTimeResult = getRecordsByIdArray($pdo, $taskTimeTable, 'todoId', $ids);
        if ($taskTimeResult === false) {
            throw new HttpException("{$taskTimeTable}：データを取得できませんでした", 500);
        }

        return ['result' => [
                    'todo' => $result,
                    'taskTime' => $taskTimeResult
        ]];
    });
}
