<?php

declare(strict_types=1);

function setCorsHeaders()
{
    if (getenv('APP_ENV') === 'development') {
        header('Access-Control-Allow-Origin: http://localhost:5173');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-Token, Authorization, Cache-Control, Pragma');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 3600');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit();
        }
    }
    header('Content-Type: application/json; charset=utf-8');
}
