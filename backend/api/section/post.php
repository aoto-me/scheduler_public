<?php

declare(strict_types=1);

/**
 * sectionの新規追加
 */
function addSection(int $userId): void
{
    handlePostRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        $name = $inputData['name'] ?? null;
        $sectionId = $inputData['sectionId'] ?? null;
        $projectId = $inputData['projectId'] ?? null;
        $sort = $inputData['sort'] ?? null;

        $missingFields = [];
        if (!$sectionId) {
            $missingFields[] = 'sectionId';
        }
        if (!$projectId) {
            $missingFields[] = 'projectId';
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

        validateMaxLength($sectionId, 100, 'sectionId');
        validateMaxLength($name, 100, 'name');
        if (!is_int($sort) || $sort <= 0) {
            throw new HttpException('sortは正の整数である必要があります', 400);
        }
        validatePositiveInt($projectId, 'projectId');

        $table = "section";

        $insert = [
            'user' => $userId,
            'sectionId' => $sectionId,
            'projectId' => $projectId,
            'name' => $name,
            'sort' => $sort,
        ];

        $result = insertRecordAndGetId($pdo, $table, $insert);
        if ($result === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        return [
            'message' => "新規{$table}を保存しました",
            'result' => $result
            ];
    });
}
