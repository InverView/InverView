# 購読チャンネル一覧高速化のタスクリスト

- [x] `SubscriptionsPage.tsx` に仮想化ロジックを追加する
  - [x] `@tanstack/react-virtual` から `useVirtualizer` のインポートを追加
  - [x] カラム数を判定するための `containerWidth` の監視ロジックを追加
  - [x] `#app-scroll-container` への参照を追加
  - [x] `useVirtualizer` を用いた行単位 of仮想化の実装
  - [x] 仮想グリッドと従来のグリッド（30件未満時用）の出し分けの実装
  - [x] 購読解除ボタンなどの `action` 部分を別関数 `renderAction` に切り出し
- [x] 動作確認と検証
  - [x] `npm run build` を実行し、ビルドエラーがないか確認
  - [x] `npm run lint` を実行し、静的解析エラーがないか確認
