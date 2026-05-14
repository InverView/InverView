# タスクリスト: NavDrawer (Fluent UI v9) への完全移行

## 準備フェーズ
- [ ] Fluent UI v9 関連パッケージのインストール (`@fluentui/react-components`, `@fluentui/react-icons`)
- [ ] `FluentProvider` の設定 (v8 との共存設定)

## コンポーネント移行フェーズ
- [ ] `Sidebar.tsx` を `NavDrawer` に移行
  - [ ] リンク構造の再定義
  - [ ] v9 アイコンの適用
  - [ ] レスポンシブ挙動（モバイル対応）の修正
- [ ] `Header.tsx` のハンバーガーメニューを v9 `Hamburger` に移行
- [ ] `AppShell.tsx` のレイアウト調整

## クリーンアップ・検証
- [ ] v8 の `Nav` コンポーネント依存の削除
- [ ] デザインの整合性確認（v8 テーマとの調和）
