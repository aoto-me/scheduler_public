<?php

declare(strict_types=1);

/**
 * Todoの更新
 */
function updateTodo(int $userId, int $id): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id) {
        $inputData = parseJsonInput();
        $sort = $inputData['sort'] ?? null; // "maintain" | "save" | "delete"
        $content = $inputData['content'] ?? null;
        $start = $inputData['start'] ?? null;
        $end = $inputData['end'] ?? null; // nullを許容
        $type = $inputData['type'] ?? null;
        $projectId = $inputData['projectId'] ?? null; // nullを許容
        $sectionId = $inputData['sectionId'] ?? null; // nullを許容
        $estimated = $inputData['estimated'] ?? null; // nullを許容
        $completed = $inputData['completed'] ?? null;
        $visible = $inputData['visible'] ?? null;
        $memo = $inputData['memo'] ?? null;
        $taskTime = $inputData['taskTime'] ?? null;

        $missingFields = [];
        if (!$id || $id === 0) {
            $missingFields[] = 'id';
        }
        if (!$content) {
            $missingFields[] = 'content';
        }
        if (!$start) {
            $missingFields[] = 'start';
        }
        $validTypes = ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'];
        if (!$type || !in_array($type, $validTypes, true)) {
            $missingFields[] = 'type';
        }
        if ($completed === null || !in_array($completed, [0, 1], true)) {
            $missingFields[] = 'completed';
        }
        if ($visible === null || !in_array($visible, [0, 1], true)) {
            $missingFields[] = 'visible';
        }
        if ($memo === null) { // 空文字許容
            $missingFields[] = 'memo';
        }
        if ($taskTime === null || !is_array($taskTime)) {
            $missingFields[] = 'taskTime';
        }
        $validSort = ["maintain", "save", "delete"];
        if (!$sort || !in_array($sort, $validSort, true)) {
            $missingFields[] = 'sort';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($content, 100, 'content');
        validateDatetime($start, 'start');
        if ($end !== null) {
            validateDatetime($end, 'end');
        }
        $decodedMemo = base64_decode($memo);
        validateMaxLength($decodedMemo, 500, 'memo');
        if ($projectId !== null) {
            validatePositiveInt($projectId, 'projectId');
        }
        if ($sectionId !== null && !is_string($sectionId)) {
            throw new HttpException('sectionIdの形式が不正です', 400);
        }
        if ($estimated !== null) {
            validateTime($estimated, 'estimated');
        }
        foreach ($taskTime as $time) {
            if (!empty($time['start'])) {
                validateDatetime($time['start'], 'taskTime.start');
            }
            if (!empty($time['end'])) {
                validateDatetime($time['end'], 'taskTime.end');
            }
        }

        $insertData = [
            'user' => $userId,
            'content' => $content,
            'start' => $start,
            'end' => $end,
            'type' => $type,
            'projectId' => $projectId,
            'sectionId' => $sectionId,
            'estimated' => $estimated,
            'completed' => $completed,
            'visible' => $visible,
            'memo' => $decodedMemo,
        ];

        $table = "todo";
        $taskTimeTable = "taskTime";

        // sortの取得
        $count = null;
        if ($sort === "save") {
            $count = countRecords($pdo, $table, ['user' => $userId, 'projectId' => $projectId, 'sectionId' => $sectionId]);
            if ($count === false) {
                throw new HttpException("{$table}：データ数を取得できませんでした", 500);
            }
        }

        $sortVal = null;
        if ($id !== 0 && $sort === "save") {
            $sortVal = ($count !== null) ? $count + 1 : null;
            $insertData['sort'] = $sortVal;
        } elseif ($id !== 0 && $sort === "delete") {
            $insertData['sort'] = null; // sortをnullにセット
        }

        // 既存データの更新処理
        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        // taskTimeの処理
        $taskTimeIds = [];
        foreach ($taskTime as $time) {
            $timeId = $time['id'] ?? null;
            if ($timeId === null) {
                throw new HttpException("{$taskTimeTable}：taskTimeのidが不正です", 500);
            }

            $timeInsertData = [
                'user' => $userId,
                'todoId' => $id,
                'start' => $time['start'],
                'end' => $time['end'],
            ];

            if ($timeId === 0) {
                // 新規保存
                $newTimeId = insertRecordAndGetId($pdo, $taskTimeTable, $timeInsertData);
                if ($newTimeId === false) {
                    throw new HttpException("{$taskTimeTable}：データの挿入に失敗しました", 500);
                }
                $taskTimeIds[] = $newTimeId;
            } else {
                // 更新
                $timeResult = updateSingleRecord($pdo, $taskTimeTable, ['id' => $timeId, 'user' => $userId], $timeInsertData);
                if ($timeResult === false) {
                    throw new HttpException("{$taskTimeTable}：更新に失敗しました", 500);
                }
                if ($timeResult === null) {
                    throw new HttpException("{$taskTimeTable}：対象のレコードがありません", 404);
                }
                $taskTimeIds[] = $timeId;
            }
        }

        return [
        'message' => "{$table}を新規保存しました",
        'result' => [
                'id' => $id,
                'taskTimeIds' => $taskTimeIds,
                'sort' => $sortVal
            ]
        ];
    });
}


