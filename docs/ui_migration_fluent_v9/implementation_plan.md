# 実装計画: NavDrawer (Fluent UI v9) への完全移行

## 目的
現在使用している `@fluentui/react` (v8) の `Nav` コンポーネントを、よりモダンで多機能な `@fluentui/react-components` (v9) の `NavDrawer` に置き換えます。これにより、サイドバーの操作性、アクセシビリティ、およびデザインの質を向上させます。

## 背景
- ユーザーより Fluent UI v9 の `Nav` に関するドキュメントが提供されたため、これに基づき最新のコンポーネント体系に移行します。
- プロジェクト全体はまだ v8 ベースであるため、v9 の `FluentProvider` を導入し、段階的に移行できる環境を整えます。

## 実装詳細

### 1. パッケージの導入
以下のパッケージを追加します：
- `@fluentui/react-components`: v9 のコアコンポーネント
- `@fluentui/react-icons`: v9 用のアイコンセット

### 2. Provider の設定 (`main.tsx`)
v8 の `ThemeProvider` と v9 の `FluentProvider` を共存させます。
```tsx
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
// ...
<ThemeProvider theme={fluentTheme}>
  <FluentProvider theme={settings.theme === "dark" ? webDarkTheme : webLightTheme}>
    <App />
  </FluentProvider>
</ThemeProvider>
```

### 3. Sidebar の刷新 (`Sidebar.tsx`)
- `NavDrawer` を使用して、インラインおよびモバイルオーバーレイの両方に対応させます。
- `NavItem`, `NavCategory`, `NavSubItem` を使用して、既存のナビゲーション構造を再現します。
- アイコンを `@fluentui/react-icons` の `bundleIcon` を使用した形式に変換します。

### 4. Header との連携 (`Header.tsx`)
- モバイル時の開閉制御のために、v9 の `Hamburger` コンポーネントを使用します。

## リスクと対策
- **スタイル競合**: v8 と v9 の CSS 変数やリセットスタイルが競合する可能性があります。必要に応じて `FluentProvider` のネスト順序を調整します。
- **バンドルサイズ**: ライブラリが 2 つ混在するため一時的に増加しますが、将来的な v9 への完全移行を見据えたステップと位置づけます。
