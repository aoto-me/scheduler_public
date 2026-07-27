<?php

declare(strict_types=1);

/**
 * gallery の Type・Title の保存
 */
function updateGallery(int $userId, int $id, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        // title
        $encodedTitle = $inputData['title'] ?? null;
        // type
        $type = $inputData['type'] ?? null;

        $missingFields = [];
        if (!$target) {
            $missingFields[] = 'target';
        }
        if ($target === 'title' && !$encodedTitle) {
            $missingFields[] = 'title';
        }
        if ($target === 'type' && !$type) {
            $missingFields[] = 'type';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = 'gallery';

        $validTypes = ['card', 'img', 'unselect'];
        if ($target === 'type' && !in_array($type, $validTypes, true)) {
            throw new HttpException('typeの値が不正です', 400);
        }

        $columnMap = [
            'type' => ['type' => $type]
        ];

        if ($target === 'title') {
            $title = base64_decode($encodedTitle);

            if ($title === false) {
                throw new HttpException("{$target}の形式が不正です", 400);
            }

            validateMaxLength($title, 100, 'title');

            $columnMap[$target] = [
                $target => $title,
            ];
        }

        if (!isset($columnMap[$target])) {
            throw new HttpException("{$table}：無効なカラムです", 400);
        }

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $columnMap[$target]);
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
 * card の更新
 */
function updateCard(int $userId, int $id, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        // cardTitle
        $encodedTitle = $inputData['title'] ?? null;
        // cardDate
        $date = $inputData['date'] ?? null; // nullを許容
        // cardContent
        $encodedContent = $inputData['content'] ?? null;
        $encodedText = $inputData['text'] ?? null;

        $missingFields = [];
        if (!$target) {
            $missingFields[] = 'target';
        }
        if ($target === 'cardTitle' && !$encodedTitle) {
            $missingFields[] = 'title';
        }
        if ($target === 'cardContent' && !$encodedContent) {
            $missingFields[] = 'content';
        }
        if ($target === 'cardContent' && $encodedText === null) { // 空文字を許容
            $missingFields[] = 'text';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = 'galleryCard';

        $columnMap = [
            'cardDate' => ['date' => $date]
        ];

        if ($target === 'cardTitle') {
            $title = base64_decode($encodedTitle);

            if ($title === false) {
                throw new HttpException("{$target}の形式が不正です", 400);
            }

            validateMaxLength($title, 100, 'title');

            $columnMap[$target] = [
                'title' => $title,
            ];
        }

        if ($target === 'cardContent') {
            $content = base64_decode($encodedContent);
            $text = base64_decode($encodedText);

            if ($content === false) {
                throw new HttpException("{$target}の形式が不正です", 400);
            }

            validateTiptapContent($content, 'content');

            $columnMap[$target] = [
                'content' => $content,
                'plainText' => $text
            ];
        }

        if (!isset($columnMap[$target])) {
            throw new HttpException("{$table}：無効なカラムです", 400);
        }

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $columnMap[$target]);
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
 * 並び替え（Item / Card 共通）
 */
function updateSort(int $userId, int $galleryId, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $galleryId, $target) {
        $inputData = parseJsonInput();
        $ids = $inputData['ids'] ?? null;

        $missingFields = [];
        if (!$galleryId) {
            $missingFields[] = 'galleryId';
        }
        if (!$ids || empty($ids)) {
            $missingFields[] = 'ids';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        foreach ($ids as $id) {
            if (!is_int($id)) {
                throw new HttpException('idsの形式が不正です', 400);
            }
        }

        $tableMap = [
            'sortItem' => 'galleryItem',
            'sortCard' => 'galleryCard',
        ];

        if (!isset($tableMap[$target])) {
            throw new HttpException('不正なターゲットです', 400);
        }

        $table = $tableMap[$target];

        // CASE生成
        $caseSql = "CASE id ";
        $params = [];

        foreach ($ids as $index => $id) {
            $caseSql .= "WHEN ? THEN ? ";
            $params[] = $id;
            $params[] = $index + 1;
        }

        $caseSql .= "END";

        // IN句
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $params = array_merge($params, $ids, [$userId, $galleryId]);

        $query = "
            UPDATE `$table`
            SET sort = $caseSql
            WHERE id IN ($placeholders)
            AND user = ?
            AND galleryId = ?
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);

        return [
            'message' => "{$table}を更新しました",
            'result'  => 'ok'
        ];
    });
}


/**
 * ファイル名の変更に伴うDB上のファイル名の更新
 */
function renameFile(int $userId, int $id, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        $file = $inputData['file'] ?? null;

        $missingFields = [];
        if (!$target) {
            $missingFields[] = 'target';
        }
        if (!$file) {
            $missingFields[] = 'file';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        if (strpos($file, '/') !== false || strpos($file, '\\') !== false || strpos($file, '..') !== false) {
            throw new HttpException('fileの形式が不正です', 400);
        }

        $table = 'galleryItem';

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], ['file' => $file]);
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
