<?php

declare(strict_types=1);

/**
 * galleryのtypeを取得
 * 'img' | 'card' | 'unselect'
 */
function getGalleryType(int $userId, int $id): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "gallery";

        $result = getSingleRecord($pdo, $table, ['user' => $userId, 'id' => $id]);
        if ($result === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return ['result' => $result['type']];
    });
}


/**
 * imgタイプのページの画像一覧を取得
 */
function getImgList(int $userId, int $id): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "galleryItem";

        $result = getRecordsByCondition($pdo, $table, ['user' => $userId, 'galleryId' => $id], ['id', 'galleryId', 'cardId', 'sort', 'file']);
        if ($result === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }
        return ['result' => $result];
    });
}


/**
 * cardタイプのページのカード一覧とサムネイルを取得
 */
function getCardList(int $userId, int $id): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "galleryCard";
        $itemTable = "galleryItem";

        $cards = getRecordsByCondition($pdo, $table, ['galleryId' => $id, 'user' => $userId], [
            'id',
            'galleryId',
            'title',
            'date',
            'updated',
            'sort'
        ]);

        if ($cards === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }

        // サムネイルを取得
        $query = "
            SELECT cardId, file
            FROM (
                SELECT cardId, file, ROW_NUMBER() OVER (PARTITION BY cardId ORDER BY sort ASC, id ASC) AS row_num
                FROM {$itemTable}
                WHERE galleryId = :galleryId AND user = :userId
            ) AS ranked
            WHERE row_num = 1
            ";

        // クエリを実行
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            'galleryId' => $id,
            'userId' => $userId,
        ]);

        $thumb = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['result' => [
                        'card' => $cards,
                        'thumb' => $thumb
                        ]];
    });
}

/**
 * 対象のcardを取得
 */
function getCardItem(int $userId, int $id): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $id) {
        $table = "galleryCard";
        $itemTable = "galleryItem";

        $card = getSingleRecord($pdo, $table, ['id' => $id, 'user' => $userId]);
        if ($card === false) {
            throw new HttpException("{$table}：データを取得できませんでした", 500);
        }
        if ($card === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }
        $content = $card['content'];

        $items = getRecordsByCondition($pdo, $itemTable, ['cardId' => $id, 'user' => $userId], ['id', 'galleryId', 'cardId', 'sort', 'file']);
        if ($items === false) {
            throw new HttpException("{$itemTable}：データを取得できませんでした", 500);
        }

        return ['result' => [
                    'content' => $content,
                    'item' => $items
                    ]];

    });
}
