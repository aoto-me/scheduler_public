<?php

declare(strict_types=1);

require_once(__DIR__ . '/../utils/cors.php');
require_once(__DIR__ . '/../vendor/autoload.php');
require_once(__DIR__ . '/../utils/env.php');
require_once(__DIR__ . '/../utils/exception.php');
require_once(__DIR__ . '/../utils/session.php');
require_once(__DIR__ . '/../utils/jwt.php');
require_once(__DIR__ . '/../utils/uploadDir.php');
require_once(__DIR__ . '/../utils/log.php');

setCorsHeaders();
loadEnv();
startSession();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $user = getUserFromJWT();
        $userId = (int)$user['userId'];

        if ($_SESSION['userId'] !== $userId || $userId === 0) {
            http_response_code(403);
            exit();
        }

        // デバイスIDのチェックは速度優先のため省略

        $file = basename($_GET['file']);
        $path = $_GET['path'];

        if ($path !== '') {
            $path = rtrim($path, '/') . '/';
        }

        if (strpos($path, '..') !== false) {
            http_response_code(400);
            exit();
        }

        $uploadDir = getUploadBaseDir($userId) . '/' . $path;
        $fullPath = realpath($uploadDir . $file);

        if (
            $fullPath === false ||
            strpos($fullPath, realpath($uploadDir)) !== 0 ||
            !is_file($fullPath)
        ) {
            http_response_code(404);
            exit();
        }

        // MIMEとサイズ取得
        $mimeType = mime_content_type($fullPath);
        $fileSize = filesize($fullPath);
        $lastModified = filemtime($fullPath);

        // ブラウザからの更新確認
        if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
            $ifModifiedSince = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);

            if ($ifModifiedSince !== false && $ifModifiedSince >= $lastModified) {
                // キャッシュから利用
                http_response_code(304);
                exit();
            }
        }

        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . $fileSize);
        header('Cache-Control: private, max-age=86400'); // 1日（利用する中で伸ばしていいか再検討）
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');

        // ファイル出力
        readfile($fullPath);
        exit();
    } catch (Throwable $e) {
        logError($e->getMessage(), $e);
        http_response_code(500);
        exit();
    }
}
