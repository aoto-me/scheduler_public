<?php

declare(strict_types=1);

/**
 * 1件のデータを削除
 */
function deleteSetting(int $userId, int $id, string $table): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id, $table) {
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
 * 使用中かチェックした後に、1件のデータを削除
 */
function deleteSettingIfUnused(int $userId, int $id, string $table): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $id, $table) {
        $itemTable = $table === 'healthCategory' ? 'health' : 'money';

        if (in_array($table, ['incomeCategory', 'expenseCategory'], true)) {
            $type = $table === 'incomeCategory' ? '収入' : '支出';
            // $itemTable から、 type が $type で category が $id と一致するデータを取得
            $count = countRecords($pdo, $itemTable, ['type' => $type, 'category' => $id, 'user' => $userId]);
        }

        if ($table === 'healthCategory') {
            // $id のデータが $itemTable の categoryId に存在するか確認
            $count = countRecords($pdo, 'healthItem', ['categoryId' => $id, 'user' => $userId]);
        }

        if ($count === false) {
            throw new HttpException("{$itemTable}：データ数を取得できませんでした", 500);
        }

        // 存在する場合は「削除できませんでした」のメッセージを返す
        if ($count > 0) {
            throw new HttpException("このカテゴリーは使用中のため、削除できませんでした", 409);
        }

        // 存在しない場合は削除処理を実行
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
