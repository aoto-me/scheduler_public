<?php

declare(strict_types=1);

/**
 * HTTPレスポンス用の例外クラス
 */
class HttpException extends RuntimeException
{
    private int $statusCode;

    /**
     * new HttpException() されたときに呼ばれるコンストラクタ
     *
     * @param string         $message     エラーメッセージ
     * @param int            $statusCode  HTTPステータスコード
     * @param Throwable|null $previous    元になった例外（あれば）
     */
    public function __construct(
        string $message,
        int $statusCode,
        ?Throwable $previous = null
    ) {
        // 親クラス（RuntimeException）に
        // ・エラーメッセージ
        // ・例外コード（今回は使わないので 0）
        // ・元の例外
        // を渡す
        parent::__construct($message, 0, $previous);

        $this->statusCode = $statusCode;
    }

    // HTTPステータスコードを取得するためのメソッド
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
