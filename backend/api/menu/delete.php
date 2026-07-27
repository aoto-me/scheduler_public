<?php

declare(strict_types=1);

/**
 * フォルダの削除
 */
function deleteFolder(int $userId, string $table, array $inputData): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $table, $inputData) {
        $folderId = $inputData['folderId'] ?? null; // string型

        $missingFields = [];
        if (!$folderId) {
            $missingFields[] = 'folderId';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $folderTable = "{$table}Folder";

        // $folderTable から該当する id のデータを削除
        $result = deleteSingleRecord($pdo, $folderTable, ['folderId' => $folderId, 'user' => $userId]);
        if ($result === false) {
            throw new HttpException("{$table}：削除に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}フォルダを削除しました",
            'result' => $result ? 'ok' : null
            ];
    });
}


/**
 * アイテムの削除
 */
function deleteItem(int $userId, string $table, array $inputData): void
{
    handleDeleteRequest(function (PDO $pdo) use ($userId, $table, $inputData) {
        $folderId = $inputData['folderId'] ?? null; // string型
        $itemId = $inputData['itemId'] ?? null;

        $missingFields = [];
        if (!$folderId) {
            $missingFields[] = 'folderId';
        }
        if (!$itemId) {
            $missingFields[] = 'itemId';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        // 1. アップロードフォルダの削除
        $path = $table . '/' . $itemId .'/';
        $uploadDir = getUploadDir($userId, $path);
        if (!is_dir($uploadDir)) {
            throw new HttpException("指定されたフォルダが存在しません: {$uploadDir}", 404);
        }
        deleteFolderRecursive($uploadDir);

        // 2. dataTableの削除
        $dataTable = "dataTable";
        $tableResult = deleteRecord($pdo, $dataTable, ['postId' => $itemId, 'page' => $table, 'user' => $userId]);
        if ($tableResult === false) {
            throw new HttpException('テーブルの削除に失敗しました', 500);
        }

        // 3.（プロジェクトの場合）todoとtodoOrderの削除
        $todoIds = []; // 削除・変更を加えたtodoのId
        if ($table === 'project') {
            $todoTable = "todo";

            // 該当のデータを取得
            $todoTarget = getRecordsByCondition($pdo, $todoTable, ['projectId' => $itemId, 'user' => $userId], ['id']);
            if ($todoTarget === false) {
                throw new HttpException("{$todoTable}：データを取得できませんでした", 500);
            }

            // idのみを抽出
            $todoIds = array_column($todoTarget, 'id');

            // todoの更新
            if (count($todoIds) > 0) {
                $todoResult = updateRecordsByCondition($pdo, $todoTable, ['id' => $todoIds], ['projectId' => null, 'sectionId' => null, 'sort' => null]);
                if ($todoResult === false) {
                    throw new HttpException("{$todoTable}：データの更新に失敗しました", 500);
                }
            }
        }

        // 4. フォルダとアイテムの削除
        $itemTable = "{$table}";
        $itemOrderTable = "{$table}Order";
        $deleteSectionIds = [];

        // projectの場合
        if ($table === 'project') {
            $sectionTable = "section";

            // 削除するprojectに該当のデータを取得
            $sectionTarget = getRecordsByCondition($pdo, $sectionTable, ['projectId' => $itemId, 'user' => $userId], ['id', 'sectionId']);
            if ($sectionTarget === false) {
                throw new HttpException("{$sectionTable}：データを取得できませんでした", 500);
            }

            // idのみを抽出
            $sectionIds = array_column($sectionTarget, 'id'); // データベース上のid
            $deleteSectionIds = array_column($sectionTarget, 'sectionId'); // sec_○○形式のID

            // sectionの削除
            if (count($sectionIds) > 0) {
                $sectionResult = deleteRecordsByIds($pdo, $sectionTable, $sectionIds, 'id');
                if ($sectionResult === false) {
                    throw new HttpException("{$sectionTable}：データの削除に失敗しました", 500);
                }
            }
        }

        // galleryの場合（データをReduxに保持してないので、削除したidを返さない）
        if ($table === 'gallery') {
            $galleryItemTable = "galleryItem";
            $galleryCardTable = "galleryCard";

            // galleryItemの削除
            $galleryItemResult = deleteRecord($pdo, $galleryItemTable, ['galleryId' => $itemId, 'user' => $userId]);
            if ($galleryItemResult === false) {
                throw new HttpException("{$galleryItemTable}：データの削除に失敗しました", 500);
            }

            // galleryCardの削除
            $galleryCardResult = deleteRecord($pdo, $galleryCardTable, ['galleryId' => $itemId, 'user' => $userId]);
            if ($galleryCardResult === false) {
                throw new HttpException("{$galleryCardTable}：データの削除に失敗しました", 500);
            }
        }

        // 以下、共通処理
        // $itemOrderTable から該当する itemId のデータを削除
        $itemResult = deleteSingleRecord($pdo, $itemOrderTable, ['itemId' => $itemId, 'user' => $userId, 'folderId' => $folderId]);
        if ($itemResult === false) {
            throw new HttpException("{$table}:Orderの削除に失敗しました", 500);
        }
        if ($itemResult === null) {
            throw new HttpException("{$table}:Orderの対象のレコードがありません", 404);
        }

        // $itemTable から該当する id のデータを削除
        $result = deleteSingleRecord($pdo, $itemTable, ['id' => $itemId, 'user' => $userId]);
        if ($result === false) {
            throw new HttpException("{$table}：削除に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}フォルダを削除しました",
            'result' => [
                'result' => 'ok',
                'todoId' => $todoIds,
                'sectionId' => $deleteSectionIds,
            ]
            ];
    });
}
