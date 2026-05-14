# 実装計画: 認証レスポンスのパース修正

## 概要
Invidious API v1 の一部の認証済みエンドポイントは、オブジェクトではなく配列を直接返却する。これに対応するため、型定義とデータ取得後のプロパティアクセスを修正する。

## 修正詳細

### 1. 型定義の修正 (`invidious.ts`)
- `AuthSubscriptionsResponse` を `ChannelObject[]` に変更。
- `AuthPlaylistsResponse` を `PlaylistObject[]` に変更。

### 2. ページコンポーネントの修正
- **`SubscriptionsPage.tsx`**: `data.subscriptions` へのアクセスを削除し、`data` を直接配列として扱うよう変更。
- **`AuthPlaylistsPage.tsx`**: `data.playlists` へのアクセスを削除し、`data` を直接配列として扱うよう変更。

## 期待される効果
- 登録チャンネルおよび自分のプレイリストが、API から正常に取得されている場合に正しく一覧表示されるようになる。
- 型安全性が向上し、将来的な API 仕様の変更にも気づきやすくなる。
