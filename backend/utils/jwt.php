<?php

declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * JWTからユーザー情報を取得
 */
function getUserFromJWT(): array
{
    $token = $_COOKIE['token'] ?? null;

    if (!$token) {
        throw new HttpException('トークンが存在しません', 401);
    }

    $secretKey = $_ENV['JWT_SECRET_KEY'] ?? '';
    if (!$secretKey) {
        throw new HttpException('サーバーの設定エラー', 500);
    }

    try {
        $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
    } catch (Throwable $e) {
        throw new HttpException('無効なトークンです', 401, $e);
    }

    return [
        'userId' => $decoded->userId ?? null,
        'userName' => $decoded->userName ?? null,
    ];
}


/**
 * CookieにJWTを登録
 */
function setJWT(array $user): void
{
    $secretKey = $_ENV['JWT_SECRET_KEY'];
    $payload = [
        'userName' => $user['userName'],
        'userId' => $user['id'],
        'exp' => time() + (60 * 60 * 12)
    ];
    $token = JWT::encode($payload, $secretKey, 'HS256');
    $secure = (getenv('APP_ENV') === 'development') ? false : true;
    setcookie('token', $token, [
        'expires' => time() + (60 * 60 * 12),
        'path' => '/',
        'domain' => $_ENV['MY_DOMAIN'],
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
}
