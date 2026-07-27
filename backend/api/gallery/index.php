<?php

declare(strict_types=1);

require_once(__DIR__ . '/get.php');
require_once(__DIR__ . '/post.php');
require_once(__DIR__ . '/patch.php');
require_once(__DIR__ . '/delete.php');

$method = $_SERVER['REQUEST_METHOD'];

if (defined('USER_ID') && defined('ROUTE_ID')) {
    switch ($method) {
        case 'GET':
            if (defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'type':
                        getGalleryType(USER_ID, ROUTE_ID); // GalleryPost.tsx
                        break;
                    case 'img':
                        getImgList(USER_ID, ROUTE_ID); // ImageLIst.tsx
                        break;
                    case 'card':
                        getCardList(USER_ID, ROUTE_ID); // CardList.tsx
                        break;
                    case 'cardItem':
                        getCardItem(USER_ID, ROUTE_ID); // GalleryPostSubPage.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        case 'POST':
            if (defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'item':
                        addItem(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageUploader.tsx
                        break;
                    case 'card':
                        addCard(USER_ID, ROUTE_ID, ROUTE_TYPE); // CardList.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        case 'PATCH':
            if (defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'title':
                    case 'type':
                        updateGallery(USER_ID, ROUTE_ID, ROUTE_TYPE); // PageTitle.tsx, SelectType.tsx
                        break;
                    case 'cardTitle':
                    case 'cardDate':
                    case 'cardContent':
                        updateCard(USER_ID, ROUTE_ID, ROUTE_TYPE);  // PageTitle.tsx, CardDate.tsx
                        break;
                    case 'file':
                        renameFile(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageLIst.tsx, ImageSliderWithThumb.tsx
                        break;
                    case 'sortItem':
                    case 'sortCard':
                        updateSort(USER_ID, ROUTE_ID, ROUTE_TYPE); // CardList.tsx, ImageLIst.tsx, ImageSliderWithThumb.tsx
                        break;
                    default:
                        break;
                }
            }
            break;
        case 'DELETE':
            if (defined('ROUTE_TYPE')) {
                switch (ROUTE_TYPE) {
                    case 'item':
                        deleteItem(USER_ID, ROUTE_ID, ROUTE_TYPE); // ImageLIst.tsx, ImageSliderWithThumb.tsx
                        break;
                    case 'card':
                        deleteCard(USER_ID, ROUTE_ID, ROUTE_TYPE); // CardDeleteButton.tsx
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
