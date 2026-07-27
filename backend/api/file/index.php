<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/post.php');
require_once(__DIR__ . '/patch.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    try {
        $userId = USER_ID;
        if ($method === 'GET') {
            $path = $_GET['path'] ?? '';
        } else {
            $inputData = parseJsonInput();
            $target = $inputData['target'] ?? null;
            $path = $inputData['path'] ?? '';
        }

        if ($path !== '') {
            $path = rtrim($path, '/') . '/';
        }

        $uploadDir = getUploadDir($userId, $path);

        switch ($method) {
            case 'GET':
                switch (ROUTE_TYPE) {
                    case 'directories':
                        getDirectories($uploadDir); // FileDrawerContent.tsx
                        break;
                    case 'folder':
                        getFolderItems(USER_ID, $uploadDir, $path); // FilePost.tsx, ProjectPost.tsx, MemoPost.tsx
                        break;
                    case 'search':
                        searchFolderItems(USER_ID, $uploadDir); // FileIndex.tsx
                        break;
                    default:
                        break;
                }
                break;
            case 'POST':
                if (defined('ROUTE_TYPE') && ROUTE_TYPE === 'folder') {
                    createFolder($uploadDir, $inputData); // FileDrawerHeader.tsx
                }
                break;
            case 'PATCH':
                switch (ROUTE_TYPE) {
                    case 'folder':
                        renameFolder($uploadDir, $inputData); // FolderName.tsx
                        break;
                    case 'file':
                        renameFile(USER_ID, $uploadDir, $inputData); // FileGrid.tsx
                        break;
                    default:
                        break;
                }
                break;
            case 'DELETE':
                switch (ROUTE_TYPE) {
                    case 'folder':
                        deleteFolder($uploadDir, $inputData); // FolderName.tsx
                        break;
                    case 'file':
                        deleteFile($uploadDir, $inputData); // FileGrid.tsx
                        break;
                    case 'files':
                        deleteFiles($uploadDir, $inputData); // FileGrid.tsx
                        break;
                    default:
                        break;
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method Not Allowed']);
                break;
        }
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
