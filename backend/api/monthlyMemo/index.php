<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/post.php');
require_once(__DIR__ . '/patch.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            getMemo(USER_ID); // Home.tsx
            break;
        case 'POST':
            createMemo(USER_ID); // MonthlyMemoArea.tsx
            break;
        case 'PATCH':
            if (defined('ROUTE_ID')) {
                uploadMemo(USER_ID, ROUTE_ID); // MonthlyMemoArea.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
