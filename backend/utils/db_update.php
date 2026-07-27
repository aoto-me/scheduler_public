<?php

declare(strict_types=1);

/**
 * 1件のレコードを更新する（該当なし: null、成功: true、失敗: false）
 *
 * @param \PDO $pdo
 * @param string $table テーブル名
 * @param array $conditions 更新条件（カラム名 => 値）
 * @param array $data 更新するデータ（カラム名 => 値）
 * @return bool|null 成功:true、失敗:false、該当なし:null
 */
function updateSingleRecord(\PDO $pdo, string $table, array $conditions, array $data): bool|null
{
    if (empty($data) || empty($conditions)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    $isValidColumnName = fn ($col) => preg_match('/^\w+$/', $col);
    foreach (array_merge(array_keys($data), array_keys($conditions)) as $col) {
        if (!$isValidColumnName($col)) {
            return false;
        }
    }

    // レコード存在確認
    $whereParts = array_map(fn ($col) => "`$col` = :cond_$col", array_keys($conditions));
    $checkSql = sprintf("SELECT COUNT(*) FROM `%s` WHERE %s", $table, implode(" AND ", $whereParts));
    $checkStmt = $pdo->prepare($checkSql);

    $condParams = [];
    foreach ($conditions as $col => $val) {
        $condParams["cond_$col"] = $val;
    }

    if (!$checkStmt->execute($condParams)) {
        return false;
    }

    if ((int)$checkStmt->fetchColumn() === 0) {
        return null;
    }

    $setParts = array_map(fn ($col) => "`$col` = :set_$col", array_keys($data));
    $updateSql = sprintf(
        "UPDATE `%s` SET %s WHERE %s",
        $table,
        implode(", ", $setParts),
        implode(" AND ", $whereParts)
    );
    $updateStmt = $pdo->prepare($updateSql);

    $params = [];
    foreach ($data as $col => $val) {
        $params["set_$col"] = $val;
    }
    foreach ($conditions as $col => $val) {
        $params["cond_$col"] = $val;
    }

    return $updateStmt->execute($params); // レコード存在 + SQL成功（変更の有無に関係なく）
}


/**
 * 指定した条件に一致するレコードを更新する
 *
 * @param \PDO $pdo
 * @param string $table 更新対象のテーブル名
 * @param array $conditions 更新対象の条件（カラム名 => 値 の連想配列）
 *                          - 例: ['status' => 'active', 'user_id' => 5]
 *                          - IN句を使う場合は配列を指定: ['category_id' => [1, 2, 3]]
 * @param array $data 更新するデータ（カラム名 => 値 の連想配列）
 *                    - 例: ['name' => '新しい名前', 'updated_at' => '2025-02-07 12:00:00']
 * @return bool 更新が成功したかどうか（true: 成功, false: 失敗）
 */
function updateRecordsByCondition(\PDO $pdo, string $table, array $conditions, array $data): bool
{
    if (empty($conditions) || empty($data)) {
        return false;
    }

    if (!preg_match('/^\w+$/', $table)) {
        return false;
    }

    try {
        $params = [];
        $setParts = [];
        foreach ($data as $col => $val) {
            $placeholder = "set_$col";
            $setParts[] = "$col = :$placeholder";
            $params[$placeholder] = $val;
        }

        $whereParts = [];
        foreach ($conditions as $col => $value) {
            if (is_array($value)) {
                $inPlaceholders = [];
                foreach ($value as $i => $val) {
                    $ph = "cond_{$col}_$i";
                    $inPlaceholders[] = ":$ph";
                    $params[$ph] = $val;
                }
                $whereParts[] = "$col IN (" . implode(", ", $inPlaceholders) . ")";
            } else {
                $ph = "cond_$col";
                $whereParts[] = "$col = :$ph";
                $params[$ph] = $value;
            }
        }

        $sql = sprintf(
            "UPDATE %s SET %s WHERE %s",
            $table,
            implode(", ", $setParts),
            implode(" AND ", $whereParts)
        );

        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    } catch (Throwable $e) {
        return false;
    }
}
