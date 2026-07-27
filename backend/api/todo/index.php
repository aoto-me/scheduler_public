<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/put.php');
require_once(__DIR__ . '/patch.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID')) {

    switch ($method) {
        case 'GET':
            getTodosByPeriod(USER_ID); // Home.tsx
            break;
        case 'PUT':
            if (defined('ROUTE_ID')) {
                updateTodo(USER_ID, ROUTE_ID); // TodoForm.tsx
            } else {
                insertTodo(USER_ID); // TodoForm.tsx
            }
            break;
        case 'PATCH':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                if (ROUTE_TYPE === 'completed') {
                    toggleCompleted(USER_ID, ROUTE_ID, ROUTE_TYPE); // TodoCard.tsx
                } elseif (ROUTE_TYPE === 'startAndEnd') {
                    updateStartAndEnd(USER_ID, ROUTE_ID, ROUTE_TYPE); // Calendar.tsx
                }
            } elseif (defined('ROUTE_TYPE') && ROUTE_TYPE === 'sort') {
                sortTodo(USER_ID, ROUTE_TYPE); // KanbanBoard.tsx
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID')) {
                if (defined('ROUTE_TYPE') && ROUTE_TYPE === "taskTime") {
                    deleteTaskTime(USER_ID, ROUTE_ID, ROUTE_TYPE); // TodoForm.tsx
                } else {
                    deleteTodo(USER_ID, ROUTE_ID); // TodoForm.tsx
                }
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
}
