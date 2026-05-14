# タスクリスト: Fluent UI への移行

Chakra UI を廃止し、@fluentui/react (v8) への完全な移行を実施します。

## 準備フェーズ
- [x] @fluentui/react のインストール
- [x] 移行用のドキュメント作成 (Implementation Plan, Task List)

## 基盤設定フェーズ
- [x] `main.tsx` のプロバイダー置換 (`ChakraProvider` -> `ThemeProvider`)
- [x] Fluent UI アイコンの初期化 (`initializeIcons`)
- [x] グローバルスタイルの調整 (Fluent UI のテーマパレット定義)

## レイアウト移行フェーズ
- [x] `AppShell.tsx` の置換 (Sidebar と Main コンテンツの Stack 構成)
- [x] `Header.tsx` の置換 (CommandBar または Stack 構成)
- [x] `Sidebar.tsx` の置換 (Nav コンポーネント)

## コンポーネント移行フェーズ
- [ ] 共通コンポーネントの移行
    - [ ] `VideoCard.tsx`
    - [ ] `LoadingGrid.tsx`
    - [ ] `ErrorState.tsx`
    - [ ] `CustomModal.tsx` (Fluent UI 版へ再作成)
- [ ] 各ページの移行
    - [ ] `WatchPage.tsx`
    - [ ] `HomePage.tsx`
    - [ ] `SearchPage.tsx`
    - [ ] `SettingsPage.tsx`

## クリーンアップフェーズ
- [ ] Chakra UI 関連パッケージのアンインストール
- [ ] 未使用のテーマ設定ファイルの削除
- [ ] 動作確認と最終調整
