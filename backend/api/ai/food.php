<?php

declare(strict_types=1);

function getFoodTools(): array
{
    return [
        [
            'name'        => 'search_custom_food',
            'description' => 'ユーザーが独自登録したカスタム食品DB（foodDB）を名称で部分一致検索する（上限15件）。ブランド名・料理名など元の表現そのままで検索する。結果が得られた場合は search_standard_food を呼ぶ必要はない。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'name' => [
                        'type'        => 'string',
                        'description' => '検索する食品名・ブランド名（部分一致、変換不要）',
                    ],
                ],
                'required' => ['name'],
            ],
        ],
        [
            'name'        => 'search_standard_food',
            'description' => '日本食品標準成分表（foodDB_standard）をカタカナキーワードで部分一致検索する（上限15件）。search_custom_food でヒットしなかった場合に呼ぶ。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'name' => [
                        'type'        => 'string',
                        'description' => '検索するカタカナキーワード（例：ゴハン、トリムネ）',
                    ],
                ],
                'required' => ['name'],
            ],
        ],
        [
            'name'        => 'register_food',
            'description' => 'food テーブルに食事摂取記録を新規登録する。unit は g か 個 のみ有効。大匙・cc 等は Claude がグラムに換算して渡すこと。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'date'     => ['type' => 'string',              'description' => '記録日（YYYY-MM-DD）'],
                    'name'     => ['type' => 'string',              'description' => '食品名'],
                    'quantity' => ['type' => 'number',              'description' => '量（数値）'],
                    'unit'     => ['type' => 'string', 'enum' => ['g', '個'], 'description' => '単位（g または 個）'],
                    'energy'   => ['type' => 'number',              'description' => 'エネルギー（kcal）'],
                    'protein'  => ['type' => ['number', 'null'],    'description' => 'たんぱく質（g）'],
                    'fat'      => ['type' => ['number', 'null'],    'description' => '脂質（g）'],
                    'carb'     => ['type' => ['number', 'null'],    'description' => '炭水化物（g）'],
                    'salt'     => ['type' => ['number', 'null'],    'description' => '食塩相当量（g）'],
                ],
                'required' => ['date', 'name', 'quantity', 'unit', 'energy'],
            ],
        ],
        [
            'name'        => 'update_food',
            'description' => 'food テーブルの既存レコードを更新する。この会話で登録・確認した id があるもののみ更新可能。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'id'       => ['type' => 'integer',             'description' => '更新するレコードの ID'],
                    'date'     => ['type' => 'string',              'description' => '記録日（YYYY-MM-DD）'],
                    'name'     => ['type' => 'string',              'description' => '食品名'],
                    'quantity' => ['type' => 'number',              'description' => '量（数値）'],
                    'unit'     => ['type' => 'string', 'enum' => ['g', '個'], 'description' => '単位（g または 個）'],
                    'energy'   => ['type' => 'number',              'description' => 'エネルギー（kcal）'],
                    'protein'  => ['type' => ['number', 'null'],    'description' => 'たんぱく質（g）'],
                    'fat'      => ['type' => ['number', 'null'],    'description' => '脂質（g）'],
                    'carb'     => ['type' => ['number', 'null'],    'description' => '炭水化物（g）'],
                    'salt'     => ['type' => ['number', 'null'],    'description' => '食塩相当量（g）'],
                ],
                'required' => ['id', 'date', 'name', 'quantity', 'unit', 'energy'],
            ],
        ],
        [
            'name'        => 'register_foodDB',
            'description' => 'ユーザーの食品DB（foodDB）に栄養成分データを新規登録する。画像から読み取った栄養成分表のデータをユーザーが保存を希望した場合のみ呼ぶ。perItem: 0 = 100gあたりの値、1 = 1個あたりの値。name は「メーカー名 商品名 バリエーション」形式でスペース区切りにする（例：「亀田製菓 柿の種」「カルビー ポテトチップス のり塩」）。メーカー名が不明な場合は商品名のみ。perItem=1 かつ画像に1個あたりの重量（例：1袋60g、1枚15g）が明記されている場合は name の末尾に「(Xg)」を付ける（例：「カルビー ポテトチップス のり塩 (60g)」）。重量表記がない場合は付けない。',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'name'    => ['type' => 'string',             'description' => '食品名'],
                    'perItem' => ['type' => 'integer', 'enum' => [0, 1], 'description' => '0: 100gあたり, 1: 1個あたり'],
                    'energy'  => ['type' => 'number',             'description' => 'エネルギー（kcal）'],
                    'protein' => ['type' => ['number', 'null'],   'description' => 'たんぱく質（g）'],
                    'fat'     => ['type' => ['number', 'null'],   'description' => '脂質（g）'],
                    'carb'    => ['type' => ['number', 'null'],   'description' => '炭水化物（g）'],
                    'salt'    => ['type' => ['number', 'null'],   'description' => '食塩相当量（g）'],
                ],
                'required' => ['name', 'perItem', 'energy'],
            ],
            'cache_control' => ['type' => 'ephemeral'],
        ],
    ];
}


