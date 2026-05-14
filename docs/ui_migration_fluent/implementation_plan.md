# 実装計画書: Fluent UI (@fluentui/react) への移行

## 1. 目的
現在の UI ライブラリである Chakra UI を廃止し、Microsoft の Fluent UI (@fluentui/react v8) に置き換えることで、一貫性のあるエンタープライズ品質の UI/UX を実現します。

## 2. 技術スタックの変更
- **UI 枠組み**: `@chakra-ui/react` → `@fluentui/react`
- **アイコン**: `@chakra-ui/icons` → `@fluentui/react` (Font-based icons)
- **スタイル管理**: Emotion (Chakra 依存) → Fluent UI の `mergeStyles` または `styles` プロップ
- **テーマ**: `src/theme.ts` (Chakra) → Fluent UI の `PartialTheme` / `createTheme`

## 3. 実装ステップの詳細

### ステップ 1: 基盤の設定 (`main.tsx`)
- `initializeIcons()` を呼び出し、Fluent UI のアイコンフォントを読み込みます。
- `ChakraProvider` を削除し、`ThemeProvider` を導入します。
- カスタムテーマ（アクセントカラー等）を Fluent UI のパレット形式に変換して適用します。

### ステップ 2: グローバルレイアウトの移行
- `AppShell.tsx`: `Flex`, `Box` を `Stack` に置き換えます。
- `Sidebar.tsx`: `List`, `ListItem` を Fluent UI の `Nav` コンポーネントに置き換えます。
- `Header.tsx`: 検索バーや設定ボタンを Fluent UI の `SearchBox` や `CommandBar` で再構築します。

### ステップ 3: 共通コンポーネントの再実装
- `VideoCard.tsx`: `Card` を `DocumentCard` またはカスタム `Stack` で実装します。
- `LoadingGrid.tsx`: `Skeleton` を `Shimmer` に置き換えます。
- `CustomModal.tsx`: `Modal` コンポーネントを使用して再設計します。

### ステップ 4: 各ページの移行
各ページ (`WatchPage`, `HomePage` 等) における以下の Chakra コンポーネントを Fluent UI に変換します：
- `Heading` → `Text` (variant: large/xLarge)
- `VStack` / `HStack` → `Stack` (tokens, vertical/horizontal)
- `SimpleGrid` → `Grid` または CSS Grid を使用した `Stack`
- `Button` → `PrimaryButton` / `DefaultButton`
- `Badge` → `Label` またはカスタムタグ

## 4. 懸念事項と対策
- **レイアウトの差異**: Chakra の `SimpleGrid` は Fluent UI に直接の対応物がありません。CSS Grid を併用するか、Fluent UI の `Stack` でラップして対応します。
- **ダークモードの同期**: Fluent UI のテーマを `darkTheme` / `lightTheme` で切り替える仕組みを `SettingsProvider` と連携させます。
- **モバイル対応**: Fluent UI v8 はデスクトップ重視であるため、メディアクエリを使用してレスポンシブ対応を慎重に行います。
