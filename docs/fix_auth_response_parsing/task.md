# タスク: 登録チャンネル/プレイリスト取得の不具合修正

## 目的
Invidious API の認証が必要なエンドポイント（`/auth/subscriptions`, `/auth/playlists`）において、データが配列として返される場合に正常に表示されない問題を修正する。

## サブタスク
- [x] `invidious.ts` の型定義を、API の実態（配列を直接返す）に合わせて更新。
- [x] `SubscriptionsPage.tsx` のデータアクセスを修正。
- [x] `AuthPlaylistsPage.tsx` のデータアクセスを修正。
- [x] 他の認証エンドポイント（`/auth/feed`）の整合性を確認。
