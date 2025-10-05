# favorite-map-app 推奨フォルダ構成

RDD で整理したフロント/サーバー/データ収集/ML の各機能を、モノレポとして扱う前提のフォルダ構成案です。Next.js App Router を核に、MCP サーバーとクロールワーカーを別アプリとして並列管理します。

```
favorite-map-app/
├─ documents/                    # 仕様書や議事録などのドキュメント
├─ apps/                         # 実行可能なアプリケーション群
│   ├─ web/                      # Next.js フロントエンド（App Router）
│   │   ├─ app/                  # ルーティングとページのエントリ
│   │   │   ├─ layout.tsx        # 全ページ共通のレイアウト
│   │   │   ├─ page.tsx          # "/" のトップ（マップ検索）
│   │   │   ├─ loading.tsx       # グローバルローディング UI
│   │   │   ├─ error.tsx         # グローバルエラーバウンダリ
│   │   │   ├─ (public)/         # ログイン不要の画面
│   │   │   │   ├─ login/page.tsx
│   │   │   │   └─ about/page.tsx
│   │   │   ├─ (authenticated)/  # 認証が必要な画面グループ
│   │   │   │   ├─ layout.tsx    # SessionProvider などで保護
│   │   │   │   ├─ dashboard/    # マップ検索 + 結果リスト
│   │   │   │   │   ├─ page.tsx
│   │   │   │   │   ├─ favorites/page.tsx
│   │   │   │   │   └─ keywords/page.tsx
│   │   │   │   └─ account/page.tsx
│   │   │   ├─ (admin)/          # 管理ダッシュボード（将来的に追加）
│   │   │   │   └─ page.tsx
│   │   │   ├─ api/              # Next.js Route Handlers（例: NextAuth, Webhook）
│   │   │   │   ├─ auth/[...nextauth]/route.ts
│   │   │   │   ├─ proxy/places/route.ts   # MCP サーバーへの API プロキシ
│   │   │   │   └─ webhooks/route.ts
│   │   │   └─ not-found.tsx     # 404 ページ
│   │   ├─ components/           # 再利用 UI（フォルダで役割分割）
│   │   │   ├─ layout/           # ヘッダー・フッターなど
│   │   │   ├─ ui/               # Button, Dialog などの汎用品
│   │   │   └─ map/              # Google Maps 専用コンポーネント
│   │   ├─ features/             # ドメイン単位の状態とロジック
│   │   │   ├─ map/              # ピン描画・現在地取得
│   │   │   ├─ filters/          # コンセント/Wi-Fi フィルタ UI と状態
│   │   │   ├─ keywords/         # タグ管理
│   │   │   ├─ favorites/        # お気に入り操作
│   │   │   └─ auth/             # 認証関連のラッパー
│   │   ├─ lib/                  # API クライアントやユーティリティ
│   │   │   ├─ api-client.ts     # MCP サーバーとの通信
│   │   │   ├─ google-maps.ts    # Maps JS API の初期化
│   │   │   └─ env.ts            # 環境変数の読み込み
│   │   ├─ hooks/                # `useXXX` カスタムフック
│   │   ├─ providers/            # Context Provider（Session, Theme など）
│   │   ├─ styles/               # グローバル以外の CSS Modules / Tailwind 構成
│   │   ├─ public/               # 画像やマニフェスト（Next.js の静的ディレクトリ）
│   │   ├─ tests/                # Playwright や Testing Library のテスト
│   │   │   ├─ e2e/
│   │   │   └─ unit/
│   │   ├─ types/                # 型定義（OpenAPI 由来の型など）
│   │   ├─ middleware.ts         # 認証チェックなどの共通ミドルウェア
│   │   ├─ next.config.js
│   │   ├─ package.json
│   │   ├─ tsconfig.json
│   │   └─ .env.example
│   ├─ mcp-server/               # 特徴抽出を担う MCP API サーバー
│   │   ├─ src/
│   │   │   ├─ index.ts          # アプリのエントリ（Fastify / Express）
│   │   │   ├─ config/           # 環境変数・設定ローダー
│   │   │   ├─ routes/           # REST/GraphQL エンドポイント
│   │   │   ├─ controllers/      # ルートごとの入出力整形
│   │   │   ├─ services/         # ビジネスロジック（検索・特徴マージ）
│   │   │   ├─ repositories/     # DB アクセス層（Prisma など）
│   │   │   ├─ clients/          # Google/LLM/API クライアント
│   │   │   ├─ jobs/             # バッチ・スケジューラー処理
│   │   │   ├─ schemas/          # Zod/JSON Schema によるバリデーション
│   │   │   └─ utils/
│   │   ├─ prisma/schema.prisma  # DB スキーマ
│   │   ├─ tests/                # ユニット・API テスト
│   │   └─ Dockerfile
│   └─ crawler/                  # クロール・スクレイピングワーカー
│       ├─ src/
│       │   ├─ index.ts          # ワーカーエントリ
│       │   ├─ config/
│       │   ├─ queue/            # BullMQ 等のジョブキュー設定
│       │   ├─ fetchers/         # Puppeteer/Playwright ラッパー
│       │   ├─ extractors/       # テキスト抽出・正規化
│       │   ├─ pipelines/        # クロール → NLP 連携処理
│       │   └─ storage/          # 保存処理（S3, Supabase Storage 等）
│       ├─ tests/
│       └─ Dockerfile
├─ packages/                     # サービス横断で共有するライブラリ
│   ├─ shared-types/             # API スキーマや型定義（tRPC/Zod の再利用）
│   ├─ api-client/               # MCP API を呼び出す共通クライアント
│   ├─ ui/                       # デザインシステム（共通コンポーネント）
│   ├─ config/                   # eslint/prettier/tailwind 設定共有
│   └─ nlp/                      # NLP プロンプト・分類ロジックの共通化
├─ infra/                        # インフラ構成管理
│   ├─ docker/                   # 各サービスの docker-compose.*.yml
│   ├─ k8s/                      # 将来的な Kubernetes マニフェスト
│   └─ terraform/                # クラウドインフラ IaC（必要なら）
├─ scripts/                      # 開発・デプロイ補助スクリプト
├─ tests/                        # クロスサービスの統合/E2E テスト
├─ .github/workflows/            # CI/CD パイプライン
├─ package.json                  # モノレポ全体の依存管理（pnpm/npm/yarn）
├─ pnpm-workspace.yaml           # ワークスペース設定（pnpm を想定）
├─ turbo.json                    # タスクランナー（TurboRepo）設定
└─ README.md                     # プロジェクトの概要とセットアップ手順
```

