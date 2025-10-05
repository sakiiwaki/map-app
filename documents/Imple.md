# favorite-map-app Implementation Roadmap

初心者でも段階的に進められるよう、Next.js のハンズオン風に小さなゴールを積み重ねる手順を用意しました。`documents/folorders.md` と `documents/ark.md`、`documents/db.md`、`documents/RDD.md` の内容を参照しながら進めてください。

## Stage 0 — 開発環境の準備
- [x] Node.js (推奨: LTS) と pnpm をインストールする。
- [ ] Google Cloud プロジェクトを作成し、Maps JavaScript API / Places API を有効化。API Key を控える。
- [ ] Supabase など PostgreSQL (PostGIS 対応) を用意し、接続文字列を確認する。
- [ ] `.env.example` の雛形を `documents/folorders.md` を参考に作成し、`GOOGLE_MAPS_API_KEY`, `DATABASE_URL`, `NEXTAUTH_SECRET` などを記載する。
- [ ] VS Code + ESLint/Prettier/Tailwind 用プラグインを導入。

## Stage 1 — モノレポのひな型を用意
目的: リポジトリの骨組みを作り、TurboRepo / pnpm Workspace を設定する。
- [ ] `pnpm init` でルートの `package.json` を作成。
- [ ] `pnpm dlx create-turbo@latest` などを参考に、`turbo.json` と `pnpm-workspace.yaml` をセットアップ。
- [ ] `documents/folorders.md` に沿って `apps/web`, `apps/mcp-server`, `apps/crawler`, `packages/*`, `infra`, `scripts`, `tests` を空ディレクトリでも良いので配置。
- [ ] ルートに ESLint/Prettier 設定を置き、`packages/config` をシンボルとして使う準備をする。
- [ ] `README.md` に Stage 進行表を簡単に記載し、タスク管理できるようにする。

## Stage 2 — Next.js (apps/web) の最小ページ
目的: App Router を理解しながらトップページを表示できるようにする。
- [ ] `pnpm create next-app --example with-tailwind apps/web` のように Next.js プロジェクトを作成。
- [ ] `documents/folorders.md` の構成に合わせて `app/`, `components/`, `features/`, `lib/` を作成。
- [ ] `app/page.tsx` に静的な “Favorite Map App” の見出しを表示する。
- [ ] `app/layout.tsx` で簡単なヘッダー/フッターを配置し、`globals.css` を読み込む。
- [ ] `pnpm --filter web dev` が立ち上がることを確認。

## Stage 3 — 地図 UI の仮表示
目的: Google Maps を画面に表示し、`features/map` に処理を逃がす。
- [ ] `lib/google-maps.ts` に Maps JavaScript API を読み込むヘルパーを作成。
- [ ] `components/map/MapCanvas.tsx` を作り、`'use client'` を明記して Google Maps を初期化。
- [ ] `features/map` に `useMapLoader` カスタムフックを置き、API Key 取得とロード状態を管理。
- [ ] トップページで MapCanvas を配置し、地図が表示されることを確認。
- [ ] この段階ではダミーの中心座標 (例: 東京駅) をハードコードしてOK。

## Stage 4 — 認証とルーティングの整理
目的: `(public)` と `(authenticated)` グループを使い、ログイン UI を分離。
- [ ] `app/(public)/login/page.tsx` に仮のログインフォームを置く。
- [ ] `app/(authenticated)/layout.tsx` を作成し、`SessionProvider` (NextAuth) のセットアップを記述。まだバックエンド接続がない場合はモックセッションで代用。
- [ ] `middleware.ts` で `/` アクセス時に未ログインなら `/login` にリダイレクトする仮ロジックを実装。
- [ ] `packages/shared-types` に `UserSession` の最小型を定義し、フロント・サーバー間で共通利用する準備。

