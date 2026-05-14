# 修正内容の確認: Companion URL の設定化

## 実施した変更

### 1. デフォルト値の柔軟な設定
- `src/settings/defaults.ts` を修正し、`companionUrl` のデフォルト値として環境変数 `VITE_COMPANION_URL` を使用するようにしました。未設定時のフォールバックは元の `https://companion.tsub4sa.xyz` に戻しました。

### 2. 設定画面の動作修正
- `SettingsPage.tsx` において、「Default」モードを選択した際に、特定のパス (`/proxy/`) を強制するのではなく、環境変数 `VITE_COMPANION_URL` で定義された値を適用するように変更しました。

### 3. 環境変数の追加
- `.env.example` に `VITE_COMPANION_URL` を追加しました。

## 動作確認のポイント
- `.env` ファイルに `VITE_COMPANION_URL` を設定し、設定画面で「Default」を選択した際にその URL が正しく反映されることを確認してください。
- 環境変数を設定していない場合は、標準のフォールバック URL が適用されることを確認してください。
