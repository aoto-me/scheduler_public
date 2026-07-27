<?php

declare(strict_types=1);

/**
 * 指定した条件に一致するレコードを削除する
 *
 * @param \PDO $pdo
 * @param string $table 削除対象のテーブル名
 * @param array $conditions 削除条件（カラム名 => 値）の連想配列
 * @return bool 削除が成功したかどうか（true: 成功, false: 失敗）
 */
function deleteRecord(\PDO $pdo, string $table, array $conditions): bool
{
    if (empty($conditions)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    $whereClauses = [];
    foreach ($conditions as $column => $value) {
        if (!preg_match('/^\w+$/', $column)) {
            return false;
        }
        $whereClauses[] = sprintf("`%s` = :%s", $column, $column);
    }
    $whereSql = implode(' AND ', $whereClauses);

    $sql = sprintf("DELETE FROM `%s` WHERE %s", $table, $whereSql);
    $stmt = $pdo->prepare($sql);

    foreach ($conditions as $column => $value) {
        $stmt->bindValue(":{$column}", $value);
    }

    // 実行結果（true: 成功, false: 失敗）
    return $stmt->execute();
}


/**
 * 指定した条件に一致するレコードを1件削除する
 *
 * @param \PDO $pdo
 * @param string $table 削除対象のテーブル名
 * @param array $conditions 削除条件（カラム名 => 値）の連想配列
 * @return bool|null 成功: true、削除対象なし: null、失敗: false
 */
function deleteSingleRecord(\PDO $pdo, string $table, array $conditions): bool|null
{
    if (empty($conditions)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    $whereClauses = [];
    foreach ($conditions as $column => $value) {
        if (!preg_match('/^\w+$/', $column)) {
            return false;
        }
        $whereClauses[] = sprintf("`%s` = :%s", $column, $column);
    }
    $whereSql = implode(' AND ', $whereClauses);

    $sql = sprintf("DELETE FROM `%s` WHERE %s LIMIT 1", $table, $whereSql);
    $stmt = $pdo->prepare($sql);

    foreach ($conditions as $column => $value) {
        $stmt->bindValue(":{$column}", $value);
    }

    if (!$stmt->execute()) {
        return false; // 実行失敗
    }

    if ($stmt->rowCount() === 0) {
        return null; // 実行成功だが削除対象なし
    }

    return true; // 1件削除成功
}


/**
 * 指定したIDのリストに該当するレコードを一括削除する
 *
 * @param \PDO $pdo
 * @param string $table     削除対象のテーブル名
 * @param array $ids        削除対象のIDリスト（整数または文字列の配列）
 * @param string $idColumn  IDが格納されているカラム名（デフォルト: 'id'）
 * @return bool             削除が成功したかどうか（true: 成功, false: 失敗）
 */
function deleteRecordsByIds(\PDO $pdo, string $table, array $ids, string $idColumn = 'id'): bool
{
    if (empty($ids)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table) || !preg_match('/^\w+$/', $idColumn)) {
        return false;
    }

    $idsPlaceholder = implode(',', array_fill(0, count($ids), '?'));

    $sql = sprintf(
        "DELETE FROM `%s` WHERE `%s` IN (%s)",
        $table,
        $idColumn,
        $idsPlaceholder
    );
    $stmt = $pdo->prepare($sql);

    return $stmt->execute($ids);
}
