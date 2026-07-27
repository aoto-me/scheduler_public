<?php

declare(strict_types=1);

/**
 * sectionの並び替え
 */
function sortSection(int $userId, int $projectId, string $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $projectId, $target) {
        $inputData = parseJsonInput();
        $ids = $inputData['ids'] ?? null; // DB上のidなので数値

        $missingFields = [];
        if (!is_array($ids) || empty($ids)) {
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

        $table = "section";

        // CASE生成
        $caseSql = "CASE id ";
        $params = [];

        foreach ($ids as $index => $id) {
            $caseSql .= "WHEN ? THEN ? ";
            $params[] = $id;
            $params[] = $index + 1;
        }

        $caseSql .= "ELSE sort END";

        // IN句プレースホルダ
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        // WHERE用パラメータ追加
        $params = array_merge($params, $ids);
        $params[] = $userId;
        $params[] = $projectId;

        $query = "
            UPDATE `$table`
            SET sort = $caseSql
            WHERE id IN ($placeholders)
            AND user = ?
            AND projectId = ?
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);

        return [
            'message' => "{$table}の並び替えを保存しました",
            'result' => 'ok'
        ];
    });
}


/**
 * section名の変更
 */
function renameSection(int $userId, int $id, $target): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $id, $target) {
        $inputData = parseJsonInput();
        $sectionId = $inputData['sectionId'] ?? null;
        $encodeName = $inputData['name'] ?? null;

        $missingFields = [];
        if (!$id) {
            $missingFields[] = 'id';
        }
        if (!$sectionId) {
            $missingFields[] = 'sectionId';
        }
        if (!$encodeName) {
            $missingFields[] = 'name';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $name = base64_decode($encodeName);
        validateMaxLength($name, 100, 'name');

        $table = "section";

        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'sectionId' => $sectionId, 'user' => $userId], ['name' => $name]);
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
