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
            getSection(USER_ID); // ProjectPost.tsx
            break;
        case 'POST':
            addSection(USER_ID); // KanbanBoard.tsx
            break;
        case 'PATCH':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'sort':
                        sortSection(USER_ID, ROUTE_ID, ROUTE_TYPE); // KanbanBoard.tsx
                        break;
                    case 'edit':
                        renameSection(USER_ID, ROUTE_ID, ROUTE_TYPE); // KanbanBoard.tsx > Container.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID')) {
                deleteSection(USER_ID, ROUTE_ID); // KanbanBoard.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
