# フロントエンド用プロキシの追加

フロントエンドから Invidious Companion への通信を仲介し、CORS 問題の回避や Secret Key の隠蔽を行うためのバックエンドプロキシサーバーを追加します。

## タスク

- [x] サーバー用依存関係のインストール (`fastify`, `@fastify/http-proxy`, etc.)
- [x] `/server/index.ts` の作成（プロキシロジックの実装）
- [x] `package.json` に `server` スクリプトを追加
- [ ] 環境変数の設定（`.env` に `COMPANION_URL` と `COMPANION_SECRET` を設定）
- [ ] 動作確認
