<?php

declare(strict_types=1);

function getTodoTools(): array
{
    return [
        [
            'name'        => 'register_todo',
            'description' => 'todo テーブルにTodoを新規登録する。複数件まとめて登録可能。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'todos' => [
                        'type'        => 'array',
                        'description' => '登録するTodoの配列',
                        'items'       => [
                            'type'       => 'object',
                            'properties' => [
                                'content'   => [
                                    'type'        => 'string',
                                    'description' => 'タスク内容',
                                ],
                                'start'     => [
                                    'type'        => 'string',
                                    'description' => '開始日時（YYYY-MM-DD HH:mm:ss 形式）。時間指定がない場合は 00:00:00 を使う',
                                ],
                                'end'       => [
                                    'type'        => ['string', 'null'],
                                    'description' => '終了日時（YYYY-MM-DD HH:mm:ss 形式）。指定がない場合は null',
                                ],
                                'type'      => [
                                    'type'        => 'string',
                                    'enum'        => ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'],
                                    'description' => 'タスク種別。指定がない場合は content の内容から推測する',
                                ],
                                'estimated' => [
                                    'type'        => ['string', 'null'],
                                    'description' => '見積時間（HH:mm:ss 形式、最大 24:00:00）。指定がない場合は null',
                                ],
                                'memo'      => [
                                    'type'        => 'string',
                                    'description' => 'メモ。指定がない場合は空文字',
                                ],
                                'projectId' => [
                                    'type'        => ['integer', 'null'],
                                    'description' => 'プロジェクトID。メッセージ中に数字があれば設定する。プロジェクト名のみで番号がない場合は null',
                                ],
                            ],
                            'required' => ['content', 'start', 'type'],
                        ],
                    ],
                ],
                'required' => ['todos'],
            ],
        ],
        [
            'name'        => 'update_todo',
            'description' => '既存のTodoを更新する。IDを会話履歴または直接指定で特定する。指定されたフィールドのみ更新する。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'id'        => [
                        'type'        => 'integer',
                        'description' => '更新するTodoのID',
                    ],
                    'content'   => [
                        'type'        => 'string',
                        'description' => 'タスク内容',
                    ],
                    'start'     => [
                        'type'        => 'string',
                        'description' => '開始日時（YYYY-MM-DD HH:mm:ss 形式）',
                    ],
                    'end'       => [
                        'type'        => ['string', 'null'],
                        'description' => '終了日時（YYYY-MM-DD HH:mm:ss 形式）。null で削除',
                    ],
                    'type'      => [
                        'type'        => 'string',
                        'enum'        => ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'],
                        'description' => 'タスク種別',
                    ],
                    'estimated' => [
                        'type'        => ['string', 'null'],
                        'description' => '見積時間（HH:mm:ss 形式、最大 24:00:00）。null で削除',
                    ],
                    'memo'      => [
                        'type'        => 'string',
                        'description' => 'メモ',
                    ],
                    'projectId' => [
                        'type'        => ['integer', 'null'],
                        'description' => 'プロジェクトID。null で解除',
                    ],
                ],
                'required' => ['id'],
            ],
            'cache_control' => ['type' => 'ephemeral'],
        ],
    ];
}


