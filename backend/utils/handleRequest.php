<?php

declare(strict_types=1);

require_once(__DIR__ . '/log.php');

/**
 * GETによる取得処理
 */
function handleGetRequest(callable $callback): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        return;
    }

    $pdo = null;
    try {
        $pdo = getPdoConnection();

        $result = $callback($pdo);

        http_response_code(200);
        echo json_encode($result);

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
 * PUTによる保存・更新処理
 */
function handlePutRequest(callable $callback): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        return;
    }

    $pdo = null;
    try {
        $pdo = getPdoConnection();
        $pdo->beginTransaction();

        $result = $callback($pdo);
        $pdo->commit();

        http_response_code(200);
        echo json_encode($result);
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
    } finally {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}


/**
 * PATCHによる保存・更新処理
 */
function handlePatchRequest(callable $callback): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
        return;
    }

    $pdo = null;
    try {
        $pdo = getPdoConnection();
        $pdo->beginTransaction();

        $result = $callback($pdo);
        $pdo->commit();

        http_response_code(200);
        echo json_encode($result);
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
    } finally {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}


/**
 * POSTによる保存処理
 */
function handlePostRequest(callable $callback): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    $pdo = null;
    try {
        $pdo = getPdoConnection();
        $pdo->beginTransaction();

        $result = $callback($pdo);
        $pdo->commit();

        http_response_code(200);
        echo json_encode($result);
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
    } finally {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}


/**
 * DELETEによる削除処理
 */
function handleDeleteRequest(callable $callback): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        return;
    }

    $pdo = null;
    try {
        $pdo = getPdoConnection();
        $pdo->beginTransaction();

        $result = $callback($pdo);
        $pdo->commit();

        http_response_code(200);
        echo json_encode($result);
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
    } finally {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}
