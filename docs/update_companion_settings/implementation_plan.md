# 実装計画: Companion 設定のアップデート

## 概要
Companion URL のデフォルト値を変更し、設定画面に運営者向けのプリセットオプションを追加します。

## 修正内容

### 1. 型定義の更新 (`src/settings/types.ts`)
- `CompanionMode` 型を追加 (`"default" | "operator" | "custom"`)。
- `AppSettings` に `companionMode` フィールドを追加。

### 2. デフォルト値の更新 (`src/settings/defaults.ts`)
- `companionUrl` のデフォルトを `window.location.origin + "/proxy/"` に変更。
- `companionMode` のデフォルトを `"default"` に設定。

### 3. 設定画面の更新 (`src/pages/SettingsPage.tsx`)
- Companion セクションにモード選択用の `Select` を追加。
- 各モードに応じた UI の切り替え（カスタムモード以外は入力を無効化、または自動補完）。
- 「Invidious 運営者用」選択時に `import.meta.env.VITE_COMPANION_SECRET` を適用するロジックの実装。

### 4. 環境変数の追加 (`.env.example`)
- `VITE_COMPANION_SECRET` を追加。

## 考慮事項
- `window.location.origin` は SSR (Server Side Rendering) 時には存在しないため、型チェックを含めて安全に処理します。
- シークレットキーが `.env` に設定されていない場合の挙動（空文字としての扱い）を考慮します。
