<?php

declare(strict_types=1);

/**
 * 条件に一致するレコードを1件取得する（成功: レコード, 見つからない: null, 失敗: false）
 *
 * @param PDO    $pdo
 * @param string $table      テーブル名
 * @param array  $conditions 検索条件（カラム名 => 値）
 * @param array  $columns    取得するカラム（省略時は `*`）
 * @return array|null|false  レコード: 配列, 該当なし: null, 失敗: false
 */
function getSingleRecord(\PDO $pdo, string $table, array $conditions, array $columns = ['*']): array|null|false
{
    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    if (empty($conditions)) {
        return false;
    }

    foreach ($columns as $col) {
        if ($col !== '*' && !preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    foreach (array_keys($conditions) as $col) {
        if (!preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    $columnsList = implode(', ', array_map(fn ($col) => $col === '*' ? '*' : "`$col`", $columns));

    $whereParts = array_map(fn ($col) => "`$col` = :$col", array_keys($conditions));

    $sql = sprintf(
        "SELECT %s FROM `%s` WHERE %s LIMIT 1",
        $columnsList,
        $table,
        implode(" AND ", $whereParts)
    );

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($conditions);

        $record = $stmt->fetch();

        return $record === false ? null : $record;
    } catch (Throwable $e) {
        return false;
    }
}


/**
 * 指定した条件に一致するレコードを取得する（取得カラムを指定可能）
 *
 * @param PDO    $pdo
 * @param string $table      取得対象のテーブル名
 * @param array  $conditions 検索条件（カラム名をキー、検索する値を値とした連想配列）
 * @param array  $columns    取得したいカラムのリスト（省略時は `*`）
 * @return array|false       一致したデータの配列（空配列含む）、失敗時は false
 */
function getRecordsByCondition(\PDO $pdo, string $table, array $conditions, array $columns = ['*']): array|false
{
    if (empty($conditions)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    foreach ($columns as $col) {
        if ($col !== '*' && !preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    foreach (array_keys($conditions) as $col) {
        if (!preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    try {
        $columnsList = implode(', ', array_map(fn ($col) => $col === '*' ? '*' : "`$col`", $columns));
        $whereParts = array_map(fn ($col) => "`$col` = :$col", array_keys($conditions));

        $sql = sprintf(
            "SELECT %s FROM `%s` WHERE %s",
            $columnsList,
            $table,
            implode(" AND ", $whereParts)
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute($conditions);

        // 成功：結果を配列で返す（0件なら空配列）
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        // 失敗時：falseを返す
        return false;
    }
}


/**
 * 指定した日付範囲＋条件に一致するレコードを取得する
 *
 * @param PDO $pdo
 * @param string $table 対象テーブル名
 * @param string $start 開始日（例: '2025-04-01'）
 * @param string $end 終了日（例: '2025-04-30'）
 * @param string $dateColumn 範囲を指定するカラム名（例: 'created_at'）
 * @param array $conditions 任意の追加条件（カラム => 値 の連想配列）
 * @param array $columns 取得カラム（省略時は *）
 * @return array|false 取得結果の配列（0件なら空配列）、失敗時は false
 */
function getRecordsByConditionWithDateRange(
    \PDO $pdo,
    string $table,
    string $start,
    string $end,
    string $dateColumn = 'date',
    array $conditions = [],
    array $columns = ['*']
): array|false {
    if (empty($start) || empty($end)) {
        return false;
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$/', $start)) {
        return false;
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$/', $end)) {
        return false;
    }

    // endが日付だけなら、その日の終端を設定
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {
        $end .= ' 23:59:59';
    }

    // startについても安全策として00:00:00を補う
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start)) {
        $start .= ' 00:00:00';
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $dateColumn)) {
        return false;
    }

    foreach ($columns as $col) {
        if ($col !== '*' && !preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    foreach (array_keys($conditions) as $col) {
        if (!preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    try {
        $columnsList = implode(', ', array_map(fn ($col) => $col === '*' ? '*' : "`$col`", $columns));
        $whereParts = ["`$dateColumn` BETWEEN :start AND :end"];
        $params = ['start' => $start, 'end' => $end];

        foreach ($conditions as $column => $value) {
            $whereParts[] = "`$column` = :$column";
            $params[$column] = $value;
        }

        $sql = sprintf(
            "SELECT %s FROM `%s` WHERE %s",
            $columnsList,
            $table,
            implode(" AND ", $whereParts)
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        return false;
    }
}


/**
 * 指定したテーブルから、指定カラムが配列内の値と一致する行をすべて取得する。
 *
 * @param PDO $pdo データベース接続用のPDOインスタンス
 * @param string $table データを取得するテーブル名
 * @param string $columnName 条件に使用するカラム名（例：userId, productIdなど）
 * @param array $idArray 絞り込みに使うIDの配列
 * @param array $selectColumns 取得したいカラム名の配列（指定しない場合は * を使う）
 * @return array|false 一致したレコードの配列（連想配列）またはエラー時に false
 */
function getRecordsByIdArray(PDO $pdo, string $table, string $columnName, array $idArray, array $selectColumns = ['*']): array|false
{
    if (empty($idArray)) {
        return [];
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $columnName)) {
        return false;
    }

    foreach ($selectColumns as $col) {
        if ($col !== '*' && !preg_match('/^\w+$/', $col)) {
            return false;
        }
    }

    try {
        $columns = implode(', ', array_map(fn ($col) => $col === '*' ? '*' : "`$col`", $selectColumns));

        $placeholders = implode(', ', array_fill(0, count($idArray), '?'));

        $sql = "SELECT {$columns} FROM `{$table}` WHERE `{$columnName}` IN ({$placeholders})";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($idArray);

        // 結果を連想配列で返す
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result;
    } catch (Throwable $e) {
        return false;
    }
}


/**
 * 指定されたテーブル内で、特定の条件に一致するレコードの数を取得する。
 *
 * @param \PDO      $pdo        データベース接続用のPDOインスタンス
 * @param string    $table      対象のテーブル名
 * @param array     $conditions 検索条件（カラム名 => 値 の連想配列）
 * @return int|false 条件に一致するレコードの数 または エラー時に false
 */
function countRecords(\PDO $pdo, string $table, array $conditions = []): int|false
{

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    foreach ($conditions as $column => $_) { // $column は使うが、値は使わないので $_ にしている
        if (!preg_match('/^\w+$/', $column)) {
            return false;
        }
    }

    try {
        $query = "SELECT COUNT(*) FROM `{$table}`";
        $params = [];

        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $column => $value) {
                $whereClauses[] = "`{$column}` = ?";
                $params[] = $value;
            }
            $query .= " WHERE " . implode(" AND ", $whereClauses);
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn(); // 結果の取得
    } catch (Throwable $e) {
        return false; // エラー発生時にfalseを返す
    }
}