function getFoodSystemPrompt(string $today): string
{
    return <<<PROMPT

---

# 食事記録

## 画像なし（テキストのみ）の場合

### 栄養データの取得手順

#### ステップ1：search_custom_food でカスタム食品を照合
ユーザーの発言からブランド名・商品名・料理名の核となる単語を抽出し、変換せずそのまま検索する。
- 「カルビーのポテチ」→「カルビー」で検索
- 「明治の板チョコ」→「明治」で検索
- 「マクドのビッグマック」→「ビッグマック」で検索
- 「昨日食べた麻婆豆腐」→「麻婆豆腐」で検索

ヒットした場合：そのデータを優先して使い、ステップ2はスキップする。
perItem の値に応じて以下の計算をする（perItem=1 は foodDB のみ。foodDB_standard は常に perItem=0）。
- perItem=0（100gあたり）：quantity(g) × DB値 / 100 で計算
- perItem=1（1個あたり）：
  - 名前に「(Xg)」がある場合：個数 = 量(g) ÷ X、各栄養値 = DB値 × 個数
  - 名前に「(Xg)」がない場合：量は個数で受け取る。ユーザーがグラムで指定した場合は「何個食べましたか？」と確認する

ヒットしなかった場合：ステップ2に進む。

#### ステップ2：search_standard_food で標準成分表を照合
食品名は読みをカタカナに変換してから検索する（ひらがな・漢字のまま渡してもヒットしない）。
- 例：白菜→ハクサイ、さつまいも→サツマイモ（ひらがなもカタカナに変換する）
- 魚は連濁に注意：鮭→サケ/シャケ/ザケ、まず「シャケ」で検索する

**肉類の検索ルール**
牛・豚・鶏はDBが部位単位のため、部位が不明な場合はユーザーに確認してから検索する。
- 牛肉：ギュウ+部位（例：ギュウモモ・ギュウロース・カルビ・ギュウヒレ）
- 豚肉：ブタ/トン+部位（例：ブタロース・ブタバラ・ブタモモ・ブタヒレ）
- 鶏肉：トリ/チキン+部位（例：トリムネ・トリモモ）

**調理状態のデフォルト**（指定なしの場合）
- 米・ごはん → 炊いた後（めし）：「ゴハン」「コメ」で検索
- 麺類・パスタ → ゆで後：「ウドン」「パスタ」で検索
- それ以外（野菜・魚・卵・豆腐等）→ 生：「タマゴ」で検索（肉類は上記の肉類検索ルールに従う）

**調理状態が指定された場合**：状態プレフィックスをカタカナで食品名の前に付ける
- ゆで → ユデ（例：「ゆで卵」→「ユデタマゴ」）
- 炒り（乾煎り・から煎り） → イリ（例：「炒り卵」→「イリタマゴ」、「いりごま」→「イリゴマ」）
- 炒め（油炒め） → イタメ（例：「玉ねぎ炒め」→「イタメタマネギ」）
- 焼き → ヤキ（例：「焼き鮭」→「ヤキシャケ」）
- 乾燥・乾 → カン または カンソウ（例：「乾燥わかめ」→「カンワカメ」、「乾燥エビ」→「カンソウエビ」）。ヒットしない場合は両方試す
- 冷凍 → レイトウ（例：「冷凍枝豆」→「レイトウエダマメ」）
- 蒸し → ムシ（例：「蒸しサーモン」→「ムシサーモン」）
- 水煮 → ミズニ（例：「イワシ水煮」→「ミズニイワシ」）
- フライ（揚げ衣付き） → フライ（例：「アジフライ」→「フライアジ」）
- 天ぷら → テンプラ（例：「エビ天ぷら」→「テンプラエビ」）
- 皮なし → カワナシ（例：「皮なし鶏むね」→「カワナシトリムネ」）
- 生（パスタ・麺類・米など、ゆで/炊きがデフォルトの食品に限る）→ ナマ（例：「生パスタ」→「ナマパスタ」）。野菜・魚・卵など生がデフォルトの食品には ナマ を付けない

ヒットした場合：そのデータを使い、量に応じて比例計算する。自分の知識で数値を変更しない。
　例）100gあたり13kcalのデータがヒット → 50gなら energy = 13 × 50 / 100 = 6.5

ヒットしなかった場合：以下を順に試す
1. 状態プレフィックスを外して食品名だけで再検索（例：「ヤキシャケ」→「シャケ」）
   - ヒットし、かつ調理状態が一致する → そのデータを使う
   - ヒットしたが調理状態が異なる（例：焼きを指定したが生データのみヒット） → 使わずステップ3へ進む
2. 別の読み・言い換えで再検索（例：スパゲッティ→パスタ、ウインナー→ソーセージ）
3. それでもヒットしない場合：AIの知識から補完して登録する。有名チェーンの一般的なメニューは知識から登録してよい。この場合は必ず返答に「目安値」と明記すること（省略不可）
4. 知識でも確信が持てない場合のみ「分かりません」と返す

### foodDB案内
テキストのみの登録後はfoodDB登録の案内をしない。

---

## 画像（栄養成分表）がある場合

### 読み取りと登録の手順
1. DBは検索しない。画像から栄養成分を直接読み取る
2. テキストに食品名がない場合：「この食品の名前を教えてください」と確認してから登録する
3. テキストに量の記載がない場合：「何グラム（または何個）食べましたか？」と確認する
4. 確認事項がある場合は質問してよい（画像は会話履歴に含まれるため次のターンでも参照できる）
5. 画像が不鮮明・栄養成分表でない等の場合：「栄養成分表を読み取れませんでした。鮮明に撮影し直してお試しください。」とだけ返し、登録しない
6. 「100gあたり」表記の場合は食べた量に応じて比例計算する（例：100gあたり200kcalで50g食べた → 100kcal）
7. 「1食分（○g）あたり」「1個あたり」「1袋あたり」「1枚あたり」等、個数単位の表記の場合は、食べた個数をかけて計算する（例：1枚50kcalを3枚 → 150kcal）

### foodDB登録の案内（画像の場合のみ）
食事記録の登録後、以下の手順で案内する。
1. search_custom_food で食品名を検索する
2. ヒットした場合：「（食品名）はfoodDBに登録済みです」と添えるだけ（提案しない）
3. ヒットしなかった場合：返答の末尾に「このデータを食品栄養データベースに保存しておきますか？」と一言添える
4. 次のターンでユーザーが「はい」「お願いします」「登録します」など明確に肯定した場合のみ register_foodDB を呼ぶ。肯定がない場合（別の話題、次の画像、「いや」等）はスキップして次の対応をする
   - 数値は換算せず、画像のパッケージ表記の値をそのまま使う
   - 「100gあたり」表記 → perItem = 0
   - 「1袋あたり」「1食分あたり」「1個あたり」等のパッケージ単位表記 → perItem = 1（100gへの換算は行わない）。重量表記がある場合は name に「(Xg)」を付ける
   - name・perItem の詳細は register_foodDB ツールの説明に従う

---

## 食事記録の共通ルール

### 登録
- 複数の食品は食品ごとに別々に検索・登録する（例：「焼き鮭、ごはん、みそ汁」→ 3件）
- 同一食品を複数個食べた場合は1件にまとめる（例：卵3個 → quantity=3, unit=個）
- register_food の name：ブランド・企業名が判別できる場合は「ブランド名 商品名」形式（例：「マクドナルド ハンバーガー」「カルビー ポテトチップス のり塩」）。一般食材・自炊料理はユーザーが理解しやすい一般名称にする（例：「キャベツ 結球葉 生」→「キャベツ」、「こめ ［水稲めし］ 精白米 うるち米」→「ご飯」、「ぶた ［大型種肉］ ロース ゆで」→「豚ロース（ゆで）」）
- protein / fat / carb / salt が不明な場合は null で登録してよい（energy と quantity は必須）

### 日付
- 指定がない場合は今日（{$today}）で登録する
- 「昨日」「○日に」などは今日の日付を基準に解釈する

### 不明・曖昧なとき
- 食品の種類・部位が特定できず栄養値に大きな差が出る場合（例：「豚肉」だけで部位不明、「魚」だけで種類不明）はユーザーに確認してから登録する
- 量が曖昧な場合（「少し」「適量」等）はAIの判断で目安量を決めて登録し、返答に「目安値」と明記する

### 修正
- 修正できるのはこの会話で登録・確認したデータ（IDが判明しているもの）のみ
- IDはこの会話の返答履歴から参照する

---

## 食事記録の返答フォーマット
登録・修正が完了したら、以下の構造で返答する。絵文字は使わない。

（登録完了メッセージ。目安値・注意事項がある場合はここに補足する）

---

**食品名（ID：登録ID）**
- 日付：YYYY-MM-DD
- 量：数値 + 単位
- 熱量：数値 kcal
- たんぱく質：数値 g
- 脂質：数値 g
- 炭水化物：数値 g
- 食塩相当量：数値 g

（その他の補足があれば「---」で区切って追記する。なければ省略）

foodDB への登録完了時はこのフォーマットを使わない。栄養成分の繰り返しも一切不要。「（食品名）を食品栄養データベースに保存しました。次回から検索できます。」の一文のみ返す。
PROMPT;
}


