<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/put.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            if (defined('ROUTE_TYPE') && ROUTE_TYPE === 'standard') {
                getFoodDBStandard(); // useFetchCsv.ts
            } else {
                getFoodDataByPeriod(USER_ID); // Home.tsx, Health.tsx
            }
            break;
        case 'PUT':
            if (defined('ROUTE_ID')) {
                updateFoodData(USER_ID, ROUTE_ID); // FoodForm.tsx
            } else {
                insertFoodData(USER_ID); // FoodForm.tsx
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID')) {
                deleteFoodData(USER_ID, ROUTE_ID); // FoodForm.tsx, Table.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
