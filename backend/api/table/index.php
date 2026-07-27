<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/post.php');
require_once(__DIR__ . '/patch.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {

    switch ($method) {
        case 'GET':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                getTable(USER_ID, ROUTE_ID, ROUTE_TYPE); // MemoPost.tsx, ProjectPost.tsx
            }
            break;
        case 'POST':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                addTable(USER_ID, ROUTE_ID, ROUTE_TYPE); // MemoPost.tsx, ProjectPost.tsx
            }
            break;
        case 'PATCH':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                updateTable(USER_ID, ROUTE_ID, ROUTE_TYPE);  // MemoPost.tsx, ProjectPost.tsx
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                deleteTable(USER_ID, ROUTE_ID, ROUTE_TYPE);  // MemoPost.tsx, ProjectPost.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
