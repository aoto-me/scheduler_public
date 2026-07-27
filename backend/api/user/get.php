<?php

declare(strict_types=1);

/**
 * 認証
 */
function auth(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        return;
    }

    try {
        $user_JWT = getUserFromJWT();

        $pdo = getPdoConnection();

        // userIdとuserNameが一致するユーザー情報取得
        $user = getSingleRecord($pdo, 'user', ['id' => $user_JWT['userId'], 'userName' => $user_JWT['userName']], ['id', 'userName', 'private']);
        if ($user === false) {
            throw new HttpException('ユーザーの取得失敗', 500);
        }

        if ($user) {
            // セッションにユーザー情報とCSRFトークンを格納
            $_SESSION['userId'] = $_SESSION['userId'] ?? (int)$user_JWT['userId'];
            $_SESSION['csrfToken'] = $_SESSION['csrfToken'] ?? bin2hex(random_bytes(32));

            // cookieにdeviceIdがあれば、このユーザーとdeviceIdの組み合わせが存在するか確認
            $isDevice = checkDeviceId($pdo, $user['id']);
            if (!$isDevice) {
                throw new HttpException('デバイスIDが不正です', 401);
            }

            // 認証成功
            http_response_code(200);
            echo json_encode([
                'userId' => $user['id'],
                'userName' => $user['userName'],
                'csrfToken' => $_SESSION['csrfToken'],
                'private' => $user['private']
                ]);
        } else {
            // 認証失敗
            throw new HttpException('ユーザーが存在しません', 401);
        }
    } catch (HttpException $e) {
        $prev = $e->getPrevious();
        if ($prev !== null) {
            logError($prev->getMessage(), $prev);
        }

        http_response_code($e->getStatusCode());
        $clientMessage = ($e->getStatusCode() >= 500 && getenv('APP_ENV') !== 'development') ? 'サーバーエラーが発生しました' : $e->getMessage();
        echo json_encode(['error' => $clientMessage]);
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
