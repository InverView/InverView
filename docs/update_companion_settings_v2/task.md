# タスク: Companion 設定の簡略化

Companion 設定から「運営者用」の選択肢を削除し、デフォルト設定で環境変数のシークレットを使用するように変更します。

## 完了定義
- [ ] 設定画面から「Invidious 運営者用」の選択肢が削除されていること。
- [ ] 「Default (インスタンス推奨)」を選択した際に、`.env` の `VITE_COMPANION_SECRET` が自動的に適用されること。
- [ ] `CompanionMode` 型から `operator` が削除されていること。
