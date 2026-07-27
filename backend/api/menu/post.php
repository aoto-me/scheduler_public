<?php

declare(strict_types=1);

/**
 * フォルダーの新規追加
 */
function addFolder(int $userId, string $table, array $inputData): void
{
    handlePostRequest(function (PDO $pdo) use ($userId, $table, $inputData) {
        $folderId = $inputData['folderId'] ?? null;
        $name = $inputData['name'] ?? null;
        $sort = $inputData['sort'] ?? null;
        $parentFolderId = $inputData['parentFolderId'] ?? null;

        $missingFields = [];
        if (!$folderId) {
            $missingFields[] = 'folderId';
        }
        if (!$name) {
            $missingFields[] = 'name';
        }
        if ($sort === null) {
            $missingFields[] = 'sort';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($folderId, 100, 'folderId');
        validateMaxLength($name, 100, 'name');
        if ($parentFolderId !== null) {
            validateMaxLength($parentFolderId, 100, 'parentFolderId');
        }

        $folderTable = "{$table}Folder";

        // $folderTable の更新または挿入処理
        $result = insertRecord($pdo, $folderTable, [
            'user' => $userId,
            'folderId' => $folderId,
            'name' => $name,
            'sort' => $sort,
            'parentFolderId' => $parentFolderId,
        ]);
        if ($result === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        // トップレベルフォルダの場合のみ noCategory の sort を更新
        if ($parentFolderId === null) {
            $conditions = ['folderId' => 'noCategory', 'user' => $userId];
            $noCategoryResult = updateSingleRecord($pdo, $folderTable, $conditions, ['sort' => $sort + 1]);
            if ($noCategoryResult === false) {
                throw new HttpException("{$table}：更新に失敗しました", 500);
            }
            if ($noCategoryResult === null) {
                throw new HttpException("{$table}：対象のレコードがありません", 404);
            }
        }

        return [
            'message' => "{$table}新規フォルダを保存しました",
            'result' => 'ok'
            ];
    });
}


/**
 * アイテムの新規追加
 */
function addItem(int $userId, string $table, array $inputData): void
{
    handlePostRequest(function (PDO $pdo) use ($userId, $table, $inputData) {
        $title = $inputData['title'] ?? null;
        $sort = $inputData['sort'] ?? null;

        $missingFields = [];
        if (!$title) {
            $missingFields[] = 'title';
        }
        if ($sort === null) {
            $missingFields[] = 'sort';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($title, 100, 'title');

        $itemTable = "{$table}";
        $itemOrderTable = "{$table}Order";

        switch ($table) {
            case 'memo':
                $newId = insertRecordAndGetId($pdo, $itemTable, [
                    'user' => $userId,
                    'title' => $title,
                    'content' => '{"type":"doc","content":[]}',
                    'plainText' => '',
                ]);
                break;
            case 'project':
                $newId = insertRecordAndGetId($pdo, $itemTable, [
                    'user' => $userId,
                    'title' => $title,
                    'end' => null,
                    'content' => '{"type":"doc","content":[]}',
                    'plainText' => '',
                ]);
                break;
            case 'gallery':
                $newId = insertRecordAndGetId($pdo, $itemTable, [
                    'user' => $userId,
                    'title' => $title,
                    'type' => "unselect",
                ]);
                break;
            default:
                throw new HttpException("不正なtableです", 400);
        }

        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        // itemOrder テーブルにデータを保存
        $result = insertRecord($pdo, $itemOrderTable, [
            'user' => $userId,
            'itemId' => $newId,
            'folderId' => 'noCategory',
            'sort' => $sort,
        ]);

        if ($result === false) {
            throw new HttpException("{$table}：Orderデータの挿入に失敗しました", 500);
        }

        // 新しく作るアップロードディレクトリのパス
        $uploadDir = getUploadBaseDir($userId) . "/{$table}/{$newId}";
        // フォルダが存在しない場合は作成
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                $error = error_get_last();
                throw new HttpException('フォルダの作成に失敗しました: ' . ($error['message'] ?? '不明な理由'), 500);
            }
        }

        return [
            'message' => "{$table}新規アイテムを保存しました",
            'result' => $newId
            ];

    });
}