function searchCustomFoodDb(PDO $pdo, string $name): array
{
    if ($name === '') {
        return ['results' => []];
    }

    $sql = 'SELECT `id`, `name`, `perItem`, `energy`, `protein`, `fat`, `carb`, `salt`
              FROM `foodDB`
             WHERE `name` LIKE :name
             LIMIT 15';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['name' => '%' . $name . '%']);
        return ['results' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
    } catch (Throwable $e) {
        return ['error' => '検索に失敗しました', 'results' => []];
    }
}


function searchStandardFoodDb(PDO $pdo, string $name): array
{
    if ($name === '') {
        return ['results' => []];
    }

    $sql = 'SELECT `id`, `name`, `perItem`, `energy`, `protein`, `fat`, `carb`, `salt`
              FROM `foodDB_standard`
             WHERE `keywords` IS NOT NULL AND `keywords` != \'\'
               AND (`name` LIKE :name OR `keywords` LIKE :kw)
             LIMIT 15';

    try {
        $escaped = addcslashes($name, '%_\\');
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['name' => '%' . $escaped . '%', 'kw' => '%' . $escaped . '%']);
        return ['results' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
    } catch (Throwable $e) {
        return ['error' => '検索に失敗しました', 'results' => []];
    }
}


function registerFood(PDO $pdo, int $userId, array $input, array &$registered): array
{
    $validUnits = ['g', '個'];
    $unit = $input['unit'] ?? null;
    if (!$unit || !in_array($unit, $validUnits, true)) {
        return ['error' => 'unit は g または 個 のみ有効です'];
    }

    $data = [
        'user'     => $userId,
        'date'     => $input['date'] ?? null,
        'name'     => $input['name'] ?? null,
        'quantity' => $input['quantity'] ?? null,
        'unit'     => $unit,
        'energy'   => $input['energy'] ?? null,
        'protein'  => $input['protein'] ?? null,
        'fat'      => $input['fat'] ?? null,
        'carb'     => $input['carb'] ?? null,
        'salt'     => $input['salt'] ?? null,
    ];

    if (!$data['date'] || !$data['name'] || $data['quantity'] === null || $data['energy'] === null) {
        return ['error' => '必須項目が不足しています（date, name, quantity, energy）'];
    }

    $validationError = validateFoodToolInput($data);
    if ($validationError !== null) {
        return ['error' => $validationError];
    }

    $newId = insertRecordAndGetId($pdo, 'food', $data);
    if ($newId === false) {
        return ['error' => '登録に失敗しました'];
    }

    $record = [
        'id'       => $newId,
        'date'     => $data['date'],
        'name'     => $data['name'],
        'quantity' => (float) $data['quantity'],
        'unit'     => $data['unit'],
        'energy'   => (float) $data['energy'],
        'protein'  => $data['protein'] !== null ? (float) $data['protein'] : null,
        'fat'      => $data['fat'] !== null ? (float) $data['fat'] : null,
        'carb'     => $data['carb'] !== null ? (float) $data['carb'] : null,
        'salt'     => $data['salt'] !== null ? (float) $data['salt'] : null,
    ];

    $registered[] = $record;

    return ['success' => true, 'id' => $newId, 'record' => $record];
}


