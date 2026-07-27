<?php

declare(strict_types=1);

/**
 * ファイル名の変更
 */
function renameFile(int $userId, string $uploadDir, array $inputData): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
        return;
    }

    $oldName = $inputData['oldName'] ?? null;
    $newName = $inputData['newName'] ?? null;
    $extension = $inputData['extension'] ?? null;
    $path = $inputData['path'] ?? null;

    $missingFields = [];
    if (!$oldName) {
        $missingFields[] = 'oldName';
    }
    if (!$newName) {
        $missingFields[] = 'newName';
    }
    if ($extension === null) {
        $missingFields[] = 'extension';
    }
    if (!$path) {
        $missingFields[] = 'path';
    }
    if (!empty($missingFields)) {
        throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
    }

    validateMaxLength($newName, 255, 'newName');

    // 空白チェック（半角・全角・改行など）
    if (preg_match('/\s/u', $newName)) {
        throw new HttpException('ファイル名に空白は使用できません', 400);
    }

    // 禁止文字チェック（Windows互換）
    if (preg_match('/[\/\\\\\?\*\:\|"<>]/', $newName)) {
        throw new HttpException('ファイル名に使用できない文字が含まれています', 400);
    }

    // 先頭が . で始まるファイルは弾く
    if (str_starts_with($newName, '.')) {
        throw new HttpException('ドットから始まるファイル名は利用できません', 400);
    }

    // 末尾が _thumb で終わるファイルは弾く
    if (str_ends_with($newName, '_thumb')) {
        throw new HttpException('_thumbで終わるファイル名は利用できません', 400);
    }

    // ディレクトリのスラッシュを整える（レスポンスデータの返送用）
    if ($path !== '') {
        $path = rtrim($path, '/') . '/';
    }

    $formattedExtension = $extension !== '' ? '.' . $extension : '';
    $oldFilePath = $uploadDir . '/' . $oldName . $formattedExtension;
    $baseNewFilePath = $uploadDir . '/' . $newName;

    $realOldPath = realpath($oldFilePath);
    if ($realOldPath === false || strpos($realOldPath, $uploadDir) !== 0) {
        throw new HttpException("不正なファイルパスです", 400);
    }

    if (!is_file($oldFilePath)) {
        throw new HttpException("指定されたファイルが存在しません:{$oldName}{$formattedExtension}", 400);
    }

    // 重複するファイル名がないか確認
    $counter = 1;
    while (file_exists($baseNewFilePath . $formattedExtension)) {
        $baseNewFilePath = $uploadDir . '/' . $newName . "({$counter})";
        $counter++;
    }
    $newFilePath = $baseNewFilePath . $formattedExtension;

    // ファイル名の変更
    if (!rename($oldFilePath, $newFilePath)) {
        $error = error_get_last();
        throw new HttpException('ファイル名の変更に失敗しました:' . ($error['message'] ?? '不明なエラー'), 400);
    }

    // サムネイルファイルのパスを組み立てて、存在すればリネーム
    $oldThumbPath = $uploadDir . '/' . $oldName . '_thumb' . $formattedExtension;
    $newThumbPath = $baseNewFilePath . '_thumb' . $formattedExtension;

    if (file_exists($oldThumbPath)) {
        if (!rename($oldThumbPath, $newThumbPath)) {
            $error = error_get_last();
            throw new HttpException('サムネイルのファイル名の変更に失敗しました:' . ($error['message'] ?? '不明なエラー'), 400);
        }
    }

    $MY_ORIGIN = $_ENV['MY_ORIGIN'];
    $urlBase = "{$MY_ORIGIN}/backend/uploads/user{$userId}/";

    http_response_code(200);
    echo json_encode([
        'message' => 'ファイル名を変更しました',
        'result' => [
            'name' => pathinfo($newFilePath, PATHINFO_FILENAME),
            'url' => $urlBase . $path . pathinfo($newFilePath, PATHINFO_BASENAME),
        ]
    ]);
}


/**
 * フォルダ名の変更
 */
function renameFolder(string $uploadDir, array $inputData): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
        return;
    }

    $path = $inputData['path'] ?? null; // 確認用
    $newName = $inputData['name'] ?? null;

    $missingFields = [];
    if (!$path) {
        $missingFields[] = 'path';
    }
    if (!$newName) {
        $missingFields[] = 'name';
    }
    if (!empty($missingFields)) {
        throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
    }

    validateMaxLength($newName, 255, 'name');

    // 空白チェック（半角・全角・改行など）
    if (preg_match('/\s/u', $newName)) {
        throw new HttpException('フォルダ名に空白は使用できません', 400);
    }

    // フォルダ名の禁止文字チェック（Windows互換 + ドット禁止）
    if (preg_match('/[\/\\\\:\*\?"<>\|\.]/u', $newName)) {
        throw new HttpException('フォルダ名に使用できない文字が含まれています', 400);
    }

    // フォルダの親ディレクトリを取得
    $parentDir = dirname($uploadDir);
    if (!is_dir($uploadDir)) {
        throw new HttpException("指定されたフォルダが存在しません:{$uploadDir}", 404);
    }

    // 親ディレクトリの中身を取得
    $items = scandir($parentDir);
    if ($items === false) {
        throw new HttpException('ディレクトリを取得できませんでした', 500);
    }

    // フォルダだけを抽出
    $existingFolders = array_filter(
        $items,
        function (string $item) use ($parentDir): bool {
            if ($item === '.' || $item === '..') {
                return false;
            }

            $fullPath = $parentDir . '/' . $item;
            return is_dir($fullPath);
        }
    );

    // フォルダの新しい名前を決定（重複しない名前を作成）
    $newFolderName = $newName;
    $counter = 1;
    while (in_array($newFolderName, $existingFolders)) {
        $newFolderName = "{$newName}({$counter})";
        $counter++;
    }

    $newFolderPath = $parentDir . '/' . $newFolderName;

    // フォルダ名を変更
    if (!rename($uploadDir, $newFolderPath)) {
        throw new HttpException("フォルダ名の変更に失敗しました", 500);
    }

    http_response_code(200);
    echo json_encode([
        'message' => 'フォルダ名を変更しました',
        'result' => $newFolderName
    ]);
}
