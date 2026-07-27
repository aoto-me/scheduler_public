<?php

declare(strict_types=1);

if (defined('USER_ID')) {

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    try {
        $userId = USER_ID;
        $inputData = parseJsonInput();
        $path = $inputData['path'] ?? "";
        $files = $inputData['files'] ?? null;

        $missingFields = [];
        if (!$path) {
            $missingFields[] = 'path';
        }
        if (!is_array($files) || empty($files)) {
            $missingFields[] = 'files';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        $uploadDir = getUploadDir($userId, $path);

        $failedFiles = [];
        $validFiles = [];

        foreach ($files as $file) {
            $name = $file['name'] ?? null;
            $extension = $file['extension'] ?? null;

            $missingFields = [];
            if (!$name) {
                $missingFields[] = 'name';
            }
            if ($extension === null) {
                $missingFields[] = 'extension';
            }

            if (!empty($missingFields)) {
                $failedFiles[] = [
                    'name' => $name ?? 'unknown',
                    'extension' => $extension ?? '',
                    'message' => 'データが不足しています: ' . implode(', ', $missingFields)
                ];
                continue;
            }

            $formattedExtension = $extension !== '' ? '.' . $extension : '';
            $filePath = $uploadDir . '/' . $name . $formattedExtension;

            $realFilePath = realpath($filePath);
            if ($realFilePath === false || strpos($realFilePath, $uploadDir) !== 0) {
                $failedFiles[] = [
                    'name' => $name,
                    'extension' => $extension,
                    'message' => "不正なファイルパスです"
                ];
                continue;
            }

            if (!is_file($filePath)) {
                $failedFiles[] = [
                    'name' => $name,
                    'extension' => $extension,
                    'message' => "ファイルが存在しません"
                ];
                continue;
            }

            $validFiles[] = [
                'path' => $realFilePath,
                'name' => $name . $formattedExtension,
                'extension' => $extension,
                ];
        }

        if (!empty($failedFiles)) {
            // 成功で返して、フロント側でエラー処理をする
            http_response_code(200);
            echo json_encode([
                'message' => '一部ファイルがダウンロードできません',
                'result' => $failedFiles
            ]);
            exit();
        }

        if (empty($validFiles)) {
            throw new HttpException('ダウンロード可能なファイルがありません', 400);
        }

        set_time_limit(0);

        // 合計サイズチェック（300MB）
        $totalSize = 0;
        foreach ($validFiles as $file) {
            $totalSize += filesize($file['path']);
        }

        if ($totalSize > 300 * 1024 * 1024) {
            throw new HttpException('合計サイズが大きすぎます（300MBまで）', 400);
        }

        // ZIPファイルを作るためのクラス
        $zip = new ZipArchive();

        $zipDir = getUploadBaseDir($userId) . '/tmp_zip';
        if (!is_dir($zipDir)) {
            mkdir($zipDir, 0755, true);
        }

        $zipFileName = 'download_' . bin2hex(random_bytes(8)) . '.zip';
        $zipPath = $zipDir . '/' . $zipFileName;

        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            throw new HttpException('ZIPファイルの作成に失敗しました', 500);
        }

        foreach ($validFiles as $file) {
            $zip->addFile($file['path'], $file['name']);
            $zip->setCompressionName($file['name'], ZipArchive::CM_STORE);
        }

        $zip->close();

        // ダウンロードファイルを返す
        http_response_code(200);
        echo json_encode([
            'zipFileName' => $zipFileName
        ]);
        exit();
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