/**
 * Todoの新規追加
 */
function insertTodo(int $userId): void
{
    handlePutRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        $sort = $inputData['sort'] ?? null; // "maintain" | "save" | "delete"
        $content = $inputData['content'] ?? null;
        $start = $inputData['start'] ?? null;
        $end = $inputData['end'] ?? null; // nullを許容
        $type = $inputData['type'] ?? null;
        $projectId = $inputData['projectId'] ?? null; // nullを許容
        $sectionId = $inputData['sectionId'] ?? null; // nullを許容
        $estimated = $inputData['estimated'] ?? null; // nullを許容
        $completed = $inputData['completed'] ?? null;
        $visible = $inputData['visible'] ?? null;
        $memo = $inputData['memo'] ?? null;
        $taskTime = $inputData['taskTime'] ?? null;

        $missingFields = [];
        if (!$content) {
            $missingFields[] = 'content';
        }
        if (!$start) {
            $missingFields[] = 'start';
        }
        $validTypes = ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'];
        if (!$type || !in_array($type, $validTypes, true)) {
            $missingFields[] = 'type';
        }
        if ($completed === null || !in_array($completed, [0, 1], true)) {
            $missingFields[] = 'completed';
        }
        if ($visible === null || !in_array($visible, [0, 1], true)) {
            $missingFields[] = 'visible';
        }
        if ($memo === null) { // 空文字許容
            $missingFields[] = 'memo';
        }
        if ($taskTime === null || !is_array($taskTime)) {
            $missingFields[] = 'taskTime';
        }
        $validSort = ["maintain", "save", "delete"];
        if (!$sort || !in_array($sort, $validSort, true)) {
            $missingFields[] = 'sort';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($content, 100, 'content');
        validateDatetime($start, 'start');
        if ($end !== null) {
            validateDatetime($end, 'end');
        }
        $decodedMemo = base64_decode($memo);
        validateMaxLength($decodedMemo, 500, 'memo');
        if ($projectId !== null) {
            validatePositiveInt($projectId, 'projectId');
        }
        if ($sectionId !== null && !is_string($sectionId)) {
            throw new HttpException('sectionIdの形式が不正です', 400);
        }
        if ($estimated !== null) {
            validateTime($estimated, 'estimated');
        }
        foreach ($taskTime as $time) {
            if (!empty($time['start'])) {
                validateDatetime($time['start'], 'taskTime.start');
            }
            if (!empty($time['end'])) {
                validateDatetime($time['end'], 'taskTime.end');
            }
        }

        $insertData = [
            'user' => $userId,
            'content' => $content,
            'start' => $start,
            'end' => $end,
            'type' => $type,
            'projectId' => $projectId,
            'sectionId' => $sectionId,
            'estimated' => $estimated,
            'completed' => $completed,
            'visible' => $visible,
            'memo' => $decodedMemo,
        ];

        $table = "todo";
        $taskTimeTable = "taskTime";

        // sortの取得
        $count = null;
        if ($sort === "save") {
            $count = countRecords($pdo, $table, ['user' => $userId, 'projectId' => $projectId, 'sectionId' => $sectionId]);
            if ($count === false) {
                throw new HttpException("{$table}：データ数を取得できませんでした", 500);
            }
        }

        // 新規保存処理
        $sortVal = ($count !== null) ? $count + 1 : null;
        $newId = insertRecordAndGetId($pdo, $table, [...$insertData, 'sort' => $sortVal]);
        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        // taskTimeの処理
        $taskTimeIds = [];
        foreach ($taskTime as $time) {
            $timeId = $time['id'] ?? null;
            if ($timeId === null) {
                throw new HttpException("{$taskTimeTable}：taskTimeのidが不正です", 500);
            }

            $timeInsertData = [
                'user' => $userId,
                'todoId' => $newId,
                'start' => $time['start'],
                'end' => $time['end'],
            ];

            if ($timeId === 0) {
                // 新規保存
                $newTimeId = insertRecordAndGetId($pdo, $taskTimeTable, $timeInsertData);
                if ($newTimeId === false) {
                    throw new HttpException("{$taskTimeTable}：データの挿入に失敗しました", 500);
                }
                $taskTimeIds[] = $newTimeId;
            } else {
                // 更新
                $timeResult = updateSingleRecord($pdo, $taskTimeTable, ['id' => $timeId, 'user' => $userId], $timeInsertData);
                if ($timeResult === false) {
                    throw new HttpException("{$taskTimeTable}：更新に失敗しました", 500);
                }
                if ($timeResult === null) {
                    throw new HttpException("{$taskTimeTable}：対象のレコードがありません", 404);
                }
                $taskTimeIds[] = $timeId;
            }
        }

        return [
        'message' => "{$table}を新規保存しました",
        'result' => [
                'id' => $newId,
                'taskTimeIds' => $taskTimeIds,
                'sort' => $sortVal
            ]
        ];
    });
}
