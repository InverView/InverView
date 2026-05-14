# タスク: Companion URL の設定化

固定されていた `/proxy/` URL を削除し、`.env` からデフォルトの Companion URL を指定できるようにします。

## 完了定義
- [ ] `defaults.ts` の `companionUrl` が `VITE_COMPANION_URL` を優先的に使用するようになっていること。
- [ ] 設定画面の「Default」モード選択時に、`VITE_COMPANION_URL` が適用されること。
- [ ] `.env.example` に `VITE_COMPANION_URL` が追加されていること。
