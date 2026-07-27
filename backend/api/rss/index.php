<?php

declare(strict_types=1);

// Web.tsx
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $inputData = parseJsonInput();
        $id = $inputData['id'] ?? null;
        $url = $inputData['url'] ?? null;
        $siteName = $inputData['siteName'] ?? null;

        if (!$id || !$url || !$siteName) {
            throw new HttpException('データが不足しています', 400);
        }

        validatePositiveInt($id, 'id');
        validateUrl($url, 'url');
        validateMaxLength($url, 500, 'url');
        validateUrlNotPrivate($url, 'url');
        validateMaxLength($siteName, 255, 'siteName');

        $result = fetchRSSItems($url, $id, $siteName);

        http_response_code(200);
        echo json_encode([
            'message' => "{$url}:RSSを取得しました",
            'result' => $result
        ]);
    } catch (HttpException $e) {
        $prev = $e->getPrevious();
        if ($prev !== null) {
            logError($prev->getMessage(), $prev);
        }

        http_response_code($e->getStatusCode());
        echo json_encode(['error' => $e->getMessage()]);
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

function fetchOGP($url): string
{
    try {
        $curlOpts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36\r\n',
            CURLOPT_MAXFILESIZE => 2 * 1024 * 1024,
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, $curlOpts);

        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        // 3xx リダイレクトの場合、転送先 URL を再検証してから追跡
        if ($httpCode >= 300 && $httpCode < 400) {
            $redirectUrl = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
            curl_close($ch);
            if (!$redirectUrl) {
                return '';
            }
            try {
                validateUrlNotPrivate($redirectUrl, 'url');
            } catch (HttpException $e) {
                return '';
            }
            $ch = curl_init($redirectUrl);
            curl_setopt_array($ch, $curlOpts);
            $html = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
        } else {
            curl_close($ch);
        }

        // HTTPエラーや空レスポンスは無視して空文字を返す
        if ($html === false || $httpCode >= 400) {
            return '';
        }

        // HTMLの中からOGPのmetaタグを探す
        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $matches)) {
            return $matches[1]; // 見つかったら 画像URLだけ返す
        }
        return '';
    } catch (Throwable $e) {
        return ''; // 処理できなかった場合は空文字にする
    }
}

function normalizePubDate(string $rawDate): string
{
    try {
        $date = new DateTime($rawDate);
        return $date->format(DateTime::ATOM); // ISO 8601形式: "2025-07-15T00:36:18+00:00"
    } catch (Throwable $e) {
        return ''; // 変換できなかった場合は空文字にする
    }
}

function fetchRSSItems($url, $id, $siteName)
{
    $ch = curl_init($url);
    $curlOpts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36\r\n',
        CURLOPT_MAXFILESIZE => 5 * 1024 * 1024,
    ];
    curl_setopt_array($ch, $curlOpts);

    // 通信を実行し、取得したRSSの中身を変数に入れる
    $rssContent = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    // 3xx リダイレクトの場合、転送先 URL を再検証してから追跡
    if ($httpCode >= 300 && $httpCode < 400) {
        $redirectUrl = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        curl_close($ch);
        if ($redirectUrl) {
            try {
                validateUrlNotPrivate($redirectUrl, 'url');
            } catch (HttpException $e) {
                return ['id' => $id, 'items' => []];
            }
            $ch = curl_init($redirectUrl);
            curl_setopt_array($ch, $curlOpts);
            $rssContent = curl_exec($ch);
        } else {
            return ['id' => $id, 'items' => []];
        }
    }

    // RSS取得に失敗したら、空データを返して処理を終わる
    if ($rssContent === false) {
        curl_close($ch);
        return ['id' => $id, 'items' => []];
    }

    curl_close($ch);

    // RSS（XMLの文字列）を読み込んで、SimpleXMLElement に変換
    $rss = @simplexml_load_string($rssContent, 'SimpleXMLElement', LIBXML_NOCDATA);
    if (!$rss) {
        return ['id' => $id, 'items' => []];
    }

    $entries = [];
    // RSS 2.0（一般的）⇒ 記事は item
    // Atom（RSSの別規格）⇒ 記事は entry
    if (isset($rss->channel->item)) {
        $entries = $rss->channel->item;
    } elseif (isset($rss->entry)) {
        $entries = $rss->entry;
    }

    $items = [];

    $count = 0;
    // 15件のデータを取得
    foreach ($entries as $entry) {
        if ($count >= 15) {
            break;
        }

        $title = (string)($entry->title ?? '');
        $link = (string)($entry->link['href'] ?? $entry->link ?? '');
        $pubDate = (string)($entry->pubDate ?? $entry->updated ?? '');
        $description = (string)($entry->description ?? $entry->summary ?? '');
        $namespaces = $entry->getNamespaces(true);
        $ogp = '';

        try {
            // 1. media:thumbnail があれば その url 属性を取得
            if (isset($namespaces['media'])) {
                $media = $entry->children($namespaces['media']);
                if (isset($media->thumbnail)) {
                    $ogp = (string)$media->thumbnail->attributes()->url;
                }
            }

            // 2. media が無い場合、enclosure から取れるか試す
            if (!$ogp && isset($entry->enclosure)) {
                $ogp = (string)$entry->enclosure['url'];
            }

            // 3. 記事ページから直接取得
            if (!$ogp && $link) {
                try {
                    validateUrlNotPrivate($link, 'link');
                    $ogp = fetchOGP($link);
                } catch (HttpException $e) {
                    $ogp = '';
                }
            }
        } catch (Throwable $e) {
            // 例外を無視してループを継続
            logError("fetchOGP failed for {$link}: " . $e->getMessage(), $e);
            $ogp = '';
        }

        $items[] = [
            'title' => $title,
            'id' => $id,
            'link' => $link,
            'pubDate' => normalizePubDate($pubDate),
            'description' => $description,
            'ogp' => $ogp ?: '',
            'siteName' => $siteName,
        ];

        $count++;
    }

    return ['id' => $id, 'items' => $items];
}
