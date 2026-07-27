<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/patch.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE') && ROUTE_TYPE === 'todo') {
                getTodosByProject(USER_ID, ROUTE_ID, ROUTE_TYPE); // ProjectPost.tsx
            } elseif (defined('ROUTE_ID')) {
                getProject(USER_ID, ROUTE_ID); // ProjectPost.tsx
            }
            break;
        case 'PATCH':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                updateProject(USER_ID, ROUTE_ID, ROUTE_TYPE); // PageTitle.tsx, EndDate.tsx, BlockEditor.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