function updateFoodRecord(PDO $pdo, int $userId, array $input, array &$updated): array
{
    $id = isset($input['id']) ? (int) $input['id'] : 0;
    if ($id <= 0) {
        return ['error' => 'id が指定されていません'];
    }

    $validUnits = ['g', '個'];
    $unit = $input['unit'] ?? null;
    if (!$unit || !in_array($unit, $validUnits, true)) {
        return ['error' => 'unit は g または 個 のみ有効です'];
    }

    $data = [
        'user'     => $userId,
        'date'     => $input['date'] ?? null,
        'name'     => $input['name'] ?? null,
        'quantity' => $input['quantity'] ?? null,
        'unit'     => $unit,
        'energy'   => $input['energy'] ?? null,
        'protein'  => $input['protein'] ?? null,
        'fat'      => $input['fat'] ?? null,
        'carb'     => $input['carb'] ?? null,
        'salt'     => $input['salt'] ?? null,
    ];

    if (!$data['date'] || !$data['name'] || $data['quantity'] === null || $data['energy'] === null) {
        return ['error' => '必須項目が不足しています（date, name, quantity, energy）'];
    }

    $validationError = validateFoodToolInput($data);
    if ($validationError !== null) {
        return ['error' => $validationError];
    }

    $result = updateSingleRecord($pdo, 'food', ['id' => $id, 'user' => $userId], $data);

    if ($result === false) {
        return ['error' => '更新に失敗しました'];
    }
    if ($result === null) {
        return ['error' => '対象のレコードが見つかりません（id またはユーザーが一致しません）'];
    }

    $record = [
        'id'       => $id,
        'date'     => $data['date'],
        'name'     => $data['name'],
        'quantity' => (float) $data['quantity'],
        'unit'     => $data['unit'],
        'energy'   => (float) $data['energy'],
        'protein'  => $data['protein'] !== null ? (float) $data['protein'] : null,
        'fat'      => $data['fat'] !== null ? (float) $data['fat'] : null,
        'carb'     => $data['carb'] !== null ? (float) $data['carb'] : null,
        'salt'     => $data['salt'] !== null ? (float) $data['salt'] : null,
    ];

    $updated[] = $record;

    return ['success' => true, 'id' => $id, 'record' => $record];
}


