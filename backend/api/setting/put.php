<?php

declare(strict_types=1);

/**
 * rssの新規保存・更新
 */
function saveRssList(int $userId, int $id, string $table): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id, $table) {
        $inputData = parseJsonInput();
        $siteName = $inputData['siteName'] ?? null;
        $url = $inputData['url'] ?? null;
        $isNew = isset($inputData['isNew']) ? (bool)$inputData['isNew'] : false;

        $missingFields = [];
        if (!$siteName) {
            $missingFields[] = 'siteName';
        }
        if (!$url) {
            $missingFields[] = 'url';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($siteName, 200, 'siteName');
        validateUrl($url, 'url');
        validateMaxLength($url, 200, 'url');

        $insertData = [
            'siteName' => $siteName,
            'url' => $url
            ];

        if ($isNew) {
            // 新規保存処理
            $newId = insertRecordAndGetId($pdo, $table, [...$insertData, 'user' => $userId]);
            if ($newId === false) {
                throw new HttpException("{$table}：データの挿入に失敗しました", 500);
            }
            return [
                'message' => "{$table}が新規保存されました",
                'result' => ['id' => $newId, ...$insertData]
                ];
        } else {
            // 既存データの更新処理
            $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
            if ($result === false) {
                throw new HttpException("{$table}：更新に失敗しました", 500);
            }
            if ($result === null) {
                throw new HttpException("{$table}：対象のレコードがありません", 404);
            }
            return [
                'message' => "{$table}が更新されました",
                'result' => ['id' => $id, ...$insertData]
                ];
        }
    });
}


/**
 * yearEventの新規保存・更新
 */
function saveYearEvent(int $userId, int $id, string $table): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id, $table) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $name = $inputData['name'] ?? null;
        $isNew = isset($inputData['isNew']) ? (bool) $inputData['isNew'] : false;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if (!$name) {
            $missingFields[] = 'name';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($name, 100, 'name');

        $insertData = [
            'name' => $name,
            'date' => $date,
        ];

        if ($isNew) {
            // 新規保存処理
            $newId = insertRecordAndGetId($pdo, $table, [...$insertData, 'user' => $userId]);
            if ($newId === false) {
                throw new HttpException("{$table}：データの挿入に失敗しました", 500);
            }
            return [
                'message' => "{$table}が新規保存されました",
                'result' => ['id' => $newId, ...$insertData]
                ];
        } else {
            // 既存データの更新処理
            $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
            if ($result === false) {
                throw new HttpException("{$table}：更新に失敗しました", 500);
            }
            if ($result === null) {
                throw new HttpException("{$table}：対象のレコードがありません", 404);
            }
            return [
                'message' => "{$table}が更新されました",
                'result' => ['id' => $id, ...$insertData]
                ];
        }
    });
}


/**
 * foodDBの新規保存・更新
 */
function saveFoodDB(int $userId, int $id, string $table): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id, $table) {
        $inputData = parseJsonInput();
        $name = $inputData['name'] ?? null;
        $perItem = $inputData['perItem'] ?? 0;
        $energy = $inputData['energy'] ?? null;
        $protein = $inputData['protein'] ?? null;
        $fat = $inputData['fat'] ?? null;
        $carb = $inputData['carb'] ?? null;
        $salt = $inputData['salt'] ?? null;
        $isNew = isset($inputData['isNew']) ? (bool) $inputData['isNew'] : false;

        $missingFields = [];
        if (!$name) {
            $missingFields[] = 'name';
        }
        if ($perItem === null || !in_array($perItem, [0, 1], true)) {
            $missingFields[] = 'perItem';
        }
        if ($energy === null || $energy === '') { // 0はOK
            $missingFields[] = 'energy';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($name, 100, 'name');
        validateNonNegativeNumber($energy, 'energy');
        if ($protein !== null) {
            validateNonNegativeNumber($protein, 'protein');
        }
        if ($fat !== null) {
            validateNonNegativeNumber($fat, 'fat');
        }
        if ($carb !== null) {
            validateNonNegativeNumber($carb, 'carb');
        }
        if ($salt !== null) {
            validateNonNegativeNumber($salt, 'salt');
        }

        $insertData = [
            'name' => $name,
            'perItem' => $perItem,
            'energy' => $energy,
            'protein' => $protein,
            'carb' => $carb,
            'fat' => $fat,
            'salt' => $salt,
        ];

        if ($isNew) {
            // 新規保存処理
            $newId = insertRecordAndGetId($pdo, $table, [...$insertData, 'user' => $userId]);
            if ($newId === false) {
                throw new HttpException("{$table}：データの挿入に失敗しました", 500);
            }
            return [
                'message' => "{$table}が新規保存されました",
                'result' => ['id' => $newId, ...$insertData]
                ];
        } else {
            // 既存データの更新処理
            $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
            if ($result === false) {
                throw new HttpException("{$table}：更新に失敗しました", 500);
            }
            if ($result === null) {
                throw new HttpException("{$table}：対象のレコードがありません", 404);
            }
            return [
                'message' => "{$table}が更新されました",
                'result' => ['id' => $id, ...$insertData]
                ];
        }
    });
}


