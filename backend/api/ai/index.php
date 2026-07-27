<?php

declare(strict_types=1);

require_once __DIR__ . '/food.php';
require_once __DIR__ . '/todo.php';

if (defined('USER_ID')) {

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    // レート制限（同一ユーザーの10秒クールダウン）
    $rateLimitKey = 'ai_last_request_' . USER_ID;
    $lastRequest = $_SESSION[$rateLimitKey] ?? 0;
    $now = time();

    if ($now - $lastRequest < 10) {
        http_response_code(429);
        echo json_encode(['error' => 'リクエストが速すぎます。10秒後に再試行してください']);
        exit();
    }

    $_SESSION[$rateLimitKey] = $now;

    try {
        $inputData = parseJsonInput();
        $messages = $inputData['messages'] ?? [];
        $today = $inputData['today'] ?? date('Y-m-d');
        $now = $inputData['now']   ?? date('Y-m-d H:i:s');

        if (!is_array($messages)) {
            throw new HttpException('messages が不正です', 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $today)) {
            throw new HttpException('today の日付形式が不正です', 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $now)) {
            throw new HttpException('now の日時形式が不正です', 400);
        }

        // 直近8メッセージ（4往復）に絞る
        $messages = array_slice($messages, -8);

        $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        // 各メッセージの本文サイズ・画像を検証
        foreach ($messages as $msg) {
            if (!is_array($msg)) {
                throw new HttpException('messages の形式が不正です', 400);
            }

            $content = $msg['content'] ?? '';
            if (is_string($content)) {
                if (mb_strlen($content) > 2000) {
                    throw new HttpException('メッセージが長すぎます', 400);
                }
            } elseif (is_array($content)) {
                foreach ($content as $block) {
                    if (!is_array($block)) {
                        throw new HttpException('messages の形式が不正です', 400);
                    }
                    $blockType = $block['type'] ?? '';
                    if ($blockType === 'text') {
                        $blockText = $block['text'] ?? '';
                        if (is_string($blockText) && mb_strlen($blockText) > 2000) {
                            throw new HttpException('メッセージが長すぎます', 400);
                        }
                    } elseif ($blockType === 'image') {
                        $source = $block['source'] ?? [];
                        if (!in_array($source['media_type'] ?? '', $allowedImageTypes, true)) {
                            throw new HttpException('対応していない画像形式です（jpeg/png/gif/webp）', 400);
                        }
                        $decoded = base64_decode($source['data'] ?? '', true);
                        if ($decoded === false) {
                            throw new HttpException('画像データが不正です', 400);
                        }
                        if (strlen($decoded) > 4 * 1024 * 1024) {
                            throw new HttpException('画像が大きすぎます（上限4MB）', 400);
                        }
                        if (getimagesizefromstring($decoded) === false) {
                            throw new HttpException('有効な画像ファイルではありません', 400);
                        }
                        unset($decoded);
                    }
                }
            } else {
                throw new HttpException('messages の形式が不正です', 400);
            }
        }

        $apiKey = $_ENV['ANTHROPIC_API_KEY'] ?? '';
        if (!$apiKey) {
            throw new HttpException('API キーが設定されていません', 500);
        }

        $pdo = getPdoConnection();
        $tools = [...getFoodTools(), ...getTodoTools()];

        $systemPrompt = <<<PROMPT
        あなたはスケジューラーアプリのアシスタントです。
        今日の日付は {$today} です。

        # 役割と禁止事項
        食事記録の登録・修正、およびTodoの登録・修正のみ対応する。それ以外の依頼（天気・メモ・検索など）には「食事記録とTodoの登録以外はお答えできません」と返す。
        - 食事記録の削除は不可。依頼された場合は「削除は Health ページから行ってください」と案内する
        - Todoの削除は不可。依頼された場合は「削除はホーム画面から行ってください」と案内する
        - 全く根拠のない食事の栄養データは登録しない
        PROMPT;

        $systemPrompt .= getFoodSystemPrompt($today);
        $systemPrompt .= getTodoSystemPrompt($today, $now);

        $registered = [];
        $updated = [];
        $registeredFoodDB = [];
        $registeredTodos = [];
        $updatedTodos = [];
        $finalMessage = '';
        $loop = 0;
        $maxLoop = 10;

        while ($loop < $maxLoop) {
            $loop++;

            $requestBody = [
                'model' => 'claude-sonnet-4-6',
                'max_tokens' => 2048,
                'system' => [
                    [
                        'type' => 'text',
                        'text' => $systemPrompt,
                        'cache_control' => ['type' => 'ephemeral'],
                    ],
                ],
                'tools' => $tools,
                'messages' => $messages,
            ];

            $response = callAnthropicApi($apiKey, $requestBody);

            if ($response === false) {
                throw new HttpException('Anthropic API の呼び出しに失敗しました', 500);
            }

            if (isset($response['type']) && $response['type'] === 'error') {
                $errMsg = $response['error']['message'] ?? 'Unknown error';
                throw new HttpException("Anthropic API エラー: {$errMsg}", 502);
            }

            // stop_reason は end_turn（返答完了）か tool_use（ツールを使いたい）の2パターンが返る
            $stopReason = $response['stop_reason'] ?? '';
            $content    = $response['content'] ?? [];

            // アシスタントメッセージを履歴に追加
            $messages[] = ['role' => 'assistant', 'content' => $content];

            if ($stopReason === 'end_turn') {
                foreach ($content as $block) {
                    if (($block['type'] ?? '') === 'text') {
                        $finalMessage = $block['text'];
                        break;
                    }
                }
                break;
            }

            if ($stopReason === 'tool_use') {
                $toolResults = [];

                foreach ($content as $block) {
                    if (($block['type'] ?? '') !== 'tool_use') {
                        continue;
                    }

                    $toolName = $block['name'];
                    $toolInput = $block['input'];
                    $toolUseId = $block['id'];

                    $toolResult = executeToolCall(
                        $pdo,
                        USER_ID,
                        $toolName,
                        $toolInput,
                        $registered,
                        $updated,
                        $registeredFoodDB,
                        $registeredTodos,
                        $updatedTodos
                    );

                    $toolEntry = [
                        'type' => 'tool_result',
                        'tool_use_id' => $toolUseId,
                        'content' => json_encode($toolResult, JSON_UNESCAPED_UNICODE),
                    ];
                    if (isset($toolResult['error'])) {
                        $toolEntry['is_error'] = true;
                    }
                    $toolResults[] = $toolEntry;
                }

                $messages[] = ['role' => 'user', 'content' => $toolResults];
            }
        }

        if ($finalMessage === '') {
            $finalMessage = $loop >= $maxLoop
                ? 'ツールの実行回数が上限に達しました'
                : '申し訳ありません。返答の生成に失敗しました。もう一度お試しください。';
        }

        http_response_code(200);
        echo json_encode([
            'message'          => $finalMessage,
            'registered'       => $registered,
            'updated'          => $updated,
            'registeredFoodDB' => $registeredFoodDB,
            'registeredTodos'  => $registeredTodos,
            'updatedTodos'     => $updatedTodos,
        ], JSON_UNESCAPED_UNICODE);
    } catch (HttpException $e) {
        $prev = $e->getPrevious();
        if ($prev !== null) {
            logError($prev->getMessage(), $prev);
        }
        http_response_code($e->getStatusCode());
        $clientMessage = ($e->getStatusCode() >= 500 && getenv('APP_ENV') !== 'development') ? 'サーバーエラーが発生しました' : $e->getMessage();
        echo json_encode(['error' => $clientMessage]);
    } catch (Throwable $e) {
        logError($e->getMessage(), $e);
        http_response_code(500);
        echo json_encode(['error' => getenv('APP_ENV') === 'development' ? $e->getMessage() : 'サーバーエラーが発生しました']);
    }
}


