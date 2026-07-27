<?php

declare(strict_types=1);

/**
 * Todoの並び替え
 */
function sortTodo(int $userId, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $target) {
        $inputData = parseJsonInput();
        $ids = $inputData['ids'] ?? null;
        $sectionId = $inputData['sectionId'] ?? null;
        $itemId = $inputData['itemId'] ?? null;

        if (!is_array($ids) || empty($ids)) {
            throw new HttpException('idsが不足しています', 400);
        }

        foreach ($ids as $todoId) {
            if (!is_int($todoId)) {
                throw new HttpException('idsの形式が不正です', 400);
            }
        }

        $sectionId = $sectionId !== 'sec_0' ? $sectionId : null;

        $table = "todo";

        // CASE生成
        $caseSql = "CASE id ";
        $params = [];

        foreach ($ids as $index => $todoId) {
            $caseSql .= "WHEN ? THEN ? ";
            $params[] = $todoId;
            $params[] = $index + 1;
        }

        $caseSql .= "ELSE sort END";

        // IN句
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        // SET句
        if ($itemId !== null) {
            // セクションをまたぐ移動
            $setSql = "sort = $caseSql, sectionId = ?";
            $params[] = $sectionId;
        } else {
            // 同一セクション内並び替え
            $setSql = "sort = $caseSql";
        }

        // WHERE句
        $params = array_merge($params, $ids);
        $params[] = $userId;

        $whereSql = "WHERE id IN ($placeholders) AND user = ?";

        if ($itemId === null) {
            // NULL比較対応（<=> を使用）
            $whereSql .= " AND sectionId <=> ?";
            $params[] = $sectionId;
        }

        $query = "
            UPDATE `$table`
            SET $setSql
            $whereSql
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);

        return [
            'message' => $itemId ? "{$table}セクション間のアイテムの並び替えを保存しました" : "{$table}アイテムの並び替えを保存しました",
            'result' => 'ok'
        ];
    });
}


/**
 * completedの切り替え
 */
function toggleCompleted(int $userId, int $id, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        $completed = $inputData['completed'] ?? null;

        $missingFields = [];
        if ($completed === null || !in_array($completed, [0, 1], true)) {
            $missingFields[] = 'completed';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = "todo";

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], ['completed' => $completed]);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を更新しました",
            'result' => 'ok'
        ];
    });
}


/**
 * カレンダー上でドラックアンドドロップでのStartとEndの更新
 */
function updateStartAndEnd(int $userId, int $id, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        $start = $inputData['start'] ?? null;
        $end = $inputData['end'] ?? null; // nullを許容

        $missingFields = [];
        if ($id === null || $id === 0) {
            $missingFields[] = 'id';
        }
        if (!$start) {
            $missingFields[] = 'start';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDatetime($start, 'start');
        if ($end !== null) {
            validateDatetime($end, 'end');
        }

        $table = "todo";

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], ['start' => $start, 'end' => $end]);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を更新しました",
            'result' => 'ok'
        ];
    });
}