## Stage 5 — MCP サーバーのモック API
目的: フロントと API の疎通を整え、UI からリクエストできるようにする。
- [ ] `apps/mcp-server` に Fastify か Express を初期化 (`pnpm --filter mcp-server dev` で動く状態)。
- [ ] `routes/search.ts` を作成し、今はローカルのダミーデータを返すエンドポイント `GET /api/places/search` を実装。
- [ ] `services/searchService.ts` にビジネスロジックを置き、今はダミー配列を返すだけにする。
- [ ] `apps/web/lib/api-client.ts` で MCP サーバーを叩く fetch ラッパーを用意。
- [ ] トップページに検索フォームを配置し、文字列を入力するとダミー結果がリスト表示されることを確認。

## Stage 6 — Prisma + PostgreSQL 接続
目的: 実データを DB に保存/取得できるようにする。
- [ ] `apps/mcp-server/prisma/schema.prisma` を作成し、`documents/db.md` の Stage 1 必須テーブル（`users`, `places`, `features`, `place_features`, `favorites` など）を定義。
- [ ] `pnpm --filter mcp-server prisma migrate dev` でマイグレーションを実行。
- [ ] `repositories/placesRepository.ts` などを作り、Prisma 経由で `places`/`place_features` を取得。
- [ ] `services/searchService.ts` で DB を参照するように切り替え。
- [ ] フロントから検索して、DB に事前投入したダミーデータが表示されることを確認。

## Stage 7 — Crawler & Feature Extraction (MVP)
目的: クロールエンジンと特徴抽出の最小ループを組み込む。
- [ ] `apps/crawler` に Node.js プロジェクトを作成し、BullMQ などでキューを初期化。
- [ ] `documents/db.md` の `crawl_targets`, `crawl_runs`, `crawl_contents` を Prisma に追加し、マイグレーション。
- [ ] `fetchers` で対象 URL を HTTP GET し、簡易 HTML を `crawl_contents` に保存。
- [ ] `packages/nlp` にルールベース抽出の関数を作り、`power_outlet` などを判定。
- [ ] 判定結果を MCP サーバーの `place_features` に保存し、`feature_sources` で出典を管理。
- [ ] フロントの検索結果に「コンセントあり」のフィルタを追加し、抽出結果を UI に表示。

## Stage 8 — 管理 UI & フィードバック
目的: 管理者が抽出結果をレビューできるようにする。
- [ ] `app/(admin)/page.tsx` を作成し、管理者ロールのみアクセスできるように `middleware.ts` で制御。
- [ ] `apps/mcp-server/routes/admin.ts` を追加し、`feature_feedback` や `crawl_runs` の一覧 API を提供。
- [ ] 管理画面で抽出結果に対して正誤フラグとメモを保存できるフォームを実装。
- [ ] `feature_feedback` を収集し、`feature_inferences` やモデル再学習のトリガーを記録。

## Stage 9 — 共有・通知・最適化
目的: 将来の共有機能や運用面を強化する。
- [ ] `collections`, `collection_members`, `collection_places` を使って共有リストを作成。UI で招待・閲覧が可能か確認。
- [ ] Redis キャッシュを導入し、`place_features` 更新時に無効化する仕組みを実装。
- [ ] GitHub Actions による CI を設定し、`pnpm lint`, `pnpm test`, `pnpm build` を実行。
- [ ] `infra/docker` で `docker-compose` を整備し、ローカルでフロント/MCP/DB/Redis が一括起動できるようにする。

## Stage 10 — 振り返りと次のステップ
- [ ] ドキュメント（`documents/folorders.md`, `ark.md`, `db.md`, `Imple.md`）を最新の実装状態に合わせて更新。
- [ ] 未着手の RDD 要件（リアルタイム共有、LLM 精度改善など）を洗い出し、次のイテレーション計画に追加。
- [ ] 開発フローで困った点や学んだことを `README.md` やチームノートに記録。

各ステージは 1～2 日の作業量を目安に想定しています。完了後は Git のブランチを切り、Pull Request でレビューできる形にまとめると進捗管理がスムーズになります。
