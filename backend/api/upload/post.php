<?php

declare(strict_types=1);

/**
 * チャンクのアップロード
 */
function uploadChunk(int $userId): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    try {
        if (!isset($_FILES['chunk'])) {
            throw new HttpException('チャンクが送信されていません', 400);
        }

        $uploadId = $_POST['uploadId'] ?? '';
        $chunkIndex = isset($_POST['chunkIndex']) ? (int)$_POST['chunkIndex'] : null;
        $totalChunks = isset($_POST['totalChunks']) ? (int)$_POST['totalChunks'] : null;

        if (!$uploadId || $chunkIndex === null || $totalChunks === null) {
            throw new HttpException('不正なリクエストです', 400);
        }

        validateUploadId($uploadId);

        if ($chunkIndex < 0) {
            throw new HttpException('chunkIndexは0以上の整数である必要があります', 400);
        }

        if ($totalChunks < 1 || $totalChunks > 100) {
            throw new HttpException('totalChunksの値が不正です', 400);
        }

        $tmpDir = getUploadBaseDir($userId) . "/tmp/{$uploadId}";

        if (!is_dir($tmpDir)) {
            if (!mkdir($tmpDir, 0755, true)) {
                $error = error_get_last();
                throw new HttpException(
                    'フォルダの作成に失敗しました: ' . ($error['message'] ?? '不明な理由'),
                    500
                );
            }
        }

        // チャンクが何分割だったか保存
        $metaPath = "$tmpDir/meta.json";
        if (!file_exists($metaPath)) {
            file_put_contents($metaPath, json_encode([
                'totalChunks' => $totalChunks,
            ]));
        }

        $chunkPath = "$tmpDir/chunk_$chunkIndex";

        if (!move_uploaded_file($_FILES['chunk']['tmp_name'], $chunkPath)) {
            throw new HttpException('チャンク保存に失敗しました', 500);
        }

        http_response_code(200);
        echo json_encode([
            'message' => 'チャンクを保存しました',
            'result' => 'ok',
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


/**
 * チャンクの結合とアップロードの完了
 */
function uploadComplete(int $userId): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    try {
        $inputData = parseJsonInput();
        $uploadId = $inputData['uploadId'] ?? '';
        $originalName = $inputData['fileName'] ?? '';
        $path = $inputData['path'] ?? '';

        if (!$uploadId || !$originalName) {
            throw new HttpException('不正なリクエストです', 400);
        }

        validateUploadId($uploadId);

        if (mb_strlen($originalName) > 255) {
            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => 'ファイル名が長すぎます（255文字以内）',
                    ],
                ],
            ]);
            exit();
        }

        $tmpDir = realpath(getUploadBaseDir($userId) . "/tmp/{$uploadId}");

        if ($tmpDir === false || !is_dir($tmpDir)) {
            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => 'アップロードデータが見つかりません',
                    ],
                ],
            ]);
            exit();
        }

        $uploadDir = getUploadDir($userId, $path);
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        /**
         * 拡張子のチェック
         */
        $dangerousExtensions = ['php', 'php3', 'php4', 'php5', 'phtml', 'htaccess', 'cgi', 'pl', 'sh', 'bat', 'jsp', 'asp', 'aspx', 'phar', 'inc', 'shtml', 'com', 'jar', 'ini'];
        if (in_array($extension, $dangerousExtensions, true)) {
            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => "除外対象の拡張子（{$extension}）のためアップロードできません",
                    ],
                ],
            ]);
            exit();
        }

        /**
         * ファイル名のチェック
         */
        $safeName = basename($originalName);
        // スペース・全角スペース・その他の空白をアンダースコアに置換
        $safeName = preg_replace('/[\s　]+/u', '_', $safeName);
        // サーバー上で禁止されている危険な文字のみ除外
        $safeName = preg_replace('/[\/\\\\:\*\?"<>\|`\x00]/u', '', $safeName);

        // 先頭が . で始まるファイルは弾く
        if (str_starts_with($safeName, '.')) {
            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => '. から始まるファイルはアップロードできません',
                    ],
                ],
            ]);
            exit();
        }

        // 末尾が _thumb で終わるファイルは弾く
        if (str_ends_with(pathinfo($safeName, PATHINFO_FILENAME), '_thumb')) {
            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => '_thumbで終わるファイルはアップロードできません',
                    ],
                ],
            ]);
            exit();
        }

        /**
         * 同名ファイルのリネーム
         */
        $targetPath = $uploadDir . '/' . $safeName;
        $fileNameOnly = pathinfo($safeName, PATHINFO_FILENAME);
        $extension = pathinfo($safeName, PATHINFO_EXTENSION);
        $counter = 1;
        while (file_exists($targetPath)) {
            $safeName = $fileNameOnly . "($counter)." . $extension;
            $targetPath = $uploadDir . '/' . $safeName;
            $counter++;
        }

        /**
         * チャンクの確認と結合
         */
        $chunks = glob("$tmpDir/chunk_*");
        natsort($chunks);

        $metaPath = "$tmpDir/meta.json";
        if (!file_exists($metaPath)) {
            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => 'アップロード情報が不足しています',
                    ],
                ],
            ]);
            exit();
        }

        $meta = json_decode(file_get_contents($metaPath), true);
        $expectedChunks = (int)($meta['totalChunks'] ?? 0);
        $actualChunks = count($chunks);

        // トータルのチャンク数が異なる場合（不完全アップロード）
        if ($actualChunks !== $expectedChunks) {
            // tmpの削除
            cleanupTmp($tmpDir, $chunks, $metaPath);

            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => "チャンクが不足しています（{$actualChunks}/{$expectedChunks}）",
                    ],
                ],
            ]);
            exit();
        }

        // 結合
        $out = fopen($targetPath, 'wb'); // 出力ファイルを作成
        if ($out === false) {
            // tmpの削除
            cleanupTmp($tmpDir, $chunks, $metaPath);

            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => 'ファイル作成に失敗しました',
                    ],
                ],
            ]);
            exit();
        }

        // 各チャンクを順番に結合
        foreach ($chunks as $chunkPath) {
            $in = fopen($chunkPath, 'rb');
            if ($in === false) {
                fclose($out);
                unlink($targetPath);

                // tmpの削除
                cleanupTmp($tmpDir, $chunks, $metaPath);

                http_response_code(200);
                echo json_encode([
                    'result' => [
                        'failedFile' => [
                            'name' => $originalName,
                            'error' => 'チャンク読み込みに失敗しました',
                        ],
                    ],
                ]);
                exit();
            }

            $bytesCopied = stream_copy_to_stream($in, $out);
            if ($bytesCopied === false) {

                fclose($in);
                fclose($out);
                unlink($targetPath);

                // tmpの削除
                cleanupTmp($tmpDir, $chunks, $metaPath);

                http_response_code(200);
                echo json_encode([
                    'result' => [
                        'failedFile' => [
                            'name' => $originalName,
                            'error' => 'チャンク結合中にエラーが発生しました',
                        ],
                    ],
                ]);
                exit();
            }

            fclose($in);
        }

        // 結合成功
        fclose($out);
        chmod($targetPath, 0644);

        /**
         * MIMEタイプチェック
         */
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $targetPath);
        finfo_close($finfo);

        // 除外するMIMEタイプ（python,html,jsは許可）
        $dangerousMimeTypes = [
            'application/x-php',
            'text/x-php',
            'application/x-shellscript',
            'application/x-msdownload',
            'application/x-cgi',
            'application/x-perl',
            'application/x-executable',
            'application/x-sh',
        ];

        if (in_array($mimeType, $dangerousMimeTypes, true)) {
            unlink($targetPath);
            // tmpの削除
            cleanupTmp($tmpDir, $chunks, $metaPath);

            http_response_code(200);
            echo json_encode([
                'result' => [
                    'failedFile' => [
                        'name' => $originalName,
                        'error' => "危険なMIMEタイプ（{$mimeType}）のためアップロードできません",
                    ],
                ],
            ]);
            exit();
        }

        // サムネイル生成（サムネイル非対応の拡張子は除く）
        $thumbUnsupportedExtensions = ['ico'];
        $fileExtension = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
        if (isImageFile($targetPath) && !in_array($fileExtension, $thumbUnsupportedExtensions)) {
            try {
                $thumbPath = $uploadDir . '/' .
                    pathinfo($safeName, PATHINFO_FILENAME) . '_thumb.' .
                    pathinfo($safeName, PATHINFO_EXTENSION);

                createThumbnail($targetPath, $thumbPath, 800);
            } catch (Throwable $e) {
                // throw せずにログのみ
                logError('Thumbnail generation failed: file=' . $safeName . ' ' . $e->getMessage(), $e);
            }
        }

        // tmpの削除
        cleanupTmp($tmpDir, $chunks, $metaPath);

        http_response_code(200);
        echo json_encode([
            'result' => [
                'uploadedFile' => $safeName,
            ],
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


/**
 * 画像ファイルか判定
 */
function isImageFile(string $filePath): bool
{
    $imageInfo = @getimagesize($filePath);
    return $imageInfo !== false;
}


/**
 * サムネイルの作成
 */
function createThumbnail($srcPath, $destPath, $thumbWidth = 600)
{
    $image = new Imagick($srcPath);

    // EXIFを見て正しい向きに自動補正
    $image->autoOrient();

    // 縦横比を保ったままリサイズ
    $image->thumbnailImage($thumbWidth, 0);

    // 保存
    $image->writeImage($destPath);

    $image->clear();
    $image->destroy();

    return true;
}


/**
 * tmpディレクトリの削除
 */
function cleanupTmp(string $tmpDir, array $chunks, string $metaPath): void
{
    foreach ($chunks as $chunkPath) {
        if (file_exists($chunkPath)) {
            unlink($chunkPath);
        }
    }

    if (file_exists($metaPath)) {
        unlink($metaPath);
    }

    if (is_dir($tmpDir)) {
        rmdir($tmpDir);
    }
}