/**
 * nutritionの更新
 */
function saveNutrition(int $userId, int $id, string $table): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id, $table) {
        $inputData = parseJsonInput();
        $energy = $inputData['energy'] ?? null;
        $protein = $inputData['protein'] ?? null;
        $fat = $inputData['fat'] ?? null;
        $carb = $inputData['carb'] ?? null;
        $salt = $inputData['salt'] ?? null;

        $missingFields = [];
        if ($energy === null) {
            $missingFields[] = 'energy';
        }
        if ($protein === null) {
            $missingFields[] = 'protein';
        }
        if ($fat === null) {
            $missingFields[] = 'fat';
        }
        if ($carb === null) {
            $missingFields[] = 'carb';
        }
        if ($salt === null) {
            $missingFields[] = 'salt';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateNonNegativeNumber($energy, 'energy');
        validateNonNegativeNumber($protein, 'protein');
        validateNonNegativeNumber($fat, 'fat');
        validateNonNegativeNumber($carb, 'carb');
        validateNonNegativeNumber($salt, 'salt');

        $insertData = [
            'energy' => $energy,
            'protein' => $protein,
            'carb' => $carb,
            'fat' => $fat,
            'salt' => $salt
        ];

        // 既存データの更新処理
        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }
        return [
            'message' => "{$table}が更新されました",
            'result' => ['id' => $id, ...$insertData]
            ];
    });
}


/**
 * health・income・expenseカテゴリの新規保存・更新
 */
function saveCategory(int $userId, int $id, string $table): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id, $table) {
        $inputData = parseJsonInput();
        $name = $inputData['name'] ?? null;
        $icon = $inputData['icon'] ?? null;
        $isNew = isset($inputData['isNew']) ? (bool) $inputData['isNew'] : false;

        $missingFields = [];
        if (!$name) {
            $missingFields[] = 'name';
        }
        if (!$icon) {
            $missingFields[] = 'icon';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($name, 50, 'name');
        validateMaxLength($icon, 50, 'icon');

        $insertData = [
            'name' => $name,
            'icon' => $icon,
        ];

        if ($isNew) {
            // 新規保存処理
            $newId = insertRecordAndGetId($pdo, $table, [...$insertData, 'user' => $userId]);
            if ($newId === false) {
                throw new HttpException("{$table}：データの挿入に失敗しました", 500);
            }
            return [
                'message' => "{$table}が新規保存されました",
                'result' => ['id' => $newId, ...$insertData]
                ];
        } else {
            // 既存データの更新処理
            $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
            if ($result === false) {
                throw new HttpException("{$table}：更新に失敗しました", 500);
            }
            if ($result === null) {
                throw new HttpException("{$table}：対象のレコードがありません", 404);
            }
            return [
                'message' => "{$table}が更新されました",
                'result' => ['id' => $id, ...$insertData]
                ];
        }
    });
}
