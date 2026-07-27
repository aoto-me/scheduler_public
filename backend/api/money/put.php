<?php

declare(strict_types=1);

/**
 * Moneyデータの新規保存・更新
 */
function updateMoneyData(int $userId, int $id): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $type = $inputData['type'] ?? null;
        $category = $inputData['category'] ?? null;
        $amount = $inputData['amount'] ?? null;
        $content = $inputData['content'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if ($type === null || !in_array($type, ['収入', '支出'], true)) {
            $missingFields[] = 'type';
        }
        if ($category === null || $category === 0) {
            $missingFields[] = 'category';
        }
        if ($amount === null || $amount < 0) {
            $missingFields[] = 'amount';
        }
        if (!$content) {
            $missingFields[] = 'content';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($content, 100, 'content');
        validateNonNegativeNumber($amount, 'amount');
        validatePositiveInt($category, 'category');

        $insertData = [
            'user' => $userId,
            'date' => $date,
            'type' => $type,
            'category' => $category,
            'amount' => $amount,
            'content' => $content,
        ];

        $table = 'money';

        // 更新処理
        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を更新しました",
            'result' => $id
            ];
    });
}


/**
 * Moneyデータの新規保存
 */
function insertMoneyData(int $userId): void
{
    handlePutRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $type = $inputData['type'] ?? null;
        $category = $inputData['category'] ?? null;
        $amount = $inputData['amount'] ?? null;
        $content = $inputData['content'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if ($type === null || !in_array($type, ['収入', '支出'], true)) {
            $missingFields[] = 'type';
        }
        if ($category === null || $category === 0) {
            $missingFields[] = 'category';
        }
        if ($amount === null || $amount < 0) {
            $missingFields[] = 'amount';
        }
        if (!$content) {
            $missingFields[] = 'content';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($content, 100, 'content');
        validateNonNegativeNumber($amount, 'amount');
        validatePositiveInt($category, 'category');

        $insertData = [
            'user' => $userId,
            'date' => $date,
            'type' => $type,
            'category' => $category,
            'amount' => $amount,
            'content' => $content,
        ];

        $table = 'money';

        // 新規保存処理
        $newId = insertRecordAndGetId($pdo, $table, $insertData);
        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        return [
            'message' => "{$table}を新規保存しました",
            'result' => $newId
            ];
    });
}
