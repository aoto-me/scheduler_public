<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/put.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {
    switch ($method) {
        case 'GET':
            if (defined('ROUTE_TYPE')) {
                getSettingByTable(USER_ID, ROUTE_TYPE); // Setting.tsx, Web.tsx
            }
            break;
        case 'PUT':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'incomeCategory':
                    case 'expenseCategory':
                    case 'healthCategory':
                        saveCategory(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    case 'rss':
                        saveRssList(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    case 'yearEvent':
                        saveYearEvent(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    case 'foodDB':
                        saveFoodDB(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    case 'nutrition':
                        saveNutrition(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'incomeCategory':
                    case 'expenseCategory':
                    case 'healthCategory':
                        deleteSettingIfUnused(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    case 'foodDB':
                    case 'yearEvent':
                    case 'rss':
                        deleteSetting(USER_ID, ROUTE_ID, ROUTE_TYPE); // Setting.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
