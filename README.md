# favorite-map-app

favorite-map-app は、Next.js フロントエンドと MCP サーバー／クローラを組み合わせたモノレポ構成のアプリケーションです。段階的な実装手順は `documents/Imple.md` を参照してください。

## プロジェクトの進行状況（スナップショット）

### Stage 0 — 開発環境の準備
- Node.js（LTS）と pnpm のインストールは完了
- Google Cloud プロジェクトの作成と Maps / Places API の有効化は未対応
- PostgreSQL（PostGIS 対応）インスタンスの準備は未対応
- `.env.example` の雛形作成は未対応
- VS Code の ESLint / Prettier / Tailwind プラグイン導入は完了

### Stage 1 — モノレポのひな型
- ルートの `package.json` を初期化済み
- TurboRepo と pnpm ワークスペース設定（`turbo.json`, `pnpm-workspace.yaml`）を作成済み
- `apps/`, `packages/`, `infra/`, `scripts/`, `tests/` など基本ディレクトリを作成済み
- `packages/config` に共有の ESLint / Prettier 設定を配置済み
- 本 README に進捗概要を記載済み

最新の進捗は `documents/Imple.md` と合わせて管理してください。

## よく使うコマンド

```bash
# 依存関係のインストール
source ~/.zshrc && pnpm install

# TurboRepo の開発タスクを起動
pnpm dev

# eslint / test（各パッケージを追加したら有効にする）
pnpm lint
pnpm test
```

フォルダ構成やアーキテクチャ、DB 設計については `documents/folorders.md`、`documents/ark.md`、`documents/db.md` を参照してください。
