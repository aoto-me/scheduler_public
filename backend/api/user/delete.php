<?php

declare(strict_types=1);

/**
 * ログアウト
 */
function logout(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        return;
    }

    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // CookieからJWTを削除
        $secure = (getenv('APP_ENV') === 'development') ? false : true;
        setcookie('token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => $_ENV['MY_DOMAIN'],
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);

        // CookieからdeviceIdを削除
        setcookie('deviceId', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => $_ENV['MY_DOMAIN'],
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        // $_COOKIE からも削除（即時反映用）
        unset($_COOKIE['token']);
        unset($_COOKIE['deviceId']);

        // セッションデータを全て削除
        $_SESSION = [];

        // セッションのクッキーも削除
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        // セッションを破棄
        session_destroy();

        http_response_code(204);
    } catch (Throwable $e) {
        logError($e->getMessage(), $e);

        http_response_code(500);
        if (getenv('APP_ENV') === 'development') {
            echo json_encode(['error' => $e->getMessage()]);
        } else {
            echo json_encode(['error' => 'サーバーエラーが発生しました']);
        }
    }
};
