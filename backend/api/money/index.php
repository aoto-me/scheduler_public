<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/put.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            getMoneyDataByPeriod(USER_ID); // Home.tsx, Money.tsx
            break;
        case 'PUT':
            if (defined('ROUTE_ID')) {
                updateMoneyData(USER_ID, ROUTE_ID); // MoneyForm.tsx
            } else {
                insertMoneyData(USER_ID); // MoneyForm.tsx
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID')) {
                deleteMoneyData(USER_ID, ROUTE_ID); // MoneyForm.tsx
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
