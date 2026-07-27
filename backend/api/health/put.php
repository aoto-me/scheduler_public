<?php

declare(strict_types=1);

/**
 * healthデータの更新
 */
function updateHealthData(int $userId, int $id): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $other = $inputData['other'] ?? null;
        $exercise = $inputData['exercise'] ?? null;
        $mental = $inputData['mental'] ?? null;
        $memo = $inputData['memo'] ?? null;
        $addItems = $inputData['addItems'] ?? null;
        $delItems = $inputData['delItems'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if ($other === null) { // 空文字許容
            $missingFields[] = 'other';
        }
        if ($exercise === null || !in_array($exercise, [0, 1], true)) {
            $missingFields[] = 'exercise';
        }
        if ($mental === null || !in_array($mental, [0, 1, 2, 3, 4, 5], true)) {
            $missingFields[] = 'mental';
        }
        if ($memo === null) { // 空文字許容
            $missingFields[] = 'memo';
        }
        if (!is_array($addItems)) {
            $missingFields[] = 'addItems';
        }
        if (!is_array($delItems)) {
            $missingFields[] = 'delItems';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($other, 50, 'other');
        $decodedMemo = base64_decode($memo);
        validateMaxLength($decodedMemo, 500, 'memo');
        foreach ($addItems as $item) {
            if (!isset($item['id']) || !is_int($item['id']) || $item['id'] < 0) {
                throw new HttpException('addItems[].idの値が不正です', 400);
            }
            if (!isset($item['categoryId']) || !is_int($item['categoryId']) || $item['categoryId'] <= 0) {
                throw new HttpException('addItems[].categoryIdの値が不正です', 400);
            }
        }
        foreach ($delItems as $item) {
            if (!isset($item['id']) || !is_int($item['id']) || $item['id'] <= 0) {
                throw new HttpException('delItems[].idの値が不正です', 400);
            }
        }

        $insertData = [
            'user' => $userId,
            'date' => $date,
            'other' => $other,
            'mental' => $mental,
            'exercise' => $exercise,
            'memo' => $decodedMemo,
        ];

        $table = "health";
        $itemTable = "healthItem";

        // 既存データの更新処理
        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        // $delItemsがあれば、$itemTableから削除
        if (!empty($delItems)) {
            // idだけを抽出し、該当idのデータを削除
            $ids = array_column($delItems, 'id');
            $deleteResult = deleteRecordsByIds($pdo, $itemTable, $ids, 'id');
            if ($deleteResult === false) {
                throw new HttpException("{$itemTable}：アイテムの削除に失敗しました", 500);
            }
        }

        // idを使用して $itemTable に $addItems データを保存
        $healthItem = [];
        foreach ($addItems as $item) {
            // 挿入データの作成
            $insertItemData = [
                'user' => $userId,
                'healthId' => $id,
                'categoryId' => $item['categoryId'],
            ];
            if ($item['id'] === 0) {
                // 新規登録の場合
                $newItemId = insertRecordAndGetId($pdo, $itemTable, $insertItemData);
                if ($newItemId === false) {
                    throw new HttpException("{$table}：データの挿入に失敗しました", 500);
                }
                $healthItem[] = ['id' => $newItemId, 'categoryId' => $item['categoryId'], 'healthId' => $id];
            } else {
                // 既存のデータの更新
                $updateResult = updateSingleRecord(
                    $pdo,
                    $itemTable,
                    ['id' => $item['id'], 'user' => $userId],
                    $insertItemData
                );
                if ($updateResult === false) {
                    throw new HttpException("{$itemTable}：更新に失敗しました", 500);
                }
                if ($updateResult === null) {
                    throw new HttpException("{$itemTable}：対象のレコードがありません", 404);
                }
                $healthItem[] = ['id' => $item['id'], 'categoryId' => $item['categoryId'], 'healthId' => $id];
            }
        }

        return [
            'message' => "{$table}を更新しました",
            'result' => [
                'id' => $id,
                'healthItem' => $healthItem
                ]
        ];
    });
}


/**
 * healthデータの新規保存
 */
function insertHealthData(int $userId): void
{
    handlePutRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $other = $inputData['other'] ?? null;
        $exercise = $inputData['exercise'] ?? null;
        $mental = $inputData['mental'] ?? null;
        $memo = $inputData['memo'] ?? null;
        $addItems = $inputData['addItems'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if ($other === null) { // 空文字許容
            $missingFields[] = 'other';
        }
        if ($exercise === null || !in_array($exercise, [0, 1], true)) {
            $missingFields[] = 'exercise';
        }
        if ($mental === null || !in_array($mental, [0, 1, 2, 3, 4, 5], true)) {
            $missingFields[] = 'mental';
        }
        if ($memo === null) { // 空文字許容
            $missingFields[] = 'memo';
        }
        if (!is_array($addItems)) {
            $missingFields[] = 'addItems';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($other, 50, 'other');
        $decodedMemo = base64_decode($memo);
        validateMaxLength($decodedMemo, 500, 'memo');
        foreach ($addItems as $item) {
            if (!isset($item['id']) || !is_int($item['id']) || $item['id'] < 0) {
                throw new HttpException('addItems[].idの値が不正です', 400);
            }
            if (!isset($item['categoryId']) || !is_int($item['categoryId']) || $item['categoryId'] <= 0) {
                throw new HttpException('addItems[].categoryIdの値が不正です', 400);
            }
        }

        $insertData = [
            'user' => $userId,
            'date' => $date,
            'other' => $other,
            'mental' => $mental,
            'exercise' => $exercise,
            'memo' => $decodedMemo,
        ];

        $table = "health";
        $itemTable = "healthItem";

        // 新規保存の場合、同じ日付のチェック
        $count = countRecords($pdo, $table, ['date' => $date, 'user' => $userId]);
        if ($count === false) {
            throw new HttpException("{$table}：データ数を取得できませんでした", 500);
        }
        if ($count > 0) {
            throw new HttpException("{$date}は既に登録済みです", 409);
        }

        // 新規保存処理
        $newId = insertRecordAndGetId($pdo, $table, $insertData);
        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        // idを使用して $itemTable に $addItems データを保存
        $healthItem = [];
        foreach ($addItems as $item) {
            // 挿入データの作成
            $insertItemData = [
                'user' => $userId,
                'healthId' => $newId,
                'categoryId' => $item['categoryId'],
            ];
            if ($item['id'] === 0) {
                // 新規登録の場合
                $newItemId = insertRecordAndGetId($pdo, $itemTable, $insertItemData);
                if ($newItemId === false) {
                    throw new HttpException("{$table}：データの挿入に失敗しました", 500);
                }
                $healthItem[] = ['id' => $newItemId, 'categoryId' => $item['categoryId'], 'healthId' => $newId];
            } else {
                // 既存のデータの更新
                $updateResult = updateSingleRecord(
                    $pdo,
                    $itemTable,
                    ['id' => $item['id'], 'user' => $userId],
                    $insertItemData
                );
                if ($updateResult === false) {
                    throw new HttpException("{$itemTable}：更新に失敗しました", 500);
                }
                if ($updateResult === null) {
                    throw new HttpException("{$itemTable}：対象のレコードがありません", 404);
                }
                $healthItem[] = ['id' => $item['id'], 'categoryId' => $item['categoryId'], 'healthId' => $newId];
            }
        }

        return [
            'message' => "{$table}を新規保存しました",
            'result' => [
                'id' => $newId,
                'healthItem' => $healthItem
                ]
            ];
    });
}
