<?php

declare(strict_types=1);

/**
 * エラーログの出力
 */
function logError(string $message, ?Throwable $e = null): void
{
    $log = sprintf(
        '%s ip=%s uri=%s method=%s userId=%s %s',
        date('Y-m-d H:i:s'),
        $_SERVER['REMOTE_ADDR'] ?? '-',
        $_SERVER['REQUEST_URI'] ?? '-',
        $_SERVER['REQUEST_METHOD'] ?? '-',
        defined('USER_ID') ? USER_ID : '-',
        $message
    );

    if ($e) {
        $log .= "\n" . $e->getTraceAsString();
    }

    error_log($log);
}
