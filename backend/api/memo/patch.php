<?php

declare(strict_types=1);

/**
 * memoデータの更新
 */
function updateMemo(int $userId, int $id, string $target): void
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
        if ($target === 'content' && $encodedText === null) { // 空文字を許容
            $missingFields[] = 'text';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = 'memo';

        $columnMap = [];

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

        if ($target === 'content') {
            $content = base64_decode($encodedContent);
            $text = base64_decode($encodedText);

            if ($content === false) {
                throw new HttpException("{$target}の形式が不正です", 400);
            }

            validateTiptapContent($content, 'content');

            $columnMap[$target] = [
                $target => $content,
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
