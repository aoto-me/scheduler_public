<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/post.php');
require_once(__DIR__ . '/patch.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        auth(); // App.tsx
        break;
    case 'POST':
        login(); // Login.tsx
        break;
    case 'PATCH':
        if (defined('USER_ID')) {
            privateModeChange(USER_ID); // Setting.tsx
        }
        break;
    case 'DELETE':
        logout(); // Navigation.tsx
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
