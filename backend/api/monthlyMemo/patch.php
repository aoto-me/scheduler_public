<?php

declare(strict_types=1);

/**
 * メモの更新
 */
function uploadMemo(int $userId, int $id): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id) {
        $inputData = parseJsonInput();
        $encodedMemo = $inputData['memo'] ?? null;

        $missingFields = [];
        if (!$id) {
            $missingFields[] = 'id';
        }
        if ($encodedMemo === null) { // 空文字許容
            $missingFields[] = 'memo';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = "monthlyMemo";

        $memo = base64_decode($encodedMemo);

        if ($memo === false) {
            throw new HttpException("メモの形式が不正です", 400);
        }

        validateMaxLength($memo, 5000, 'memo');

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], ['memo' => $memo]);
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
