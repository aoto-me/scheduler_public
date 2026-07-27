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
            if (defined('ROUTE_TYPE') && defined('ROUTE_ID') && ROUTE_TYPE === 'item') {
                getDiaryItem(USER_ID, ROUTE_ID, ROUTE_TYPE); // GalleryPostSubPage.tsx
            } else {
                getDiaryListByPeriod(USER_ID); // DiaryList.tsx
            }
            break;
        case 'POST':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE') && ROUTE_TYPE === 'item') {
                addItem(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageUploader.tsx
            } elseif (ROUTE_TYPE === 'card') {
                addCard(USER_ID, ROUTE_TYPE); // DiaryList.tsx
            }
            break;
        case 'PATCH':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'title':
                    case 'content':
                        uploadDiaryCard(USER_ID, ROUTE_ID, ROUTE_TYPE); // PageTitle.tsx
                        break;
                    case 'file':
                        renameFile(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageSliderWithThumb.tsx
                        break;
                    case 'sortItem':
                        updateSort(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageSliderWithThumb.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_ID') && defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'card':
                        deleteCard(USER_ID, ROUTE_ID, ROUTE_TYPE); // CardDeleteButton.tsx
                        break;
                    case 'item':
                        deleteItem(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageSliderWithThumb.tsx
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
