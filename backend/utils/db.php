<?php

declare(strict_types=1);

function getPdoConnection(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        $_ENV['DB_USER'],
        $_ENV['DB_PASSWORD'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // エラーが起きたときに例外（Exception）を投げる
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // データの取得形式を「連想配列」にする
            PDO::ATTR_EMULATE_PREPARES => false, // DB（MySQLなど）がプリペアドステートメントを処理
        ]
    );

    return $pdo;
}
