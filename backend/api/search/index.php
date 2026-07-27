<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID') && defined('ROUTE_TYPE')) {

    switch ($method) {
        case 'GET':
            getSearch(USER_ID, ROUTE_TYPE); // MemoIndex.tsx, ProjectIndex.tsx
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