function getTodoSystemPrompt(string $today, string $now): string
{
    return <<<PROMPT

---

# Todo登録・更新

## ツール呼び出しの原則
- **Todoを登録・更新するときは必ず register_todo / update_todo を呼ぶ。ツールを呼ばずに登録完了メッセージを生成してはいけない。**
- ユーザーがTodoの登録を求めていると判断したら、確認なしで即座に register_todo を呼ぶ
- 「今からスーパーに行く」「これから会議」のように行動の開始を示す表現も、Todoの登録依頼として直接 register_todo を呼ぶ

## 登録ルール

### 日付・時間
- 日付指定がない場合は今日（{$today}）として扱う
- 「昨日」「明日」「○月○日」などは今日の日付を基準に解釈する
- 時間指定がない場合は start の時間部分を 00:00:00 にする
- 「今から」「これから」「今すぐ」など今この瞬間を起点とする表現の場合は、現在日時（{$now}）を start にする

### type の推測（指定がない場合）
内容から以下を目安に推測する。
- 仕事：会議、MTG、資料作成、報告、業務、打ち合わせ など
- プライベート：友人・家族との約束、お出かけ、旅行 など
- 生活：病院、買い物、役所、家事、通院 など
- 休憩・睡眠：睡眠、昼寝、休憩 など
- 趣味・勉強：勉強、読書、ゲーム、スポーツ、習い事 など

### estimated（見積時間）
- 「1時間」「30分」などの表現があれば HH:mm:ss 形式に変換して設定する
- 最大は 24:00:00。それを超える指定は 24:00:00 に丸める
- 指定がない場合は null

### projectId
- メッセージ中にプロジェクトを示す数字があれば設定する（「プロジェクトの36」「プロジェクト36番」「プロジェクトID: 36」はすべて projectId = 36）
- プロジェクト名のみで番号がない場合は null にする

### 複数日にまたがるTodo
出張・旅行・長期タスクなど複数日にわたるTodoは分割せず1件のまま登録する。
start に開始日時、end に終了日時をそのまま設定すればよい。

### 睡眠記録
「寝た」「起きた」など睡眠に関する表現が含まれる場合は、以下のルールで睡眠Todoを登録する。

**固定値**
- content: 「睡眠」、type: 「休憩・睡眠」

**時刻の解釈**
寝た時間として「○時」と言われた場合、文脈から夜の時間と判断できるときは午後（または深夜）として解釈する。
- 「10時に寝た」→ 22:00、「9時半に寝た」→ 21:30、「11時に寝た」→ 23:00
- 「1時に寝た」→ 01:00、「2時に寝た」→ 02:00
- 明示的に「午前」「朝」が付いている場合のみ AM として扱う

**start・end の決定**

パターンA：「昨日○時に寝た」など寝た時刻のみ言及（起床の話は出ていない）
- start = 寝た日時、end = 同日の 23:59:00、**1件のみ登録**
- 翌日分は登録しない（起床が言及されていないため）

パターンB：「起きた」「起床した」など起床のみ言及（寝た時刻の話は出ていない）
- start = 今日の 00:00:00、end = 現在時刻（{$now}）、**1件のみ登録**

パターンC：「○時に寝て、今起きた」「昨日○時に寝て○時に起きた」など両方言及
- 同日なら1件登録
- 日付をまたぐ場合は2件に分割：
  - 1件目: start = 寝た日時、end = 寝た日の 23:59:00
  - 2件目: start = 翌日の 00:00:00、end = 起床日時（「今起きた」なら現在時刻 {$now}）

### 画像が添付されている場合
画像はTodo登録に使用しない。テキストの内容のみでTodoを登録する。

## 更新ルール
- IDは会話履歴の返答から特定するか、ユーザーが直接指定する
- 指定されたフィールドのみ更新する（指定のないフィールドは変更しない）
- visible はバックエンドが type から自動設定するため、ツールへの指定は不要

---

## Todo登録・更新の返答フォーマット
登録・更新が完了したら、以下の構造で返答する。絵文字は使わない。

（登録/更新完了メッセージ）

---

**タスク内容（ID：登録ID）**
- 日時：YYYY-MM-DD HH:mm〜（終了がある場合は〜HH:mm）
- 種別：type
- 見積：HH:mm（estimatedがある場合のみ）
- メモ：メモ内容（memoがある場合のみ）

（複数件の場合は同じ形式で繰り返す）
PROMPT;
}


function registerTodos(PDO $pdo, int $userId, array $input, array &$registeredTodos): array
{
    $todos = $input['todos'] ?? [];
    if (!is_array($todos) || count($todos) === 0) {
        return ['error' => 'todos が空です'];
    }

    $results = [];

    foreach ($todos as $todo) {
        $results[] = registerSingleTodo($pdo, $userId, $todo, $registeredTodos);
    }

    return ['success' => true, 'results' => $results];
}


