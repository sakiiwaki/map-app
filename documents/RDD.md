# Maps + MCP サーバー設計仕様書

> 目的: Next.js フロント（Google Maps UI風）と自前の MCP サーバーを組み合わせ、店舗の公式Webやレビューから「コンセント有無／Wi‑Fi有無／禁煙等」の特徴を自動抽出してフィルタ検索できるアプリを、CodexAI 等でそのまま実装可能なレベルでまとめる。

---

## 1. 要約（概要）

* ユーザーはキーワード（例: サウナ、カヌレ）を事前登録。
* 検索時に Google Places から候補を取得し、MCPサーバーで収集した追加メタ（公式Webやレビューから判定した特徴）を合成してマップ上に表示。
* ユーザーはフィルター（例: コンセントあり、Wi‑Fiあり、評価4.0以上）で絞り込み可能。
* 初期は個人利用（プライベート）、将来は共有機能を追加予定。

---

## 2. 主要機能（要件）

### 2.1 フロント（Next.js）

* Google Maps 風の地図表示（Places/Maps JavaScript API 使用）
* 検索バー（自然言語検索を将来的にサポート）
* マップ上のスポットピン（タグ・アイコン表示）
* 検索フィルターUI（チェックボックス / スライダー 等）
* キーワード（タグ）管理画面（公開/非公開トグル）
* お気に入り管理（アプリ内保存 + 可能なら Google マップへの同期）
* 会員管理UI（プロフィール、接続済み OAuth）

### 2.2 バックエンド（MCPサーバー）

* Places API 経由で得られる基本データの受け取りとキャッシュ
* 公式Web、レビューサイト、SNS 等からの追加テキスト取得（スクレイピング or API）
* NLP/LLM を用いた「特徴抽出（電源あり|Wi‑Fi|禁煙|ペット可|駐車場 等）」
* 抽出結果と Google データのマージ（正規化）
* 検索API（フィルタリング、ランキング、ページング）
* バッチ/スケジューラー（新規店の定期クロールと再評価）
* ユーザー固有のデータ保存（キーワード、履歴、お気に入り、公開設定）
* 共有機能（招待/公開リスト）、リアルタイム更新（WebSocket または Webhook）

### 2.3 管理機能

* 管理ダッシュボード（クロール状況、判定モデルのログ、誤判定レビュー）
* 手動修正インターフェース（誤検知を人が修正して学習データに反映）

---

## 3. 使用技術スタック（推奨）

* フロントエンド: Next.js (App Router or Pages Router) + TypeScript
* マップ: Google Maps JavaScript API / Places API
* 認証: NextAuth.js または Firebase Auth（Google/Apple/OAuth）
* DB: PostgreSQL（例: Supabase）
* キャッシュ: Redis
* MCP サーバー: Node.js (Fastify/Express) or Go (Gin)、コンテナ化
* スクレイピング: Puppeteer / Playwright（JS）または Python (Requests + BeautifulSoup + Playwright)
* NLP/LLM: (選択肢)

  * オプションA: 既存のクラウドLLM (OpenAI GPT-4/Claude 等) を API 呼び出しで利用
  * オプションB: 自前で LLM をホスト (Llama2, Mistral 等) + 軽量分類ヘッド（推論サーバー）
* モデル推論: LangChain 風のラッパー、または直接 API 呼び出し
* コンテナ管理/オーケストレーション: Docker + Docker Compose (小規模) / Kubernetes (スケール時)
* CI/CD: GitHub Actions
* ロギング/監視: Prometheus + Grafana or Sentry

---

## 4. MCP サーバーの詳細要件（特徴抽出にフォーカス）

### 4.1 データソース

* Google Places API の place_id をキーとして基本情報取得
* 公式Webサイト（店舗ページ）
* 大型レビューサイト（例: 食べログ、Retty、Yelp 等：各サイトのポリシーに従う）
* Google レビュー（Places API で入手可能な限り）
* SNS（Instagram, Twitter）の公開ポスト（任意）

### 4.2 クロール設計

