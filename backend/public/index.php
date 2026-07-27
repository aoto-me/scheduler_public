<?php

declare(strict_types=1);

require_once(__DIR__ . '/../utils/cors.php');
require_once(__DIR__ . '/../vendor/autoload.php');
require_once(__DIR__ . '/../utils/env.php');
require_once(__DIR__ . '/../utils/exception.php');
require_once(__DIR__ . '/../utils/session.php');
require_once(__DIR__ . '/../utils/jwt.php');
require_once(__DIR__ . '/../utils/device.php');
require_once(__DIR__ . '/../utils/handleRequest.php');
require_once(__DIR__ . '/../utils/log.php');
require_once(__DIR__ . '/../utils/db.php');
require_once(__DIR__ . '/../utils/db_fetch.php');
require_once(__DIR__ . '/../utils/db_insert.php');
require_once(__DIR__ . '/../utils/db_update.php');
require_once(__DIR__ . '/../utils/db_delete.php');
require_once(__DIR__ . '/../utils/uploadDir.php');
require_once(__DIR__ . '/../utils/deleteFolderRecursive.php');
require_once(__DIR__ . '/../utils/validate.php');

setCorsHeaders();
loadEnv();
startSession();

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// プレフィックスを除去（/backend/api/user/123 → user/123）
$path = preg_replace('#^/backend/api/#', '', $requestUri);
$segments = explode('/', trim($path, '/'));
$resource = $segments[0] ?? null; // 分割したパスの先頭でディレクトリを決定（['user', '123']）
$type     = null;
$id       = null;

// 2階層目・3階層目を判定
if (isset($segments[1])) {
    if (ctype_digit($segments[1]) && $segments[1] !== "0") {
        $id = (int)$segments[1];
    } else {
        $type = $segments[1];
    }
}
if (isset($segments[2]) && ctype_digit($segments[2]) && $segments[2] !== "0") {
    $id = (int)$segments[2];
}

// 定数に登録
if ($type !== null) {
    define('ROUTE_TYPE', $type);
}
if ($id !== null) {
    define('ROUTE_ID', $id);
}

// API一覧
$availableResources = [
    'user',
    'ai',
    'diary',
    'file',
    'food',
    'gallery',
    'health',
    'memo',
    'menu',
    'money',
    'monthlyMemo',
    'ogp',
    'project',
    'section',
    'setting',
    'table',
    'todo',
    'upload',
    'rss',
    'download',
    'search'
    ];

$scriptPath = __DIR__ . '/../api/' . $resource . '/index.php';

if ($resource === 'user' && ($method === 'POST' || $method === 'GET') && file_exists($scriptPath)) {
    // 新規ログイン or 認証ログイン
    require $scriptPath;
} elseif (in_array($resource, $availableResources) && file_exists($scriptPath)) {
    // ログイン済み
    $userId = authorizationCheck();
    $pdo = getPdoConnection();
    $isDevice = checkDeviceId($pdo, $userId);

    if ($_SESSION['userId'] === $userId && $isDevice) {
        require $scriptPath;
    } else {
        error_log(sprintf(
            '[AUTH_MISMATCH] %s sessionUserId=%s jwtUserId=%d isDevice=%s ip=%s uri=%s',
            date('Y-m-d H:i:s'),
            $_SESSION['userId'] ?? 'none',
            $userId,
            $isDevice ? 'true' : 'false',
            $_SERVER['REMOTE_ADDR'] ?? '-',
            $_SERVER['REQUEST_URI'] ?? '-'
        ));
        http_response_code(401);
        echo json_encode(['error' => '認証に失敗しました。ログインし直してください']);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'リクエスト先がありません']);
}


/**
 * （ログイン済みの場合）処理前の認可の確認
 */
function authorizationCheck(): int
{
    try {
        // CSRFトークンの検証
        validateCsrfToken();

        // JWTのデコード
        $user = getUserFromJWT();
        $userId = (int) $user['userId'];
        if ($userId) { // 0は弾かれる
            define('USER_ID', $userId);
        }

        return $userId;

    } catch (HttpException $e) {
        // CSRF 不一致はログに記録（通常の使用では発生しない）
        if ($e->getStatusCode() === 403) {
            error_log(sprintf(
                '[CSRF_FAIL] %s ip=%s uri=%s',
                date('Y-m-d H:i:s'),
                $_SERVER['REMOTE_ADDR'] ?? '-',
                $_SERVER['REQUEST_URI'] ?? '-'
            ));
        }
        http_response_code($e->getStatusCode());
        echo json_encode(['error' => $e->getMessage()]);
        exit();
    } catch (Throwable $e) {
        logError($e->getMessage(), $e);
        http_response_code(500);
        echo json_encode(['error' => 'サーバーエラーが発生しました']);
        exit();
    }
}
