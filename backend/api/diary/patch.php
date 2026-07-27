<?php

declare(strict_types=1);

/**
 * Itemの並び替え
 */
function updateSort(int $userId, int $cardId, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $cardId, $target) {
        $inputData = parseJsonInput();
        $ids = $inputData['ids'] ?? null;

        $missingFields = [];
        if (!$cardId) {
            $missingFields[] = 'cardId';
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

        $table = 'diaryItem';

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
        $params = array_merge($params, $ids, [$userId, $cardId]);

        $query = "
            UPDATE `$table`
            SET sort = $caseSql
            WHERE id IN ($placeholders)
            AND user = ?
            AND cardId = ?
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

        $table = 'diaryItem';

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


/**
 * カード内のコンテンツの更新
 */
function uploadDiaryCard(int $userId, int $id, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        // title
        $encodedTitle = $inputData['title'] ?? null;
        // content
        $encodedContent = $inputData['content'] ?? null;
        $encodedText = $inputData['text'] ?? null;

        $missingFields = [];
        if (!$target) {
            $missingFields[] = 'target';
        }
        if ($target === 'title' && !$encodedTitle) {
            $missingFields[] = 'title';
        }
        if ($target === 'content' && !$encodedContent) {
            $missingFields[] = 'content';
        }
        if ($target === 'content' && $encodedText === null) { // 空文字許容
            $missingFields[] = 'text';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = 'diaryCard';

        $columnMap = [];

        if ($target === 'title') {
            $title = base64_decode($encodedTitle);

            if ($title === false) {
                throw new HttpException("{$target}の形式が不正です", 400);
            }

            validateMaxLength($title, 100, 'title');

            $columnMap[$target] = [
                'title' => $title,
            ];
        }

        if ($target === 'content') {
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
