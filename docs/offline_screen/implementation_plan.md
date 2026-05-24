# 実装計画: オフライン画面の実装およびCompanion自動フォールバック

本計画は、インターネット接続が失われた際にユーザーに分かりやすく美しいオフライン画面（Fluent Design 3準拠）を提示し、さらに Invidious Companion API の接続先URLをネットワーク状態に応じて自動で最適な方（`companion.tsub4sa.xyz` または `proxy.tsub4sa.xyz`）に切り替える仕組みを導入するものです。

---

## 🛠 1. 設計詳細

### A. オフライン画面 (`OfflineView.tsx`)
- **UIフレームワーク**: Fluent UI v9 (`@fluentui/react-components`) のデザインシステムを採用。
- **スタイリング**:
  - `makeStyles` と `tokens` を使用。
  - ガラスモルフィズム効果 (`backdrop-filter: blur(20px)`) を持たせたコンテナカード。
  - `WifiWarning48Regular` アイコンに心拍のような鼓動アニメーションを付与。
  - 美しいグラデーションテキストと影の効果。
- **機能**:
  - インターネットへの再接続を促すチェックリストの提示。
  - 「再試行」ボタン（クリック時に一時的にローディング表示にし、オンラインへの復帰をチェック）。
- **レスポンシブ**:
  - モバイル最優先（360px〜430px）のパディングやフォントサイズ設計。

### B. オンライン状態監視フック (`useOnlineStatus.ts`)
- `navigator.onLine` を使用して現在の接続状態を初期値とし、`window.addEventListener` で `online` / `offline` イベントを購読するシンプルなカスタムフック。

### C. Companion 自動フォールバックロジック
- アプリの起動（`App.tsx` 内の `ThemeSync` マウント時）に、`companionMode === "default"` の場合に限り、`https://companion.tsub4sa.xyz/health` へ GET リクエストを送信（タイムアウト3秒）。
- 疎通できれば `https://companion.tsub4sa.xyz` に設定し、疎通できない場合は `https://proxy.tsub4sa.xyz` に自動フォールバックする。

---

## 📅 2. スケジュールと作業ステップ
1. **ドキュメント作成**: 本計画書および `task.md` の作成。
2. **多言語リソース更新**: `src/i18n/resources/ja.ts` および `en.ts` にオフライン用テキストを追加。
3. **フック新規作成**: `src/hooks/useOnlineStatus.ts` の実装。
4. **コンポーネント新規作成**: `src/components/OfflineView.tsx` の実装。
5. **App.tsxの統合・修正**: オフライン監視、自動フォールバックロジックの統合。
6. **テストと検証**: オフライン状態およびフォールバックの動作検証。
