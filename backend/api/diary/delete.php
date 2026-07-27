<?php

declare(strict_types=1);

/**
 * 画像アイテムの削除処理
 */
function deleteItem(int $userId, int $id, string $target): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $table = 'diaryItem';

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


/**
 * カードの削除処理
 */
function deleteCard(int $userId, int $id, string $target): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id, $target) {

        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;

        $missingFields = [];
        if (!$target) {
            $missingFields[] = 'target';
        }
        if (!$id) {
            $missingFields[] = 'id';
        }
        if (!$date) {
            $missingFields[] = 'date';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');

        $cardTable = 'diaryCard';
        $itemTable = 'diaryItem';

        // 全アイテムの削除
        $itemResult = deleteRecord($pdo, $itemTable, ['cardId' => $id, 'user' => $userId]);
        if ($itemResult === false) {
            throw new HttpException("{$itemTable}：削除に失敗しました", 500);
        }

        // カードの削除
        $cardResult = deleteSingleRecord($pdo, $cardTable, ['id' => $id, 'user' => $userId]);
        if ($cardResult === false) {
            throw new HttpException("{$cardTable}：削除に失敗しました", 500);
        }
        if ($cardResult === null) {
            throw new HttpException("{$cardTable}：対象のレコードがありません", 404);
        }

        // アップロードフォルダの削除
        $dt = new DateTime($date);
        $year = $dt->format('Y');
        $month = $dt->format('m');
        $day = $dt->format('d');
        $path = 'diary' . '/' . $year .'/' . $month .'/' . $day .'/';
        $uploadDir = getUploadDir($userId, $path);
        if (!is_dir($uploadDir)) {
            throw new HttpException("指定されたフォルダが存在しません: {$uploadDir}", 404);
        }
        deleteFolderRecursive($uploadDir);

        return [
            'message' => "{$cardTable}を削除しました",
            'result' => $cardResult ? 'ok' : null
            ];
    });
}
