<?php

declare(strict_types=1);

/**
 * アップロードフォルダの階層を取得
 */
function getDirectories(string $uploadDir): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        return;
    }

    // アクセス不可
    if (!is_readable($uploadDir)) {
        throw new HttpException('ディレクトリを読み取れません', 400);
    }

    $directoryTree = getDirectoryTree($uploadDir);

    if ($directoryTree === null) {
        throw new HttpException('ディレクトリを取得できませんでした', 500);
    }

    http_response_code(200);
    echo json_encode(['result' => $directoryTree]);
}

// ディレクトリ構造を再帰的に取得する
function getDirectoryTree(string $dir): ?array
{
    $result = [];

    $items = scandir($dir);
    if ($items === false) {
        return null;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $path = $dir . '/' . $item;
        // ディレクトリなら再帰呼び出し
        if (is_dir($path)) {
            $result[$item] = getDirectoryTree($path) ?? [];
            // 末端もオブジェクトに統一
            if (empty($result[$item])) {
                $result[$item] = new stdClass();
            }
        }
    }

    return $result;
}


/**
 * アップロードフォルダの中から検索ワードに合うファイルを取得する
 */
function searchFolderItems(int $userId, string $uploadDir): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        return;
    }

    $word = $_GET['word'] ?? '';
    if (!$word) {
        throw new HttpException('検索ワードがありません', 400);
    }

    // 空白（スペース、タブ、全角スペースなど）で分割
    $words = preg_split('/\s+/', trim($word));
    $words = array_filter($words, fn ($w) => $w !== '');

    if (!is_readable($uploadDir)) {
        throw new HttpException('ディレクトリを読み取れません', 400);
    }

    $itemList = [];
    $MY_ORIGIN = $_ENV['MY_ORIGIN'] ?? '';

    // RecursiveDirectoryIteratorで再帰的にファイルを探索
    $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($uploadDir));
    $id = 1;

    foreach ($rii as $file) {
        if (!$file->isFile()) {
            continue;
        }

        $fileName = $file->getFilename(); // ファイル名（拡張子含む）

        // どれか1つのワードが含まれているか
        $match = false;
        foreach ($words as $w) {
            if (stripos($fileName, $w) !== false) {
                $match = true;
                break;
            }
        }

        if (!$match) {
            continue;
        }

        // パスを uploadDir からの相対パスに変換
        $relativePath = str_replace($uploadDir . '/', '', $file->getPath());

        $itemList[] = [
            'id' => $id++,
            'name' => pathinfo($fileName, PATHINFO_FILENAME),
            'extension' => pathinfo($fileName, PATHINFO_EXTENSION) ?? '',
            'size' => $file->getSize(),
            'url' => rtrim($MY_ORIGIN, '/') . '/backend/uploads/user' . $userId . '/' . $relativePath . '/' . $fileName,
            'path' => $relativePath . '/',
            'date' => date("Y-m-d H:i:s", $file->getMTime()),
        ];
    }

    http_response_code(200);
    echo json_encode(['result' => $itemList]);
}


/**
 * 指定の階層のファイル一覧を取得
 */
function getFolderItems(int $userId, string $uploadDir, string $path): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        return;
    }

    $items = scandir($uploadDir);
    if ($items === false) {
        throw new HttpException('ディレクトリを取得できませんでした', 500);
    }

    $items = array_diff($items, ['.', '..']);
    $itemList = [];

    $MY_ORIGIN = $_ENV['MY_ORIGIN'];
    $urlBase = "{$MY_ORIGIN}/backend/uploads/user{$userId}/{$path}";

    foreach ($items as $index => $item) {
        $itemPath = $uploadDir . '/' . $item;

        if (!is_file($itemPath)) {
            continue;
        }

        $itemList[] = [
            'id' => $index + 1,
            'name' => pathinfo($item, PATHINFO_FILENAME), // 拡張子を除いたファイル名
            'extension' => pathinfo($item, PATHINFO_EXTENSION) ?? '', // 拡張子（存在しない場合は空文字）
            'size' => filesize($itemPath), // ファイルサイズ（バイト単位）
            'url' => $urlBase . $item, // 日本語ファイル名をエンコードしない
            'path' => $path, // ディレクトリのパスのみ
            'date' => date("Y-m-d H:i:s", filemtime($itemPath)), // 最終更新日時
        ];
    }

    http_response_code(200);
    echo json_encode(['result' => $itemList]);
}
