<?php

declare(strict_types=1);

/**
 * ログイン
 */
function login(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    try {
        [$userName, $password] = getLoginInput();
        $pdo = getPdoConnection();

        $ip = checkIpRestriction($pdo);

        $user = authenticateUser($pdo, $userName, $password, $ip);

        // セッションIDを再生成
        session_regenerate_id(true);

        // セッションにuserIdとcsrfTokenを格納
        $_SESSION['userId'] = (int)$user['id'];
        $_SESSION['csrfToken'] = bin2hex(random_bytes(32));

        // cookieにJWTを保存
        setJWT($user);

        // deviceIdの確認と登録処理
        ensureDeviceId($pdo, $user);

        http_response_code(200);
        echo json_encode([
            'userId' => $user['id'],
            'userName' => $user['userName'],
            'csrfToken' => $_SESSION['csrfToken'],
            'private' => $user['private']
            ]);
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
}


/**
 * 入力値の取得
 */
function getLoginInput(): array
{
    $data = parseJsonInput();

    $userName = trim($data['userName'] ?? '');
    $password = trim($data['password'] ?? '');

    if ($userName === '' || $password === '') {
        throw new HttpException('ユーザー名またはパスワードが未入力です', 400);
    }

    if (mb_strlen($userName) < 1 || mb_strlen($userName) > 30) {
        throw new HttpException('ユーザー名またはパスワードの形式が不正です', 400);
    }

    if (mb_strlen($password) < 8 || mb_strlen($password) > 30) {
        throw new HttpException('ユーザー名またはパスワードの形式が不正です', 400);
    }

    if (!preg_match('/^[a-zA-Z0-9_\/@-]+$/', $userName) || !preg_match('/^[a-zA-Z0-9_\/@-]+$/', $password)) {
        throw new HttpException('ユーザー名またはパスワードの形式が不正です', 400);
    }

    return [$userName, $password];
}


/**
 * IP制限チェック
 */
function checkIpRestriction(PDO $pdo): string
{
    $ip = $_SERVER['REMOTE_ADDR'];

    // userIPテーブルからIPアドレスを確認
    $ipRecord = getSingleRecord($pdo, 'userIP', ['ip' => $ip]);
    if ($ipRecord === false) {
        throw new HttpException('IPの取得失敗', 500);
    }

    // IPアドレスの存在確認と試行回数の判断
    if ($ipRecord && $ipRecord['count'] >= 5) {
        error_log(sprintf('[IP_BLOCKED] %s ip=%s', date('Y-m-d H:i:s'), $ip));
        throw new HttpException('利用が制限されています', 403);
    }

    // テーブルにIPアドレスが存在しない場合、新規レコードを追加
    if (!$ipRecord) {
        $ok = insertRecord($pdo, 'userIP', ['ip' => $ip, 'count' => 0]);
        if ($ok === false) {
            throw new HttpException('IPの登録失敗', 500);
        }
    }

    return $ip;
}


/**
 * 認証（ユーザー名＋パスワード）
 */
function authenticateUser(PDO $pdo, string $userName, string $password, string $ip): array
{
    $user = getSingleRecord($pdo, 'user', ['userName' => $userName], ['id', 'userName', 'password', 'private', 'mail']);
    if ($user === false) {
        throw new HttpException('ユーザーの取得失敗', 500);
    }

    $dummyHash = '$2y$12$invalidhashfortimingattacknorm00';
    if (!$user) {
        password_verify($password, $dummyHash); // ユーザー不在時も応答時間を均一化
        incrementIpCount($pdo, $ip);
        error_log(sprintf('[AUTH_FAIL] %s user="%s" ip=%s', date('Y-m-d H:i:s'), $userName, $ip));
        throw new HttpException('ユーザー名またはパスワードが不正です', 401);
    }
    if (!password_verify($password, $user['password'])) {
        incrementIpCount($pdo, $ip);
        error_log(sprintf('[AUTH_FAIL] %s user="%s" ip=%s', date('Y-m-d H:i:s'), $userName, $ip));
        throw new HttpException('ユーザー名またはパスワードが不正です', 401);
    }

    // ログインに成功したのでuserIPのカウントをリセット
    resetIpCount($pdo, $ip);

    return $user;
}


/**
 * IPアドレスのカウントを増やす
 */
function incrementIpCount(PDO $pdo, string $ip): void
{
    try {
        $stmt = $pdo->prepare('UPDATE userIP SET count = count + 1 WHERE ip = :ip');
        $stmt->bindParam(':ip', $ip, PDO::PARAM_STR);
        $stmt->execute();
    } catch (Throwable $e) {
        throw new HttpException('IPカウントの更新に失敗', 500, $e);
    }
}


/**
 * IPアドレスのカウントをリセット
 */
function resetIpCount($pdo, $ip): void
{
    try {
        $stmt = $pdo->prepare('UPDATE userIP SET count = 0 WHERE ip = :ip');
        $stmt->bindParam(':ip', $ip, PDO::PARAM_STR);
        $stmt->execute();
    } catch (Throwable $e) {
        throw new HttpException('IPカウントのリセットに失敗', 500, $e);
    }
}
