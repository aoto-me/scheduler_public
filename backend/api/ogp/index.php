<?php

declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $url = filter_var($_GET['url'], FILTER_VALIDATE_URL);

        if (!$url) {
            http_response_code(200);
            echo json_encode([
                'message' => 'urlが不正です',
                'result' => [
                    'title' => null,
                    'description' => null,
                    'image' => null,
                    'url' => null,
                ]
            ]);
            return;
        }
        validateMaxLength($url, 500, 'url');
        validateUrlNotPrivate($url, 'url');

        // URLにアクセスしてHTMLを取得
        $httpOpts = [
            'method' => "GET",
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36\r\n",
            'timeout' => 10,
            'follow_location' => 0,
        ];
        $context = stream_context_create(['http' => $httpOpts]);
        $html = @file_get_contents($url, false, $context, 0, 2 * 1024 * 1024);

        // 3xx リダイレクトの場合、転送先 URL を再検証してから追跡
        if (isset($http_response_header) && preg_match('/^HTTP\/\d+\.\d+\s+3\d{2}/', $http_response_header[0])) {
            $redirectUrl = null;
            foreach ($http_response_header as $header) {
                if (preg_match('/^Location:\s*(.+)$/i', $header, $m)) {
                    $redirectUrl = trim($m[1]);
                    break;
                }
            }
            if ($redirectUrl) {
                validateUrlNotPrivate($redirectUrl, 'url');
                $context = stream_context_create(['http' => $httpOpts]);
                $html = @file_get_contents($redirectUrl, false, $context, 0, 2 * 1024 * 1024);
            } else {
                $html = false;
            }
        }

        if ($html === false) {
            http_response_code(200);
            echo json_encode([
                'message' => 'HTMLを解析できませんでした',
                'result' => [
                    'title' => null,
                    'description' => null,
                    'image' => null,
                    'url' => null,
                ]
            ]);
            return;
        }

        // 文字コードの検出と変換
        $encoding = mb_detect_encoding($html, ['UTF-8', 'SJIS', 'EUC-JP', 'ISO-2022-JP'], true); // HTMLの本当の文字コードを調べる
        if ($encoding && strtoupper($encoding) !== 'UTF-8') {
            $html = mb_convert_encoding($html, 'HTML-ENTITIES', $encoding);
        }

        // DOM解析(DOMDocumentに読み込ませるときにUTF-8として宣言しておく)
        libxml_use_internal_errors(true);
        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD); // UTF-8に統一したのでDOMDocumentの読み込み前にUTF-8を明示
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);
        $metaTags = $xpath->query('//meta');

        $ogp = [];

        foreach ($metaTags as $tag) {
            /** @var DOMElement $tag */
            if ($tag->hasAttribute('property')) {
                $property = $tag->getAttribute('property');
                if (strpos($property, 'og:') === 0) {
                    $content = $tag->getAttribute('content');
                    $ogp[$property] = $content;
                }
            }
        }

        http_response_code(200);
        echo json_encode([
            'message' => 'OGPを取得しました',
            'result' => [
                'title' => $ogp['og:title'] ?? null,
                'description' => $ogp['og:description'] ?? null,
                'image' => $ogp['og:image'] ?? null,
                'url' => $url, // $ogp['og:url'] だと'/'だけになるサイトがあるため$urlをそのまま戻す
            ]
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
