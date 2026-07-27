<?php

declare(strict_types=1);

require_once(__DIR__ . '/post.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID') && defined('ROUTE_TYPE')) {

    switch ($method) {
        case 'POST':
            switch (ROUTE_TYPE) {
                case 'chunk':
                    uploadChunk(USER_ID);
                    break;
                case 'complete':
                    uploadComplete(USER_ID);
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
}
