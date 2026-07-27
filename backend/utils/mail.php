<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

/**
 * ログインユーザーにメールを送信する
 */
function sendMail(string $userEmail, string $userName): void
{
    if (!filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
        return;
    }

    try {
        $mail = new PHPMailer(true);
        $myAddress = $_ENV['MY_MAIL'];
        $myMailPass = $_ENV['MY_MAILPASS'];
        $myMailHost = $_ENV['MY_MAILHOST'];
        $siteURL = $_ENV['MY_ORIGIN'];

        $ip = htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? '不明', ENT_QUOTES, 'UTF-8');
        $loginTime = (new DateTime('now', new DateTimeZone('Asia/Tokyo')))->format('Y-m-d H:i:s');
        $userAgent = htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? '不明', ENT_QUOTES, 'UTF-8');

        // サーバー設定
        $mail->isSMTP();
        $mail->Host = $myMailHost;
        $mail->SMTPAuth = true;
        $mail->Username = $myAddress;
        $mail->Password = $myMailPass;
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        // 文字のエンコーディング
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        // 送信元・宛先
        $mail->setFrom($myAddress, 'スケジュールアプリ');
        $mail->addAddress($userEmail, $userName);

        // メール内容
        $mail->isHTML(true);
        $mail->Subject = '【スケジュールアプリ】新しいデバイスからログインがありました';
        $mail->Body = nl2br("
            ユーザー：{$userName}

            あなたのアカウントに新しいデバイスからのログインがありました。

            ■ ログイン情報
            URL：{$siteURL}
            日時：{$loginTime}
            IPアドレス：{$ip}
            端末情報：{$userAgent}

            下記のケースに当てはまる場合に、このメールは送信されます。
            心当たりがない場合は、管理者までご連絡ください。

            ・新規のデバイスでログインした
            ・普段と違うブラウザでログインした
            ・ブラウザのCookieやキャッシュを削除した
            ・手動でのログアウト後から初回のログインだった
            ");

        $mail->AltBody = <<<EOT
            ユーザー：{$userName}

            あなたのアカウントに新しいデバイスからのログインがありました。

            ■ ログイン情報
            URL：{$siteURL}
            日時：{$loginTime}
            IPアドレス：{$ip}
            端末情報：{$userAgent}

            下記のケースに当てはまる場合に、このメールは送信されます。
            心当たりがない場合は、管理者までご連絡ください。

            ・新規のデバイスでログインした
            ・普段と違うブラウザでログインした
            ・ブラウザのCookieやキャッシュを削除した
            ・手動でのログアウト後から初回のログインだった
            EOT;

        $mail->send();
    } catch (Throwable $e) {
        // throw せずにログのみ
        error_log(
            date('Y-m-d H:i:s') . ' ' .
            __FILE__ . ':' . __LINE__ . ' ' .
            '[MAIL_FAIL] user=' . $userEmail . ' ' .
            $e->getMessage() . "\n" .
            $e->getTraceAsString()
        );
    }
}