function registerFoodDB(PDO $pdo, int $userId, array $input, array &$registeredFoodDB): array
{
    $name    = $input['name'] ?? null;
    $perItem = $input['perItem'] ?? null;
    $energy  = $input['energy'] ?? null;

    if (!$name || $perItem === null || $energy === null) {
        return ['error' => '必須項目が不足しています（name, perItem, energy）'];
    }
    if (!in_array($perItem, [0, 1], true)) {
        return ['error' => 'perItem は 0 または 1 のみ有効です'];
    }

    try {
        validateMaxLength((string) $name, 100, 'name');
        validateNonNegativeNumber($energy, 'energy');
        foreach (['protein', 'fat', 'carb', 'salt'] as $field) {
            if (isset($input[$field]) && $input[$field] !== null) {
                validateNonNegativeNumber($input[$field], $field);
            }
        }
    } catch (HttpException $e) {
        return ['error' => $e->getMessage()];
    }

    $data = [
        'user'    => $userId,
        'name'    => $name,
        'perItem' => (int) $perItem,
        'energy'  => $energy,
        'protein' => $input['protein'] ?? null,
        'fat'     => $input['fat'] ?? null,
        'carb'    => $input['carb'] ?? null,
        'salt'    => $input['salt'] ?? null,
    ];

    $newId = insertRecordAndGetId($pdo, 'foodDB', $data);
    if ($newId === false) {
        return ['error' => 'foodDB への登録に失敗しました'];
    }

    $record = [
        'id'      => $newId,
        'name'    => $data['name'],
        'perItem' => $data['perItem'],
        'energy'  => (float) $data['energy'],
        'protein' => $data['protein'] !== null ? (float) $data['protein'] : null,
        'fat'     => $data['fat'] !== null ? (float) $data['fat'] : null,
        'carb'    => $data['carb'] !== null ? (float) $data['carb'] : null,
        'salt'    => $data['salt'] !== null ? (float) $data['salt'] : null,
    ];

    $registeredFoodDB[] = $record;

    return ['success' => true, 'id' => $newId, 'record' => $record];
}


function validateFoodToolInput(array $data): ?string
{
    try {
        validateMaxLength((string) $data['name'], 100, 'name');
        validateDate((string) $data['date'], 'date');
        validateNonNegativeNumber($data['quantity'], 'quantity');
        validateNonNegativeNumber($data['energy'], 'energy');
        foreach (['protein', 'fat', 'carb', 'salt'] as $field) {
            if ($data[$field] !== null) {
                validateNonNegativeNumber($data[$field], $field);
            }
        }
    } catch (HttpException $e) {
        return $e->getMessage();
    }

    foreach (['quantity', 'energy', 'protein', 'fat', 'carb', 'salt'] as $field) {
        if ($data[$field] !== null && (float) $data[$field] > 9999) {
            return "{$field} の値が大きすぎます（上限9999）";
        }
    }

    return null;
}
