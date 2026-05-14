# 修正内容の確認 - フロントエンド用プロキシ

フロントエンド開発を支援するためのローカルプロキシサーバーを追加しました。

## 修正内容の要約

- **`server/index.ts` の新設**:
    - Fastify を使用したプロキシサーバーを実装しました。
    - `COMPANION_URL` へのプロキシ機能と、`Authorization` ヘッダーの自動付与機能を備えています。
- **依存関係の追加**:
    - `fastify`, `@fastify/http-proxy`, `@fastify/cors`, `dotenv`, `tsx` をプロジェクトに追加しました。
- **npm スクリプトの追加**:
    - `npm run server` でプロキシサーバーを起動できるようになりました。

## 動作確認の手順

1. **環境変数の準備**: `.env` ファイルに `COMPANION_URL` と `COMPANION_SECRET` が設定されていることを確認してください。
2. **サーバーの起動**: ターミナルで `npm run server` を実行し、`Proxy server listening on http://localhost:8282` と表示されることを確認します。
3. **フロントエンドの設定変更**: アプリの設定画面で、Companion URL を `http://localhost:8282` に変更してください（Secret Key は空でもプロキシが補完します）。
4. **再生確認**: 動画再生を行い、正常にマニフェストとセグメントが読み込まれることを確認してください。
