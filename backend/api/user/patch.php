<?php

declare(strict_types=1);

/**
 * プライベートモードの切り替え
 */
function privateModeChange(int $userId): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        if (!isset($inputData['mode']) || !is_numeric($inputData['mode']) || !in_array((int)$inputData['mode'], [0, 1], true)) {
            throw new HttpException('プライベートモード：データが不正です', 400);
        }
        $private = (int)$inputData['mode'];

        $table = "user";

        $result = updateSingleRecord($pdo, $table, ['id' => $userId], ['private' => $private]);
        if ($result === false) {
            throw new HttpException('プライベートモード：更新に失敗しました', 500);
        }
        if ($result === null) {
            throw new HttpException('プライベートモード：対象レコードがありません', 404);
        }

        return [
            'message' => 'プライベートモードを更新しました',
            'result' => $private,
        ];
    });
}
