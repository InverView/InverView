# タスクリスト: オフライン画面の実装およびCompanion自動フォールバック

## [x] フェーズ1: ドキュメントと準備
- [x] SAFETY.mdの確認
- [x] 実装計画の策定
- [x] タスクリストの作成
- [x] 言語リソースの追加 (`src/i18n/resources/ja.ts` & `en.ts`)

## [x] フェーズ2: コアロジックの実装
- [x] オンライン状態を監視するカスタムフック (`src/hooks/useOnlineStatus.ts`) の新規作成
- [x] Companion URLの疎通確認および自動フォールバックロジック (`src/App.tsx`) の実装

## [x] フェーズ3: UIコンポーネントの実装
- [x] Fluent Design 3準拠のオフライン画面 (`src/components/OfflineView.tsx`) の新規作成
- [x] `App.tsx` への `OfflineView` の統合と表示確認

## [x] フェーズ4: 動作検証と仕上げ
- [x] walkthrough.mdの更新・最終確認
- [x] オフライン状態での画面表示・再試行ボタンの動作検証
- [x] ダークモード/ライトモード、AMOLEDモード、レスポンシブ（モバイルビュー）での視認性とレイアウト崩れチェック
- [x] Companion URL自動フォールバック機能の動作確認
