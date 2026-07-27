<?php

declare(strict_types=1);

require_once(__DIR__ . '/mail.php');

/**
 * デバイスIDの登録状態の確認と処理
 */
function ensureDeviceId(PDO $pdo, array $user): void
{
    $cookieName = "deviceId";
    if (!isset($_COOKIE[$cookieName])) {
        // 初回ログインであれば、新規のデバイスIDをcookieとDBに登録する
        insertDeviceId($pdo, $user['id'], $cookieName);
        // テスト環境でなければ、メールを送信
        if (getenv('APP_ENV') !== 'development') {
            sendMail($user['mail'], $user['userName']);
        }
    } else {
        // cookieにdeviceIdがあれば、このユーザーとdeviceIdの組み合わせが存在するか確認
        $isDevice = checkDeviceId($pdo, $user['id']);
        // 登録がなければ、新規のdeviceIdをデータベースに登録する
        if (!$isDevice) {
            insertDeviceId($pdo, $user['id'], $cookieName);
            if (getenv('APP_ENV') !== 'development') {
                sendMail($user['mail'], $user['userName']);
            }
        }
    }
}


/**
 * デバイスID と userId のチェック
 */
function checkDeviceId(PDO $pdo, int $userId): bool
{
    $deviceId = $_COOKIE['deviceId'] ?? null;

    if (!$deviceId || !$userId) {
        throw new HttpException('デバイスIDが不正です', 401);
    }

    try {
        // ユーザーとdeviceIdの組み合わせが存在するか確認
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM userDevice WHERE `user` = :user AND deviceId = :deviceId');
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':deviceId', $deviceId, PDO::PARAM_STR);
        $stmt->execute();
        $count = $stmt->fetchColumn();
    } catch (Throwable $e) {
        throw new HttpException('デバイスIDの確認中に失敗', 500, $e);
    }

    return $count > 0;
}


/**
 * デバイスIDを新規保存
 */
function insertDeviceId(PDO $pdo, int $userId, string $cookieName): void
{
    try {
        // デバイスIDを生成
        $deviceId = bin2hex(random_bytes(16));

        // cookieに保存
        $secure = (getenv('APP_ENV') === 'development') ? false : true;
        setcookie($cookieName, $deviceId, [
            'expires' => time() + (10 * 365 * 24 * 60 * 60), // 10年
            'path' => '/',
            'domain' => $_ENV['MY_DOMAIN'],
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        // 初回生成なので、DBに $deviceId と $userId を保存
        $stmt = $pdo->prepare('INSERT INTO userDevice (user, deviceId) VALUES (:user, :deviceId)');
        $stmt->bindParam(':user', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':deviceId', $deviceId, PDO::PARAM_STR);
        $stmt->execute();
    } catch (Throwable $e) {
        throw new HttpException('デバイスIDの登録に失敗', 500, $e);
    }
}
