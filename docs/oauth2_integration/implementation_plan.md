# 実装計画: Invidious OAuth2.0 連携

## 概要
Invidious が提供する `/authorize_token` フローを利用して、クライアントサイドで完結する認証システムを構築する。

## 実装詳細

### 1. 認証フローの構築
- **ログインボタン:** 設定画面の「アカウント」セクションに配置。
- **リダイレクト先:** `[instanceUrl]/authorize_token`
- **パラメータ:**
    - `scopes`: `preferences`, `subscriptions*`, `playlists*`, `feed*`, `notifications*` を要求。
    - `callback_url`: 現在の設定ページ URL。

### 2. トークンの受け取りと保存
- `SettingsPage` のマウント時に `URLSearchParams` を使用して `token` パラメータをチェック。
- トークンが存在する場合、`setSetting("token", token)` を実行して永続化。
- `window.history.replaceState` を使用して、URL からトークンを削除し、セキュリティと見た目を確保。

### 3. UI フィードバック
- ログイン済みの場合は成功ステータスを表示し、「ログアウト」ボタンを提供。
- 未ログインの場合は「Invidious でログイン」ボタンを表示。

## セキュリティ考慮事項
- トークンはブラウザの `localStorage`（既存の設定保存の仕組み）に保存される。
- 通信は常に HTTPS（インスタンス設定に依存）で行われることを想定。
