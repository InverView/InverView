# 実装計画 - フロントエンド用プロキシ

## 目的
フロントエンドブラウザから直接 Invidious Companion サーバーにリクエストを送る際の CORS 制約や、`Authorization` ヘッダーに必要な Secret Key の管理を簡素化・安全化するため、ローカルで動作するプロキシサーバーを導入します。

## 技術スタック
- **Framework**: Fastify (高速で軽量な Node.js フレームワーク)
- **Proxy**: `@fastify/http-proxy`
- **Runner**: `tsx` (TypeScript を直接実行)

## 実装詳細
1. **エンドポイント**:
   - `http://localhost:8282/companion/*` へのリクエストを `COMPANION_URL/companion/*` へ転送します。
2. **認証の自動付与**:
   - プロキシサーバー側で、環境変数 `COMPANION_SECRET` を使用して `Authorization: Bearer ...` ヘッダーを自動的に付加します。これにより、フロントエンド側で Key を持つ必要がなくなります。
3. **CORS 設定**:
   - 開発環境のフロントエンド（Vite）からのアクセスを許可するように設定します。

## 使用方法
1. `.env` ファイルに以下を設定します：
   ```
   COMPANION_URL=https://companion.tsub4sa.xyz
   COMPANION_SECRET=あなたのシークレットキー
   ```
2. 以下のコマンドでサーバーを起動します：
   ```
   npm run server
   ```
3. フロントエンドの設定（Companion URL）を `http://localhost:8282` に変更します。
