# タスク: Companion 設定のアップデート

Invidious Companion の設定を改善し、インスタンス運営者が簡単に設定できるようにします。

## 完了定義
- [ ] Companion URL のデフォルトが `window.location.origin + "/proxy/"` になっていること。
- [ ] 設定画面に「Companion モード」の選択肢が追加されていること。
- [ ] 「Invidious 運営者用」の選択肢が追加され、選択時に `.env` のシークレットキーと `/proxy/` URL が自動適用されること。
- [ ] `.env.example` に `VITE_COMPANION_SECRET` が追加されていること。
