<?php

declare(strict_types=1);

/**
 * レコードを挿入する関数（重複キーの場合は更新）
 *
 * @param \PDO $pdo
 * @param string $table   挿入するデータが格納されるテーブル名
 * @param array $data     挿入するデータ（カラム名をキー、カラムの値を値とした連想配列）
 * @return bool          成功した場合は `true`、失敗した場合は `false`
 */
function insertRecord(\PDO $pdo, string $table, array $data): bool
{
    if (empty($data)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    $columns = array_keys($data);
    foreach ($columns as $col) {
        if (!preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    $columnsQuoted = array_map(fn ($col) => "`$col`", $columns);
    $placeholders = array_map(fn ($col) => ":$col", $columns);
    $updateParts = array_map(fn ($col) => "`$col` = VALUES(`$col`)", $columns);

    $sql = sprintf(
        "INSERT INTO `%s` (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s",
        $table,
        implode(", ", $columnsQuoted),
        implode(", ", $placeholders),
        implode(", ", $updateParts)
    );

    try {
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($data);
    } catch (Throwable $e) {
        return false;
    }
}


/**
 * データベースにレコードを挿入し、挿入されたレコードのIDを取得する関数
 *
 * @param \PDO $pdo
 * @param string $table 挿入先のテーブル名
 * @param array $data 挿入するデータ（キーがカラム名、値が挿入する値）
 * @return int|false 挿入したレコードのID（成功時） / false（失敗時）
 */
function insertRecordAndGetId(\PDO $pdo, string $table, array $data): int|false
{
    if (empty($data)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    $columns = array_keys($data);
    foreach ($columns as $col) {
        if (!preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    $columnsQuoted = array_map(fn ($col) => "`$col`", $columns);
    $placeholders = array_map(fn ($col) => ":$col", $columns);

    $sql = sprintf(
        "INSERT INTO `%s` (%s) VALUES (%s)",
        $table,
        implode(", ", $columnsQuoted),
        implode(", ", $placeholders)
    );

    try {
        $stmt = $pdo->prepare($sql);
        if (!$stmt->execute($data)) {
            return false;
        }
        return (int)$pdo->lastInsertId();
    } catch (Throwable $e) {
        return false;
    }
}
