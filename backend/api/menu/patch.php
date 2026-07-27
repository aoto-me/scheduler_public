<?php

declare(strict_types=1);

/**
 * ツリー全体のソートを一括更新
 */
function sortTree(int $userId, string $table, array $inputData): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $table, $inputData) {
        $nodes = $inputData['nodes'] ?? null;

        if (!is_array($nodes) || empty($nodes)) {
            throw new HttpException('データが不足しています: nodes', 400);
        }

        $folderTable = "{$table}Folder";
        $itemOrderTable = "{$table}Order";

        foreach ($nodes as $node) {
            $nodeType = $node['nodeType'] ?? null;
            $nodeId = $node['id'] ?? null;
            $parentId = $node['parentId'] ?? null;
            $sort = $node['sort'] ?? null;

            if (!in_array($nodeType, ['folder', 'item'], true)) {
                throw new HttpException('nodeTypeが不正です', 400);
            }
            if ($nodeId === null) {
                throw new HttpException('idが不足しています', 400);
            }
            if (is_string($nodeId) && mb_strlen((string)$nodeId) > 100) {
                throw new HttpException('idが長すぎます', 400);
            }
            if ($parentId !== null && mb_strlen((string)$parentId) > 100) {
                throw new HttpException('parentIdが長すぎます', 400);
            }
            if (!is_int($sort) && !is_float($sort)) {
                throw new HttpException('sortが不正です', 400);
            }

            if ($nodeType === 'folder') {
                $result = updateSingleRecord(
                    $pdo,
                    $folderTable,
                    ['folderId' => $nodeId, 'user' => $userId],
                    ['sort' => $sort, 'parentFolderId' => $parentId]
                );
                if ($result === false) {
                    throw new HttpException("{$table}フォルダの更新に失敗しました", 500);
                }
            } else {
                $folderId = $parentId ?? 'noCategory';
                $result = updateSingleRecord(
                    $pdo,
                    $itemOrderTable,
                    ['itemId' => $nodeId, 'user' => $userId],
                    ['folderId' => $folderId, 'sort' => $sort]
                );
                if ($result === false) {
                    throw new HttpException("{$table}アイテムの更新に失敗しました", 500);
                }
            }
        }

        return ['message' => "{$table}ツリーの並び替えを保存しました", 'result' => 'ok'];
    });
}


/**
 * フォルダ名の変更
 */
function renameFolder(int $userId, string $table, array $inputData): void
{
    handlePatchRequest(function (PDO $pdo) use ($userId, $table, $inputData) {
        $folderId = $inputData['folderId'] ?? null;
        $name = $inputData['name'] ?? null;

        $missingFields = [];
        if (!$folderId) {
            $missingFields[] = 'folderId';
        }
        if (!$name) {
            $missingFields[] = 'name';
        }
        if (!empty($missingFields)) {
            throw new HttpException('データが不足しています: ' . implode(', ', $missingFields), 400);
        }

        validateMaxLength($name, 100, 'name');

        $folderTable = "{$table}Folder";

        // 既存データの更新処理
        $result = updateSingleRecord($pdo, $folderTable, ['folderId' => $folderId, 'user' => $userId], ['name' => $name]);
        if ($result === false) {
            throw new HttpException("{$table}：更新に失敗しました", 500);
        }
        if ($result === null) {
            throw new HttpException("{$table}：対象のレコードがありません", 404);
        }

        return [
            'message' => "{$table}フォルダ名を変更しました",
            'result' => $name
        ];
    });
}