* クロール用ワーカーを分離（Docker コンテナ）
* 各店舗はクロール対象URLをキューに入れ、Worker が順に処理
* レート制限・robots.txt 尊重
* HTML→プレーンテキスト抽出（メタデータ、構造化データ／schema.org の利用を優先）
* 取得した生データは原文（raw_html, raw_text）として保存

### 4.3 NLP/特徴抽出パイプライン

* 前処理: HTML除去、テキスト正規化、言語検出
* 検出対象の特徴（初期セット）:

  * `power_outlet`（コンセント）
  * `wifi`（Wi‑Fi）
  * `smoking`（喫煙/禁煙）
  * `pet`（ペット可）
  * `parking`（駐車場）
  * `power_speed`（電源の多さ/席数に対する割合）
  * `quietness`（静かさ、ノイズに関する言及）
* 判定方法（ハイブリッド推奨）:

  1. ルールベースのキーワード抽出（まずは軽量で速い）
  2. LLM を用いた分類器で精度向上（プロンプト設計またはファインチューニング）
  3. 結果の信頼度スコア（0..1）を生成して DB に保存
* 出力フォーマット（例）:

  ```json
  {
    "place_id": "ChIJ...",
    "features": {
      "power_outlet": {"value": true, "score": 0.92, "sources": ["official_site","review_123"]},
      "wifi": {"value": false, "score": 0.15, "sources": ["review_45"]}
    },
    "last_crawled_at": "2025-09-27T12:34:56Z"
  }
  ```

### 4.4 学習と改善ループ

* 手動フィードバック（管理者 UI）で正誤フラグを付与
* フラグ付きデータを使ってルール更新 or モデル再学習
* 新しいキーワード／特徴を追加するためのインターフェース

---

## 5. DB スキーマ（例）

> 下記は PostgreSQL の簡易スキーマ案。実装時に調整。

* `users` (id, email, name, oauth_provider, created_at, ...)
* `user_keywords` (id, user_id, keyword, is_public, created_at)
* `places` (place_id PK, name, address, lat, lng, google_rating, google_user_ratings_total, raw_google_data, last_google_sync)
* `place_features` (id, place_id FK, feature_key, value_boolean, score_float, sources_json, last_crawled_at)
* `favorites` (id, user_id FK, place_id FK, created_at)
* `crawls` (id, place_id FK, url, raw_html, raw_text, status, crawled_at)
* `feature_audit` (id, place_id, feature_key, predicted_value, corrected_value, user_id, reason, created_at)

---

## 6. API 設計（主要エンドポイント）

### 6.1 認証

* `POST /api/auth/session` — NextAuth でハンドリング

### 6.2 Places

* `GET /api/places/search?q={query}&lat={}&lng={}&radius={}&filters={json}`

  * フィルタ例: `{ "power_outlet": true, "wifi": true, "min_rating": 4.0 }`
* `GET /api/places/{place_id}` — マージ済みの place + features を返却
* `POST /api/places/{place_id}/favorite` — お気に入り登録

### 6.3 Crawling / Feature

* `POST /api/internal/crawl` — 管理者用：クロールジョブをキューに追加（body: place_id, url）
* `GET /api/internal/feature/{place_id}` — 抽出結果の取得（管理用）

### 6.4 Admin

* `GET /api/admin/jobs` — クロール・解析ジョブの状態
* `POST /api/admin/retrain` — モデル再学習トリガー（必要に応じて）

---

## 7. UI（画面）構成（MVP優先順）

1. サインイン / サインアップ（Google OAuth）
2. マップ検索画面（検索バー + 検索結果リスト + フィルタ）
3. キーワード管理（公開/非公開トグル）
4. お気に入り一覧
5. 管理ダッシュボード（クロールログ / 抽出サマリ）

---

## 8. 実装手順（大まかなステップ）

> 各ステップは CodexAI に投げられるタスク単位で分割可能

### フェーズ0 — 準備

* プロジェクトリポジトリ作成（GitHub）
* モノレポ or サービス分離を決定（例: `frontend/`, `mcp-server/`, `crawler/`）
* Dockerfile & Docker Compose の骨格作成
* 環境変数設計（Google API Key, DB URL, REDIS_URL, LLM_API_KEY 等）

