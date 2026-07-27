<?php

declare(strict_types=1);

function startSession()
{
    // セッション設定（セキュリティ強化）
    define('SESSION_IDLE_TIMEOUT', 5400); // 90分
    define('SESSION_COOKIE_LIFETIME', 43200); // 12時間
    ini_set('session.use_strict_mode', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.gc_maxlifetime', SESSION_COOKIE_LIFETIME);
    ini_set('session.gc_probability', 1);
    ini_set('session.gc_divisor', 20);

    if (session_status() === PHP_SESSION_NONE) {
        $secure = (getenv('APP_ENV') === 'development') ? false : true;
        session_set_cookie_params([
            'lifetime' => SESSION_COOKIE_LIFETIME,
            'path' => '/',
            'domain' => $_ENV['MY_DOMAIN'],
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();
    }

    // 初回アクセス
    if (!isset($_SESSION['LAST_ACTIVITY'])) {
        $_SESSION['LAST_ACTIVITY'] = time();
        return; // まだセッションは有効なので処理に移る
    }

    // アイドルタイム超過チェック
    if (time() - $_SESSION['LAST_ACTIVITY'] > SESSION_IDLE_TIMEOUT) {

        // CookieからJWTを削除
        $secure = (getenv('APP_ENV') === 'development') ? false : true;
        setcookie('token', '', [
            'expires' => time() - 5400,
            'path' => '/',
            'domain' => $_ENV['MY_DOMAIN'],
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);

        // $_COOKIE からも削除（即時反映用）
        unset($_COOKIE['token']);

        // セッションデータを全て削除
        $_SESSION = [];

        // セッション cookie を削除
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        // セッションを破棄
        session_destroy();

        http_response_code(401);
        exit();
    }

    // 有効期限内であれば、現在時刻を最後の利用時間として登録
    $_SESSION['LAST_ACTIVITY'] = time();
}


/**
 * CSRFトークンの検証
 */
function validateCsrfToken(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (!isset($_SESSION['csrfToken']) || $token !== $_SESSION['csrfToken']) {
        throw new HttpException('csrfTokenが不正です', 403);
    }
}
