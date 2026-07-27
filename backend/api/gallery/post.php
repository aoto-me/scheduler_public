<?php

declare(strict_types=1);

/**
 * 画像アイテムの新規保存
 */
function addItem(int $userId, int $galleryId, string $target): void
{
    handlePostRequest(function (PDO $pdo) use ($userId, $galleryId, $target) {
        $inputData = parseJsonInput();
        $cardId = $inputData['cardId'] ?? null;
        $files = $inputData['files'] ?? null;
        $sort = $inputData['sort'] ?? null;

        $missingFields = [];
        if (!$files) {
            $missingFields[] = 'files';
        }
        if ($sort === null) {
            $missingFields[] = 'sort';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        if (!is_array($files)) {
            throw new HttpException('filesは配列である必要があります', 400);
        }
        if (!is_int($sort) || $sort < 0) {
            throw new HttpException('sortは0以上の整数である必要があります', 400);
        }
        foreach ($files as $file) {
            if (!is_string($file) || $file === '') {
                throw new HttpException('filesの値が不正です', 400);
            }
            if (str_contains($file, '..') || str_contains($file, '/') || str_contains($file, '\\')) {
                throw new HttpException('filesに不正なファイル名が含まれています', 400);
            }
        }

        $itemTable = 'galleryItem';
        $cardTable = 'galleryCard';

        $ids = [];
        foreach ($files as $index => $file) {
            if (!$file) {
                throw new HttpException("{$itemTable}：データが不正です", 500);
            }

            $insertData = [
                'cardId' => $cardId,
                'file' => $file,
                'sort' => $sort + $index,
                'user' => $userId,
                'galleryId' => $galleryId,
            ];

            // 新規保存
            $newId = insertRecordAndGetId($pdo, $itemTable, $insertData);
            if ($newId === false) {
                throw new HttpException("{$itemTable}：データの挿入に失敗しました", 500);
            }
            $ids[] = $newId;
        }

        // `cardTable` の更新（アイテムを追加したので、updated を現在時刻にする）
        if ($cardId) {
            $stmt = $pdo->prepare("
            UPDATE {$cardTable}
            SET updated = CURRENT_TIMESTAMP
            WHERE id = :id
            AND galleryId = :galleryId
            AND user = :userId
        ");

            $stmt->execute([
                ':id' => $cardId,
                ':galleryId' => $galleryId,
                ':userId' => $userId,
            ]);
        }

        return [
            'message' => "新規{$itemTable}を保存しました",
            'result' => $ids
            ];
    });
}


/**
 * カードの新規保存
 */
function addCard(int $userId, int $galleryId, string $target): void
{
    handlePostRequest(function (PDO $pdo) use ($userId, $galleryId, $target) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $sort = $inputData['sort'] ?? null;
        $title = $inputData['title'] ?? null;

        $missingFields = [];
        if ($sort === null) {
            $missingFields[] = 'sort';
        }
        if (!$title) {
            $missingFields[] = 'title';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($title, 100, 'title');
        if (!is_int($sort) || $sort < 0) {
            throw new HttpException('sortは0以上の整数である必要があります', 400);
        }
        if ($date !== null) {
            validateDate($date, 'date');
        }

        $insertData = [
            'user' => $userId,
            'galleryId' => $galleryId,
            'title' => $title,
            'date' => $date,
            'content' => '{"type":"doc","content":[]}',
            'plainText' => '',
            'sort' => $sort
        ];

        $table = 'galleryCard';

        $newId = insertRecordAndGetId($pdo, $table, $insertData);

        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        $uploadDir = getUploadBaseDir($userId) . "/gallery/{$galleryId}/{$newId}";
        // フォルダが存在しない場合は作成
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                $error = error_get_last();
                throw new HttpException('フォルダの作成に失敗しました: ' . ($error['message'] ?? '不明な理由'), 500);
            }
        }

        return [
            'message' => "新規{$table}を保存しました",
            'result' => $newId
            ];
    });
}
