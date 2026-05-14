# 実装計画：サイドバーUIの刷新

サイドバーの展開・最小化状態をCSS変数で一元管理し、Fluent UIコンポーネントのスタイルを精緻に調整することで、レイアウトの崩れを修正します。

## 1. CSS変数の定義 (`src/index.css`)
- サイドバーの幅を以下の変数で定義します。
  - `--sidebar-width-expanded`: 200px
  - `--sidebar-width-collapsed`: 64px
  - `--sidebar-transition`: width 0.2s cubic-bezier(0.4, 0, 0.2, 1)

## 2. レイアウトの同期 (`src/components/AppShell.tsx`)
- `sidebarWrap` の幅を `--sidebar-width` 変数（状態に応じて切り替え）に同期させます。
- `mainContent` にサイドバーと同じ transition を設定し、カクつきを解消します。

## 3. サイドバーコンポーネントの再構築 (`src/components/Sidebar.tsx`)
- **公式コンポーネント構造の採用**:
  - `NavDrawerBody` 内に `NavSectionHeader` を配置し、「ホーム」「ライブラリ」等のセクションを明示。
  - すべての `NavItem` に `href` を付与し、`onNavItemSelect` でルーティングを制御（`e.preventDefault()`）。
  - ネストが必要な場合は `NavCategory` を使用して2階層目まで対応可能な構造にする。
  - `density` 設定を考慮し、プレミアムな余白（YouTube風）を維持。
- **スタイル定義の堅牢化**:
  - 最小化状態での `NavSectionHeader` の非表示化またはスタイル調整。
  - アイコンの中央揃えを `NavItem` の内部構造に合わせて再調整。
  - アクティブインジケーター（左端のバー）を展開・最小化の両方で最適化。

## 4. レスポンシブ対応
- 1024px 未満（モバイル・タブレット）では、`AppShell` の `sidebarWrap` を非表示にし、`mainContent` のマージンを解除します。

## 修正ステップ
1. `index.css` に変数を追加。
2. `Sidebar.tsx` のスタイル定義とJSX構造を刷新。
3. `AppShell.tsx` のレイアウトロジックを更新。
4. 動作確認（展開/最小化の切り替え、モバイル表示）。
