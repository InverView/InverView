# 修正内容の確認 (Walkthrough)

## 📌 変更の概要
本修正では、インターネット未接続時に表示される Fluent Design 3 準拠のオフライン画面を追加し、Invidious Companion API のデフォルトURLを動的に疎通確認してフォールバックするロジックを実装しました。

## 🔍 変更点一覧

### 1. 多言語対応 (`src/i18n/resources/ja.ts` & `en.ts`)
- [x] オフライン画面で使用する日本語・英語テキストリソースを追加。

### 2. 接続状態フック (`src/hooks/useOnlineStatus.ts`)
- [x] `navigator.onLine` を追跡するカスタムフックを新規作成。

### 3. オフライン画面コンポーネント (`src/components/OfflineView.tsx`)
- [x] Fluent UI v9 を使用した、アニメーション付きの美しいガラスモルフィズム風オフライン画面を新規作成。

### 4. 起動時ロジックと統合 (`src/App.tsx`)
- [x] `companionMode` が `"default"` の場合に `https://companion.tsub4sa.xyz/health` へ自動疎通確認を行い、失敗時に `https://proxy.tsub4sa.xyz` へ自動フォールバックするロジックを `ThemeSync` に追加。
- [x] アプリ全体を覆うように `OfflineView` を統合。

---

## 🧪 検証結果
- [x] オンライン時に通常のルーティングと動画再生が問題なく動作することを確認。
- [x] オフライン時に美しいオフライン画面が表示され、かつ「再試行」ボタンが正しく機能することを確認。
- [x] `companionMode` がデフォルトの状態で起動し、自動疎通テストが行われURLが適切に切り替わることを確認。
