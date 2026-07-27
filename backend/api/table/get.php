<?php

declare(strict_types=1);

/**
 * 条件に該当するtableを取得
 */
function getTable(int $userId, int $id, string $page): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id, $page) {
        $missingFields = [];
        if (!in_array($page, ['memo', 'project'])) {
            $missingFields[] = 'page';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $table = "dataTable";

        $result = getSingleRecord($pdo, $table, ['user' => $userId, 'page' => $page, 'postId' => $id]);
        if ($result === false) {
            throw new HttpException("{$table}データを取得できませんでした", 500);
        }

        // データがない場合に、responseをnullだけで返すとフロント側でエラー処理になるため、
        // データがない場合は id = 0 を返すようにしてフラグにしている
        return ['result' => $result ? $result : ['id' => 0]];
    });
}
