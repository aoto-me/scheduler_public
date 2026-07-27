<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/post.php');
require_once(__DIR__ . '/patch.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID') && defined('ROUTE_TYPE')) {

    // ROUTE_TYPEが有効な値であることを確認
    if (!in_array(ROUTE_TYPE, ['memo', 'project', 'gallery'])) {
        http_response_code(400);
        echo json_encode(['error' => 'tableTypeが不正です']);
        exit();
    }

    if ($method !== "GET") {
        $inputData = parseJsonInput();
        $target = $inputData['target'] ?? null;
        $type = $inputData['type'] ?? null;
    }

    switch ($method) {
        case 'GET':
            getMenu(USER_ID, ROUTE_TYPE);
            break;
        case 'POST':
            if ($type === 'folder') {
                addFolder(USER_ID, ROUTE_TYPE, $inputData);
            } else {
                addItem(USER_ID, ROUTE_TYPE, $inputData);
            }
            break;
        case 'PATCH':
            if ($target === 'sortTree') {
                sortTree(USER_ID, ROUTE_TYPE, $inputData);
            } elseif ($type === 'folder' && $target === 'edit') {
                renameFolder(USER_ID, ROUTE_TYPE, $inputData);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'targetが不正です']);
                exit();
            }
            break;
        case 'DELETE':
            if ($type === 'folder') {
                deleteFolder(USER_ID, ROUTE_TYPE, $inputData);
            } else {
                deleteItem(USER_ID, ROUTE_TYPE, $inputData);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
