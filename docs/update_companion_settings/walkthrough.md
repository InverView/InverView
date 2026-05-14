# 修正内容の確認: Companion 設定のアップデート

## 実施した変更

### 1. 型定義の更新
- `src/settings/types.ts` に `CompanionMode` 型 (`"default" | "operator" | "custom"`) を追加しました。
- `AppSettings` インターフェースに `companionMode` フィールドを追加しました。
- `src/hooks/useSettings.ts` で `CompanionMode` をエクスポートするように修正しました。

### 2. デフォルト設定の更新
- `src/settings/defaults.ts` において、`companionUrl` のデフォルト値を `window.location.origin + "/proxy/"` に変更しました。これにより、標準的な構成では特別な設定なしでプロキシが利用可能になります。
- `companionMode` のデフォルトを `"default"` に設定しました。

### 3. 設定画面 (SettingsPage) の改善
- 「Invidious Companion」セクションに「Companion モード」の選択肢を追加しました。
    - **Default (インスタンス推奨)**: URL を `/proxy/` に、シークレットを空に設定します。
    - **Invidious 運営者用**: URL を `/proxy/` に設定し、`.env` (VITE_COMPANION_SECRET) からシークレットキーを自動的に読み込みます。
    - **カスタム**: 任意の URL とシークレットキーを手動で入力できます（これを選択した場合のみ入力フィールドが有効になります）。

### 4. 環境変数の追加
- `.env.example` に `VITE_COMPANION_SECRET` を追加しました。

## 動作確認のポイント
- 設定画面で「Companion モード」を切り替えた際、URL と Secret Key のフィールドが適切に更新・無効化されることを確認してください。
- 「Invidious 運営者用」を選択した際に、運営者が `.env` に設定したシークレットキーが適用されることを確認してください。