function registerSingleTodo(PDO $pdo, int $userId, array $todo, array &$registeredTodos): array
{
    $content   = $todo['content'] ?? null;
    $start     = $todo['start'] ?? null;
    $type      = $todo['type'] ?? null;
    $end       = $todo['end'] ?? null;
    $estimated = $todo['estimated'] ?? null;
    $memo      = $todo['memo'] ?? '';
    $projectId = isset($todo['projectId']) ? (int) $todo['projectId'] : null;

    if (!$content || !$start || !$type) {
        return ['error' => '必須項目が不足しています（content, start, type）'];
    }

    $validTypes = ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'];
    if (!in_array($type, $validTypes, true)) {
        return ['error' => 'type が不正です'];
    }

    try {
        validateMaxLength($content, 255, 'content');
        validateDatetime($start, 'start');
        if ($end !== null) {
            validateDatetime($end, 'end');
        }
    } catch (HttpException $e) {
        return ['error' => $e->getMessage()];
    }

    $visible = in_array($type, ['仕事', 'プライベート', '趣味・勉強'], true) ? 1 : 0;

    $sortVal = null;
    if ($projectId !== null) {
        $count = countRecords($pdo, 'todo', ['user' => $userId, 'projectId' => $projectId, 'sectionId' => null]);
        $sortVal = ($count !== false) ? $count + 1 : null;
    }

    $data = [
        'user'      => $userId,
        'content'   => $content,
        'start'     => $start,
        'end'       => $end,
        'type'      => $type,
        'projectId' => $projectId,
        'sectionId' => null,
        'estimated' => $estimated,
        'completed' => 0,
        'visible'   => $visible,
        'memo'      => $memo,
        'sort'      => $sortVal,
    ];

    $newId = insertRecordAndGetId($pdo, 'todo', $data);
    if ($newId === false) {
        return ['error' => '登録に失敗しました'];
    }

    $record = [
        'id'        => $newId,
        'content'   => $content,
        'start'     => $start,
        'end'       => $end,
        'type'      => $type,
        'projectId' => $projectId,
        'sectionId' => null,
        'estimated' => $estimated,
        'completed' => 0,
        'visible'   => $visible,
        'memo'      => $memo,
        'sort'      => $sortVal,
    ];

    $registeredTodos[] = $record;

    return ['success' => true, 'id' => $newId, 'record' => $record];
}


function updateTodoRecord(PDO $pdo, int $userId, array $input, array &$updatedTodos): array
{
    $id = isset($input['id']) ? (int) $input['id'] : 0;
    if ($id <= 0) {
        return ['error' => 'id が指定されていません'];
    }

    $sql = 'SELECT `id`, `content`, `start`, `end`, `type`, `projectId`, `sectionId`, `estimated`, `completed`, `visible`, `memo`, `sort`
              FROM `todo`
             WHERE `id` = :id AND `user` = :user
             LIMIT 1';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id, 'user' => $userId]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        return ['error' => '取得に失敗しました'];
    }

    if (!$current) {
        return ['error' => '対象のTodoが見つかりません（id またはユーザーが一致しません）'];
    }

    $content   = array_key_exists('content', $input) ? $input['content'] : $current['content'];
    $start     = array_key_exists('start', $input) ? $input['start'] : $current['start'];
    $end       = array_key_exists('end', $input) ? $input['end'] : $current['end'];
    $type      = array_key_exists('type', $input) ? $input['type'] : $current['type'];
    $estimated = array_key_exists('estimated', $input) ? $input['estimated'] : $current['estimated'];
    $memo      = array_key_exists('memo', $input) ? $input['memo'] : $current['memo'];
    $projectId = array_key_exists('projectId', $input) ? (isset($input['projectId']) ? (int) $input['projectId'] : null) : $current['projectId'];

    $validTypes = ['仕事', 'プライベート', '生活', '休憩・睡眠', '趣味・勉強'];
    if (!in_array($type, $validTypes, true)) {
        return ['error' => 'type が不正です'];
    }

    try {
        validateMaxLength((string) $content, 255, 'content');
        validateDatetime((string) $start, 'start');
        if ($end !== null) {
            validateDatetime((string) $end, 'end');
        }
    } catch (HttpException $e) {
        return ['error' => $e->getMessage()];
    }

    $visible = in_array($type, ['仕事', 'プライベート', '趣味・勉強'], true) ? 1 : 0;

    $updateData = [
        'content'   => $content,
        'start'     => $start,
        'end'       => $end,
        'type'      => $type,
        'projectId' => $projectId,
        'estimated' => $estimated,
        'visible'   => $visible,
        'memo'      => $memo,
    ];

    $result = updateSingleRecord($pdo, 'todo', ['id' => $id, 'user' => $userId], $updateData);

    if ($result === false) {
        return ['error' => '更新に失敗しました'];
    }
    if ($result === null) {
        return ['error' => '対象のTodoが見つかりません'];
    }

    $record = [
        'id'        => $id,
        'content'   => $content,
        'start'     => $start,
        'end'       => $end,
        'type'      => $type,
        'projectId' => $projectId,
        'sectionId' => $current['sectionId'],
        'estimated' => $estimated,
        'completed' => (int) $current['completed'],
        'visible'   => $visible,
        'memo'      => $memo,
        'sort'      => $current['sort'] !== null ? (int) $current['sort'] : null,
    ];

    $updatedTodos[] = $record;

    return ['success' => true, 'id' => $id, 'record' => $record];
}