## apps/web 配下のポイント
- `app/` は URL ごとにフォルダを作る App Router の要。`(public)` や `(authenticated)` のような丸括弧フォルダは「ルートグループ」で、URL には現れずアクセス制御の整理に使えます。
- 認証が必要なページは `app/(authenticated)/layout.tsx` で `SessionProvider` や認可チェックを行い、子ページをまとめて保護します。
- `features/` では UI と状態管理（Zustand/Recoil など）・ビジネスロジックを同居させ、画面ごとの責務を明確にします。`components/` は純粋な見た目専用に留めると保守しやすくなります。
- `lib/api-client.ts` から MCP サーバーにアクセスし、`packages/shared-types` の型でレスポンスを扱うとフロントとサーバーの整合性が保てます。
- `providers/` にはテーマ、認証、地図 SDK などアプリ全体で 1 回だけ初期化したいコンテキストを配置します。
- `tests/` フォルダは Playwright などの E2E、React Testing Library のコンポーネントテストを分けて置けるようにしています。

## Next.js 初心者向けメモ
- App Router では各フォルダの `page.tsx` がそのままページになります。`layout.tsx` は同じ階層以下のページで共有され、入れ子にできます。
- `loading.tsx` を置くとその階層以下のページが読み込み中に自動表示され、`error.tsx` はエラー時にレンダリングされます。`not-found.tsx` は 404 専用です。
- コンポーネントはデフォルトでサーバーコンポーネントです。ブラウザ API を使う場合はファイル先頭に `'use client'` を書いてクライアントコンポーネントに切り替えます。
- サーバーサイドのデータ取得はサーバーコンポーネントで `fetch` するか、`app/api` 配下に Route Handler を作ってフロントから呼び分けます。外部通信はまず MCP サーバー側で集約する想定ですが、NextAuth のセッションや Webhook など Next.js で完結させたい処理はここに置きます。
- `middleware.ts` はリクエストごとに実行され、認証トークンの検証やロケール切り替えに使えます。App Router の任意のルートにリダイレクトさせる場合にも有効です。
- `public/` フォルダのファイルは `https://.../ファイル名` でそのまま配信されます。ロゴや PWA マニフェスト、OGP 画像などをここに置きます。
- `.env.example` に必要な環境変数（Google API Key、NEXTAUTH_SECRET など）を列挙し、`lib/env.ts` で必須チェックを行うと安全です。

## バックエンドとワーカーの分担
- `apps/mcp-server` は Google Places からのデータとクロール済みの特徴量を突き合わせ、検索 API (`GET /api/places/search`) やユーザー設定 API を提供します。`jobs/` で定期処理を管理し、`clients/` で Google API や LLM を呼び出します。
- `apps/crawler` はキューに入った URL を取得し、`extractors/` でテキスト化した後に `pipelines/` で NLP へ受け渡します。処理結果は DB やストレージに保存し、完了イベントを MCP サーバーに通知します。
- `packages/nlp` ではルールベース抽出や LLM プロンプトを共有し、サーバーとワーカーの双方から再利用します。

## 推奨開発フロー（例）
- まず `apps/web` の `app/` に最低限の `/` ページと `components/ui` を用意し、Google Maps を表示できるようにします。
- 並行して `apps/mcp-server` の `routes/search` と `services/searchService` をモックデータで実装し、フロントからフェッチできるようにします。
- MVP が動いたら `apps/crawler` と `packages/nlp` に簡易キーワード抽出を追加し、MCP サーバー経由でフィルタリングを拡張します。
- 最後に `tests/` と CI (`.github/workflows/`) を整備し、主要フローの自動テストを追加します。
