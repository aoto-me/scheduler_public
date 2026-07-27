<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/put.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            getHealthDataByPeriod(USER_ID); // Home.tsx, Health.tsx
            break;
        case 'PUT':
            if (defined('ROUTE_ID')) {
                updateHealthData(USER_ID, ROUTE_ID); // HealthForm.tsx
            } else {
                insertHealthData(USER_ID); // HealthForm.tsx
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID')) {
                deleteHealthData(USER_ID, ROUTE_ID); // HealthForm.tsx, Table.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
