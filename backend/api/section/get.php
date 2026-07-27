<?php

declare(strict_types=1);

/**
 * 全てのsectionを取得
 */
function getSection(int $userId): void
{
    handleGetRequest(function (PDO $pdo) use ($userId) {
        $table = 'section';

        $result = getRecordsByCondition($pdo, $table, ['user' => $userId], ['id', 'sectionId', 'projectId', 'name', 'sort']);
        if ($result === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        return ['result' => $result];
    });
}
