# 実装計画: サイドバー最小化機能の修正

## 現状の分析
サイドバーの最小化が機能しない原因として以下の点が考えられました。
1. **タイポによるスタイル不全**: `Sidebar.tsx` で `navHeader` という定義されていないスタイルを参照しており、トグルボタンの見た目や配置に問題がありました。
2. **幅の指定の不整合**: `NavDrawer` (Fluent UI) の `inline` モードはデフォルトの幅を持っていることがあり、親要素（`AppShell` の `sidebarWrap`）の幅が 72px になっても、中身の `NavDrawer` が 220px のまま残り、レイアウトが崩れるかクリップされるだけの状態になっていました。
3. **アニメーションの不一致**: 親要素と子要素で transition の指定が異なっていたため、挙動が不自然になる可能性がありました。

## 修正方針
1. `Sidebar.tsx` のスタイル定義を整理し、トグルボタンに正しいスタイルを適用します。
2. `Sidebar.tsx` の `NavDrawer` 自身に `isCollapsed` 状態に応じた明示的な幅（220px / 72px）を持たせます。
3. アニメーション（transition）を `0.2s ease-in-out` で統一します。
4. `NavItem` の中身（テキスト）を `isCollapsed` 時に確実に `display: none` にし、アイコンを中央寄せにするスタイルを維持します。

## 修正対象ファイル
- `src/components/Sidebar.tsx`: スタイル修正、幅の動的変更、タイポ修正。
- `src/components/AppShell.tsx`: コンテナ側の transition 統一。
