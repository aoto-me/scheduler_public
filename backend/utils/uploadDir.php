<?php

declare(strict_types=1);

/**
 * アップロードベースディレクトリの取得
 */
function getUploadBaseDir(int $userId): string
{
    if (getenv('APP_ENV') === 'development') {
        $base = realpath(__DIR__ . '/../uploads');
    } else {
        $base = dirname(dirname($_SERVER['DOCUMENT_ROOT'])) . '/scheduler_test/uploads';
    }
    return $base . "/user{$userId}";
}


/**
 * アップロードディレクトリの取得
 */
function getUploadDir(int $userId, string $path): string
{
    // 二重スラッシュ や スラッシュなしを防止
    if ($path !== '') {
        $path = rtrim($path, '/') . '/';
    }

    // 階層移動防止
    if (strpos($path, '..') !== false) {
        throw new HttpException('不正なディレクトリパスです', 400);
    }

    $baseDir = getUploadBaseDir($userId);
    $uploadDir = realpath($baseDir . '/' . $path);

    // $uploadDir が /uploads/user{userId} 配下にあるかをチェック
    if ($uploadDir === false || strpos($uploadDir, $baseDir) !== 0) {
        throw new HttpException('不正なアップロードパスです', 400);
    }

    if (!is_dir($uploadDir)) {
        throw new HttpException('アップロードフォルダがありません', 400);
    }

    return $uploadDir;
}
