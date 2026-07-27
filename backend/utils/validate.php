<?php

declare(strict_types=1);

/**
 * リクエストボディをJSONとしてパースして返す
 */
function parseJsonInput(): array
{
    $requestBody = file_get_contents('php://input');
    $data = json_decode($requestBody, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new HttpException('リクエストボディが不正なJSON形式です', 400);
    }

    return $data ?? [];
}


/**
 * 日付フォーマット検証（Y-m-d）
 */
function validateDate(string $value, string $field): void
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        throw new HttpException("{$field}の日付形式が不正です（YYYY-MM-DD）", 400);
    }

    $dt = DateTime::createFromFormat('Y-m-d', $value);
    if (!$dt || $dt->format('Y-m-d') !== $value) {
        throw new HttpException("{$field}は存在しない日付です", 400);
    }
}

/**
 * 日時フォーマット検証（"Y-m-d H:i" または "Y-m-d H:i:s" 形式）
 */
function validateDatetime(string $value, string $field): void
{
    $formats = ['Y-m-d H:i:s', 'Y-m-d H:i'];
    foreach ($formats as $format) {
        $dt = DateTime::createFromFormat($format, $value);
        if ($dt && $dt->format($format) === $value) {
            return;
        }
    }
    throw new HttpException("{$field}の日時形式が不正です", 400);
}

/**
 * 文字列の最大長チェック
 */
function validateMaxLength(string $value, int $max, string $field): void
{
    if (mb_strlen($value) > $max) {
        throw new HttpException("{$field}は{$max}文字以内で入力してください", 400);
    }
}

/**
 * 正の整数チェック（1以上）
 */
function validatePositiveInt(mixed $value, string $field): void
{
    if (!is_int($value) || $value <= 0) {
        throw new HttpException("{$field}は正の整数である必要があります", 400);
    }
}

/**
 * 0以上の数値チェック（小数点可）
 */
function validateNonNegativeNumber(mixed $value, string $field): void
{
    if (!is_numeric($value) || $value < 0) {
        throw new HttpException("{$field}は0以上の数値である必要があります", 400);
    }
}

/**
 * URL形式チェック
 */
function validateUrl(string $value, string $field): void
{
    if (filter_var($value, FILTER_VALIDATE_URL) === false) {
        throw new HttpException("{$field}のURL形式が不正です", 400);
    }
}

/**
 * 時間フォーマット検証（HH:MM または HH:MM:SS）
 */
function validateTime(string $value, string $field): void
{
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $value)) {
        throw new HttpException("{$field}の時間形式が不正です（HH:MM または HH:MM:SS）", 400);
    }
}

/**
 * プライベートIPへのアクセスをブロック（SSRF対策）
 */
function validateUrlNotPrivate(string $url, string $field): void
{
    $scheme = parse_url($url, PHP_URL_SCHEME);
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new HttpException("{$field}のURLはhttp/httpsのみ指定できます", 400);
    }

    $host = parse_url($url, PHP_URL_HOST);
    if ($host === false || $host === null) {
        throw new HttpException("{$field}のURL形式が不正です", 400);
    }

    // 10進数（2130706433）や16進数（0x7f000001）エンコードされたIPリテラルをブロック
    // gethostbyname() はこれらをそのまま返すが、curl等のHTTPクライアントは127.0.0.1等として接続するため
    if (preg_match('/^(0x[0-9a-fA-F]+|[0-9]+)$/i', $host)) {
        throw new HttpException("{$field}に内部ネットワークのURLは指定できません", 403);
    }

    $ip = gethostbyname($host);
    $privatePatterns = [
        '/^127\./', // localhost（PHP自身）
        '/^10\./', // Docker内部ネットワーク
        '/^172\.(1[6-9]|2\d|3[01])\./', // Dockerのデフォルトブリッジネットワーク
        '/^192\.168\./', // ローカルネットワーク
        '/^169\.254\./', // リンクローカル（クラウドのメタデータサーバー等）
        '/^::1$/', // IPv6 localhost
        '/^0\./', // 不正なアドレス
    ];
    foreach ($privatePatterns as $pattern) {
        if (preg_match($pattern, $ip)) {
            throw new HttpException("{$field}に内部ネットワークのURLは指定できません", 403);
        }
    }
}

/**
 * uploadId のサニタイズチェック（英数字・ハイフンのみ許容）
 */
function validateUploadId(string $value): void
{
    if (!preg_match('/^[a-zA-Z0-9\-]+$/', $value)) {
        throw new HttpException('不正なuploadIdです', 400);
    }
}

/**
 * Tiptapのコンテンツ検証（base64デコード後のJSON文字列）
 */
function validateTiptapContent(string $value, string $field): void
{
    json_decode($value);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new HttpException("{$field}のJSON形式が不正です", 400);
    }
}
