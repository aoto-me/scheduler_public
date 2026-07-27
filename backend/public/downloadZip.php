<?php

declare(strict_types=1);

require_once(__DIR__ . '/../utils/cors.php');
require_once(__DIR__ . '/../vendor/autoload.php');
require_once(__DIR__ . '/../utils/env.php');
require_once(__DIR__ . '/../utils/exception.php');
require_once(__DIR__ . '/../utils/session.php');
require_once(__DIR__ . '/../utils/jwt.php');
require_once(__DIR__ . '/../utils/uploadDir.php');
require_once(__DIR__ . '/../utils/db.php');
require_once(__DIR__ . '/../utils/device.php');
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

        $pdo = getPdoConnection();
        if (!checkDeviceId($pdo, $userId)) {
            http_response_code(401);
            exit();
        }

        $file = basename($_GET['file']);
        $name = $_GET['name'] ?? null;
        $fileName = $name ? "{$name}.zip" : 'scheduler_download.zip';
        $zipPath = getUploadBaseDir($userId) . '/tmp_zip/' . $file;

        if (!is_file($zipPath)) {
            http_response_code(404);
            exit();
        }

        $handle = fopen($zipPath, 'rb');
        if (!$handle) {
            logError("Failed to open file: $zipPath");
            http_response_code(500);
            exit();
        }

        header('Content-Type: application/zip');
        header('Content-Length: ' . filesize($zipPath));
        header('Content-Disposition: attachment; filename="' . rawurlencode(basename($fileName)) . '"');

        ignore_user_abort(true); // ユーザーが途中でページを閉じても処理を続ける
        set_time_limit(0);

        // 処理終了時に実行
        register_shutdown_function(function () use ($zipPath) {
            if (file_exists($zipPath)) {
                unlink($zipPath);
            }
        });

        // ファイルの終わりまでループし、1MBずつ読み、ブラウザに送る
        $chunkSize = 1024 * 1024;
        while (!feof($handle)) {
            echo fread($handle, $chunkSize);
            flush();
        }
        fclose($handle);

        exit();

    } catch (Throwable $e) {
        logError($e->getMessage(), $e);
        http_response_code(500);
        exit();
    }
}