### フェーズ1 — MVP（最小限の動くもの）

1. Next.js フロント基本（地図表示 + 検索バー）

   * Google Maps JS を組み込み、手動で place_id を表示できるようにする
2. MCP サーバー：Places 結合 API

   * `GET /api/places/search` を実装し、Google Places の結果を返す（キャッシュあり）
3. ユーザー / キーワード管理（DB テーブル + API）
4. フィルタ UI（最小限）と検索結果表示

### フェーズ2 — クロール & 単純抽出

1. Crawl Worker の実装（Puppeteer を利用）
2. 公式サイトと Google レビューのテキストを保存
3. ルールベース抽出（キーワードマッチ）で `power_outlet` 等を判定
4. フロントからフィルタで絞れるように API を拡張

### フェーズ3 — LLM 導入 & 精度改善

1. LLM（外部 API or 自ホスト）を呼び出して抽出精度を向上

   * プロンプトテンプレート作成（例: "次の店舗説明から 'コンセント' があるか判定してください。理由を出力してください。"）
2. 判定結果の信頼度とソースを保存
3. 管理 UI で誤判定をレビューできるようにする

### フェーズ4 — 運用・共有機能・最適化

1. 共有リスト / 招待機能
2. 定期クロールのスケジューリング（Celery / BullMQ 等）
3. キャッシュとレスポンス最適化（Redis, Indexing）
4. モニタリングとアラート設定

---

## 9. 実装時の注意点（法務・運用）

* 各サイトのスクレイピングは利用規約と robots.txt を厳守すること。
* Google Places 等の再配布ポリシーに注意（キャッシュ・表示要件）。
* 個人データを扱う場合（ユーザー情報・レビューの断片等）はプライバシーポリシーとデータ保持方針を定める。
* LLM を外部 API で利用する場合、送信するデータに機密情報が含まれないよう管理する。

---

## 10. テスト計画（概要）

* 単体テスト: 各 API / NLP モジュール
* E2E テスト: Next.js UI から検索→フィルタの流れ
* データ品質テスト: 抽出ラベルの精度検証（サンプルセットで定期的に評価）
* ロードテスト: クロールワーカーと MCP API の同時リクエスト耐性

---

## 11. サンプル実装スニペット（参考）

* `GET /api/places/search` のレスポンス設計（JSON スキーマ）

```json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Cafe Example",
      "lat": 35.658,
      "lng": 139.701,
      "google_rating": 4.2,
      "google_user_ratings_total": 120,
      "features": {
        "power_outlet": {"value": true, "score": 0.92},
        "wifi": {"value": true, "score": 0.88}
      }
    }
  ],
  "paging": {"limit": 20, "offset": 0, "total": 123}
}
```

---

## 12. 将来拡張アイデア

* ユーザー行動（お気に入り/滞在時間）から個人化スコアを付与
* 画像解析で店内の電源コンセントの有無を判定（写真アップロード or SNS 画像）
* コミュニティタグ（ユーザー同士で『電源良い』を評価）

---

## 13. 開発タスク例（CodexAI に投げる粒度）

* `frontend: init nextjs + google maps integration`
* `mcp: init express + postgresql schema + redis connection`
* `crawler: puppeteer worker basic fetch + save raw_html`
* `nlp: rules-based extractor for power_outlet`
* `api: search endpoint merging google + feature data`
* `infra: docker-compose for frontend + mcp + db + redis`

---

## 14. 参考（チェックリスト）

* API Keys 環境変数管理
* robots.txt と レート制御
* ログとエラートラッキング
* モデルのコスト管理（LLM API 利用料）

---

## 付録A: 早期MVPでの簡易アルゴリズム例（コンセント判定）

1. 公式サイト本文 or レビュー本文に対してキーワード検索（例: "電源", "コンセント", "充電"）
2. 出現頻度・文脈（例: "電源が無い" の否定語検出）をルールで判定
3. 上記で不確実な場合は LLM（プロンプト: “次のテキストから '電源' があるか Yes/No/Unknown を理由とともに返してください”）
4. 最終値はルール判定と LLM 判定の合算スコアで決定

