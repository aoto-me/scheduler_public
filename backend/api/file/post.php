<?php

declare(strict_types=1);

/**
 * 新規フォルダの追加
 */
function createFolder(string $uploadDir, array $inputData): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    $name = $inputData['name'] ?? null;

    $missingFields = [];
    if (!$name) {
        $missingFields[] = 'name';
    }
    if (!empty($missingFields)) {
        throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
    }

    validateMaxLength($name, 255, 'name');

    // 空白チェック（半角・全角・改行など）
    if (preg_match('/\s/u', $name)) {
        throw new HttpException('フォルダ名に空白は使用できません', 400);
    }

    // フォルダ名の禁止文字チェック（Windows互換 + ドット禁止）
    if (preg_match('/[\/\\\\:\*\?"<>\|\.]/u', $name)) {
        throw new HttpException('フォルダ名に使用できない文字が含まれています', 400);
    }

    // 既存フォルダ一覧（フォルダのみ）
    $existingFolders = [];
    $items = scandir($uploadDir);
    if ($items === false) {
        throw new HttpException('ディレクトリを読み取れません', 400);
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        if (is_dir($uploadDir . '/' . $item)) {
            $existingFolders[] = $item;
        }
    }

    // 重複しないフォルダ名を生成
    $newFolderName = $name;
    $counter = 1;
    while (in_array($newFolderName, $existingFolders)) {
        $newFolderName = "{$name}({$counter})";
        $counter++;
    }

    // フォルダ作成
    $newFolderPath = $uploadDir . '/' . $newFolderName;
    if (!mkdir($newFolderPath, 0755, true)) {
        $error = error_get_last();
        throw new HttpException('フォルダの作成に失敗しました: ' . ($error['message'] ?? '不明な理由'), 500);
    }

    http_response_code(200);
    echo json_encode([
        'message' => '新規フォルダを追加しました',
        'result' => $newFolderName,
    ]);
}
