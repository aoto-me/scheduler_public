<?php

declare(strict_types=1);

/**
 * foodデータの更新
 */
function updateFoodData(int $userId, int $id): void
{
    handlePutRequest(function (PDO $pdo) use ($userId, $id) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $name = $inputData['name'] ?? null;
        $quantity = $inputData['quantity'] ?? null;
        $unit = $inputData['unit'] ?? null;
        $energy = $inputData['energy'] ?? null;
        $protein = $inputData['protein'] ?? null;
        $fat = $inputData['fat'] ?? null;
        $carb = $inputData['carb'] ?? null;
        $salt = $inputData['salt'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if (!$name) {
            $missingFields[] = 'name';
        }
        if ($quantity === null) {
            $missingFields[] = 'quantity';
        }
        $validUnits = ['g', '個'];
        if (!$unit || !in_array($unit, $validUnits, true)) {
            $missingFields[] = 'unit';
        }
        if ($energy === null) {
            $missingFields[] = 'energy';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($name, 100, 'name');
        validateNonNegativeNumber($quantity, 'quantity');
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
            'user' => $userId,
            'date' => $date,
            'name' => $name,
            'quantity' => $quantity,
            'unit' => $unit,
            'energy' => $energy,
            'protein' => $protein,
            'fat' => $fat,
            'carb' => $carb,
            'salt' => $salt,
        ];

        $table = "food";

        // 更新処理
        $result = updateSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId], $insertData);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}を更新しました",
            'result' => $id
            ];
    });
}


/**
 * foodデータの新規保存
 */
function insertFoodData(int $userId): void
{
    handlePutRequest(function (PDO $pdo) use ($userId) {
        $inputData = parseJsonInput();
        $date = $inputData['date'] ?? null;
        $name = $inputData['name'] ?? null;
        $quantity = $inputData['quantity'] ?? null;
        $unit = $inputData['unit'] ?? null;
        $energy = $inputData['energy'] ?? null;
        $protein = $inputData['protein'] ?? null;
        $fat = $inputData['fat'] ?? null;
        $carb = $inputData['carb'] ?? null;
        $salt = $inputData['salt'] ?? null;

        $missingFields = [];
        if (!$date) {
            $missingFields[] = 'date';
        }
        if (!$name) {
            $missingFields[] = 'name';
        }
        if ($quantity === null) {
            $missingFields[] = 'quantity';
        }
        $validUnits = ['g', '個'];
        if (!$unit || !in_array($unit, $validUnits, true)) {
            $missingFields[] = 'unit';
        }
        if ($energy === null) {
            $missingFields[] = 'energy';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateDate($date, 'date');
        validateMaxLength($name, 100, 'name');
        validateNonNegativeNumber($quantity, 'quantity');
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
            'user' => $userId,
            'date' => $date,
            'name' => $name,
            'quantity' => $quantity,
            'unit' => $unit,
            'energy' => $energy,
            'protein' => $protein,
            'fat' => $fat,
            'carb' => $carb,
            'salt' => $salt,
        ];

        $table = "food";

        // 新規保存処理
        $newId = insertRecordAndGetId($pdo, $table, $insertData);
        if ($newId === false) {
            throw new HttpException("{$table}：データの挿入に失敗しました", 500);
        }

        return [
            'message' => "{$table}を新規保存しました",
            'result' => $newId
            ];
    });
}
