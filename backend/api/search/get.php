<?php

declare(strict_types=1);

/**
 * 検索
 */
function getSearch(int $userId, string $table): void
{
    handleGetRequest(function (PDO $pdo) use ($userId, $table) {
        if (!in_array($table, ['memo', 'project', 'gallery'])) {
            throw new HttpException("無効なテーブルです", 400);
        }

        $word = $_GET['word'] ?? '';
        $word = trim($word);

        if ($word === '') {
            return ['result' => []];
        }

        // キーワード分割（全角スペース対応）
        $keywords = preg_split('/\s+/u', $word);
        $keywords = array_values(array_filter($keywords, fn ($k) => $k !== ''));

        if (empty($keywords)) {
            return ['result' => []];
        }

        // 1. メインテーブル検索
        $sql = "SELECT id, title, plainText
                FROM {$table}
                WHERE `user` = :userId";

        $params = [':userId' => $userId];

        // plainTextに対して、複数ワードで検索をかけて、該当データを取得
        $orConditions = [];
        foreach ($keywords as $index => $keyword) {
            $paramName = ":kw{$index}";
            $orConditions[] = "plainText LIKE {$paramName} ESCAPE '\\\\'";
            $params[$paramName] = '%' . addcslashes($keyword, '%_\\') . '%';
        }

        if (!empty($orConditions)) {
            $sql .= " AND (" . implode(' OR ', $orConditions) . ")";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // スニペット作成関数
        $makeSnippet = function (string $text, array $keywords, int $contextLength = 100): string {

            $firstPos = null;
            $matchedKeyword = null;

            foreach ($keywords as $kw) {
                $pos = mb_stripos($text, $kw);
                if ($pos !== false) {
                    if ($firstPos === null || $pos < $firstPos) {
                        $firstPos = $pos;
                        $matchedKeyword = $kw;
                    }
                }
            }

            if ($firstPos === null) {
                return '';
            }

            $start = max(0, $firstPos - $contextLength);
            $length = mb_strlen($matchedKeyword) + $contextLength * 2;

            $snippet = mb_substr($text, $start, $length);

            if ($start > 0) {
                $snippet = '...' . $snippet;
            }

            if ($start + $length < mb_strlen($text)) {
                $snippet .= '...';
            }

            return $snippet;
        };

        // スニペットの追加
        $rows = array_map(function ($row) use ($makeSnippet, $keywords) {
            $row['snippet'] = $makeSnippet($row['plainText'], $keywords);
            return $row;
        }, $rows);
        // スニペットが作れない場合は除外
        $rows = array_filter($rows, fn ($row) => $row['snippet'] !== '');
        // hitCountの追加（Countは出現回数で評価）
        foreach ($rows as &$row) {
            $textLower = mb_strtolower($row['plainText']);
            $hitCount = 0;
            foreach ($keywords as $kw) {
                $hitCount += mb_substr_count($textLower, mb_strtolower($kw));
            }
            $row['hitCount'] = $hitCount;
            unset($row['plainText']);
        }
        unset($row);

        // 2. dataTableの検索
        $tableSql = "SELECT id, postId, page, plainText
                FROM dataTable
                WHERE `user` = :userId
                AND `page` = :page";

        $tableParams = [
        ':userId' => $userId,
        ':page'   => $table
        ];

        // plainTextに対して、複数ワードで検索をかけて、該当データを取得
        $tableOrConditions = [];
        foreach ($keywords as $index => $keyword) {
            $paramName = ":kw{$index}";
            $tableOrConditions[] = "plainText LIKE {$paramName} ESCAPE '\\\\'";
            $tableParams[$paramName] = '%' . addcslashes($keyword, '%_\\') . '%';
        }
        if (!empty($tableOrConditions)) {
            $tableSql .= " AND (" . implode(' OR ', $tableOrConditions) . ")";
        }

        $tableStmt = $pdo->prepare($tableSql);
        $tableStmt->execute($tableParams);
        $tableRows = $tableStmt->fetchAll(PDO::FETCH_ASSOC);

        // スニペットの追加
        $tableRows = array_map(function ($row) use ($makeSnippet, $keywords) {
            $row['snippet'] = $makeSnippet($row['plainText'], $keywords);
            return $row;
        }, $tableRows);
        // スニペットが作れない場合は除外
        $tableRows = array_filter($tableRows, fn ($row) => $row['snippet'] !== '');
        // hitCountの追加（Countは出現回数で評価）
        foreach ($tableRows as &$row) {
            $textLower = mb_strtolower($row['plainText']);
            $hitCount = 0;
            foreach ($keywords as $kw) {
                $hitCount += mb_substr_count($textLower, mb_strtolower($kw));
            }
            $row['hitCount'] = $hitCount;
            unset($row['plainText']);
        }
        unset($row);

        // 3. メインテーブルの結果なく、dataTableの結果にあるidのtitleを取得
        $mainIds = array_column($rows, 'id');
        $dataPostIds = array_unique(array_column($tableRows, 'postId'));
        $missingIds = array_diff($dataPostIds, $mainIds);

        $titlesMap = [];
        if (!empty($missingIds)) {

            $placeholders = [];
            $titleParams = [':userId' => $userId];

            foreach ($missingIds as $index => $id) {
                $ph = ":id{$index}";
                $placeholders[] = $ph;
                $titleParams[$ph] = $id;
            }

            $titleSql = "
                SELECT id, title
                FROM {$table}
                WHERE `user` = :userId
                AND id IN (" . implode(',', $placeholders) . ")
            ";

            $titleStmt = $pdo->prepare($titleSql);
            $titleStmt->execute($titleParams);

            $titleRows = $titleStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($titleRows as $row) {
                $titlesMap[$row['id']] = $row['title'];
            }
        }

        // 4. マージ処理
        $resultsMap = [];

        // メイン検索結果を登録
        foreach ($rows as $row) {
            $resultsMap[$row['id']] = [
                'id' => $row['id'],
                'snippet' => $row['snippet'],
                'table' => null,
                'title' => $row['title'],
                'hitCount' => $row['hitCount'],
            ];
        }

        // dataTableをマージ
        foreach ($tableRows as $row) {
            $postId = $row['postId'];

            $tableData = [
                'id' => $row['id'],
                'page' => $row['page'],
                'postId' => $postId,
                'snippet' => $row['snippet'],
            ];

            if (isset($resultsMap[$postId])) {

                // 既にメインでヒットしている場合
                $resultsMap[$postId]['hitCount'] += $row['hitCount'];

                // tableをセット（複数ある場合は最初の1件だけにする）
                if ($resultsMap[$postId]['table'] === null) {
                    $resultsMap[$postId]['table'] = $tableData;
                }
            } else {
                // dataTableだけヒットした場合
                $resultsMap[$postId] = [
                    'id' => $postId,
                    'snippet' => null,
                    'table' => $tableData,
                    'title' => $titlesMap[$postId] ?? null,
                    'hitCount' => $row['hitCount'],
                ];
            }
        }

        $results = array_values($resultsMap);

        // hitCountでソート
        usort($results, function ($a, $b) {
            return $b['hitCount'] <=> $a['hitCount'];
        });

        // hitCountを削除
        foreach ($results as &$result) {
            unset($result['hitCount']);
        }
        unset($result);

        return ['result' => $results];

    });
}
