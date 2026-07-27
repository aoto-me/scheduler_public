<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/patch.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            if (defined('ROUTE_ID')) {
                getMemo(USER_ID, ROUTE_ID); // MemoPost.tsx
            }
            break;
        case 'PATCH':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                updateMemo(USER_ID, ROUTE_ID, ROUTE_TYPE);  // PageTitle.tsx, BlockEditor.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
