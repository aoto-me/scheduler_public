<?php

declare(strict_types=1);

/**
 * 1件のファイルを削除
 */
function deleteFile(string $uploadDir, array $inputData): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        return;
    }

    $path = $inputData['path'] ?? null; // 空でないか確認用
    $name = $inputData['name'] ?? null;
    $extension = $inputData['extension'] ?? null;

    $missingFields = [];
    if (!$path) {
        $missingFields[] = 'path';
    }
    if (!$name) {
        $missingFields[] = 'name';
    }
    if ($extension === null) { // 拡張子がない場合は空文字が入る
        $missingFields[] = 'extension';
    }
    if (!empty($missingFields)) {
        throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
    }

    $formattedExtension = $extension !== '' ? '.' . $extension : '';
    $filePath = $uploadDir . '/' . $name . $formattedExtension;

    $realFilePath = realpath($filePath);
    if ($realFilePath === false || strpos($realFilePath, $uploadDir) !== 0) {
        throw new HttpException("不正なファイルパスです", 400);
    }

    if (!is_file($filePath)) {
        throw new HttpException("指定されたファイルが存在しません: {$name}{$formattedExtension}", 400);
    }

    if (!unlink($filePath)) {
        throw new HttpException("ファイルの削除に失敗しました: {$name}{$formattedExtension}", 500);
    }

    // サムネイル対応画像形式のみ処理
    $imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'];
    if (in_array(strtolower($extension), $imageExtensions)) {
        $thumbPath = $uploadDir . '/' . $name . '_thumb' . $formattedExtension;
        if (file_exists($thumbPath)) {
            @unlink($thumbPath); // エラーを無視して削除
        }
    }

    http_response_code(200);
    echo json_encode([
        'message' => 'ファイルを削除しました',
        'result' => 'ok'
    ]);
}


/**
 * 複数ファイルを削除
 */
function deleteFiles(string $uploadDir, array $inputData): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        return;
    }

    $path = $inputData['path'] ?? null; // 空でないか確認用
    $files = $inputData['files'] ?? null;

    $missingFields = [];
    if (!$path) {
        $missingFields[] = 'path';
    }
    if (!is_array($files) || empty($files)) {
        $missingFields[] = 'files';
    }
    if (!empty($missingFields)) {
        throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
    }

    $failedFiles = [];

    foreach ($files as $file) {
        $name = $file['name'] ?? null;
        $extension = $file['extension'] ?? null;

        $missingFields = [];
        if (!$name) {
            $missingFields[] = 'name';
        }
        if ($extension === null) {
            $missingFields[] = 'extension';
        }

        if (!empty($missingFields)) {
            $failedFiles[] = [
                'name' => $name ?? 'unknown',
                'extension' => $extension ?? '',
                'message' => 'データが不足しています: ' . implode(', ', $missingFields)
            ];
            continue;
        }

        $formattedExtension = $extension !== '' ? '.' . $extension : '';

        $filePath = $uploadDir . '/' . $name . $formattedExtension;

        $realFilePath = realpath($filePath);
        if ($realFilePath === false || strpos($realFilePath, $uploadDir) !== 0) {
            $failedFiles[] = [
                'name' => $name,
                'extension' => $extension,
                'message' => "不正なファイルパスです"
            ];
            continue;
        }

        if (!is_file($filePath)) {
            $failedFiles[] = [
                'name' => $name,
                'extension' => $extension,
                'message' => "ファイルが存在しません"
            ];
            continue;
        }

        if (!unlink($filePath)) {
            $failedFiles[] = [
                'name' => $name,
                'extension' => $extension,
                'message' => "削除に失敗しました"
            ];
            continue;
        }

        // サムネイル対応画像形式のみ処理
        $imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'];
        if (in_array(strtolower($extension), $imageExtensions)) {
            $thumbPath = $uploadDir . '/' . $name . '_thumb' . $formattedExtension;
            if (file_exists($thumbPath)) {
                @unlink($thumbPath); // エラーを無視して削除
            }
        }
        // 成功した場合は記録なし
    }

    http_response_code(200);
    echo json_encode([
        'message' => 'ファイルを削除しました',
        'result' => empty($failedFiles) ? 'ok' : $failedFiles
    ]);
}


/**
 * フォルダに含まれる全てのフォルダとファイルを削除
 */
function deleteFolder(string $uploadDir, array $inputData): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        return;
    }

    $path = $inputData['path'] ?? null;

    $missingFields = [];
    if (!$path) {
        $missingFields[] = 'path';
    }
    if (!empty($missingFields)) {
        throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
    }

    if (!is_dir($uploadDir)) {
        throw new HttpException("指定されたフォルダが存在しません: {$uploadDir}", 404);
    }

    deleteFolderRecursive($uploadDir);

    http_response_code(200);
    echo json_encode([
        'message' => 'フォルダを削除しました',
        'result' => 'ok'
    ]);
}