/**
 * Anthropic API を呼び出す
 */
function callAnthropicApi(string $apiKey, array $requestBody): array|false
{
    $ch = curl_init('https://api.anthropic.com/v1/messages');

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
        ],
        CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 60,
        CURLOPT_MAXFILESIZE => 5242880, // 5MB
    ]);

    $responseBody = curl_exec($ch);
    curl_close($ch);

    if ($responseBody === false) {
        return false;
    }

    $data = json_decode((string) $responseBody, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return false;
    }

    // 4xx/5xx でもレスポンスボディは返す（エラー詳細を上位で判定）
    return $data;
}


/**
 * ツールを実行して結果を返す
 */
function executeToolCall(
    PDO $pdo,
    int $userId,
    string $toolName,
    array $input,
    array &$registered,
    array &$updated,
    array &$registeredFoodDB,
    array &$registeredTodos,
    array &$updatedTodos
): array {
    return match ($toolName) {
        'search_custom_food'   => searchCustomFoodDb($pdo, $input['name'] ?? ''),
        'search_standard_food' => searchStandardFoodDb($pdo, $input['name'] ?? ''),
        'register_food'        => registerFood($pdo, $userId, $input, $registered),
        'update_food'          => updateFoodRecord($pdo, $userId, $input, $updated),
        'register_foodDB'      => registerFoodDB($pdo, $userId, $input, $registeredFoodDB),
        'register_todo'        => registerTodos($pdo, $userId, $input, $registeredTodos),
        'update_todo'          => updateTodoRecord($pdo, $userId, $input, $updatedTodos),
        default                => ['error' => '不明なツールです: ' . $toolName],
    };
}
