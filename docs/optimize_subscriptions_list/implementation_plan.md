# 購読チャンネル一覧（/subscriptions?view=list）の高速化・最適化計画

購読チャンネル数が多い場合に、一覧表示画面（`/subscriptions?view=list`）の初期レンダリングおよびスクロール動作が重くなる問題を解消します。

## ユーザーレビューが必要な項目
特になし（既存の `@tanstack/react-virtual` パッケージを使用するため、追加の依存関係はありません）。

## 未解決の質問
特になし。

## 提案する変更

### Subscriptions Component

#### [MODIFY] [SubscriptionsPage.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/pages/SubscriptionsPage.tsx)
- `@tanstack/react-virtual` から `useVirtualizer` をインポートします。
- [VideoGrid.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/components/VideoGrid.tsx) と同様に、コンテナの幅（`containerWidth`）を監視してカラム数（画面幅 >= 768px で 2列、それ未満で 1列）を動的に判定するロジックを追加します。
- スクロール対象として、アプリケーション共通のスクロールコンテナ `#app-scroll-container` を参照します。
- `normalizedSubscriptions` の数が一定以上（例: 30件以上）の場合に仮想化グリッドを適用し、それ未満の場合は既存のシンプルなグリッド表示を維持することで、少ない件数でのオーバーヘッドを回避します。
- チャンネルの非表示・削除アクション（アンサブスクライブ）部分を別関数（`renderAction`）に切り出して、コードの可読性を向上させます。

## 検証計画

### 自動テスト
- `npm run build` を実行し、TypeScriptの型エラーやViteのビルドエラーが発生しないことを確認します。
- `npm run lint` が正常に通ることを確認します。

### 手動検証
- ローカル開発サーバーを起動し、`/subscriptions?view=list` 画面を開きます。
- チャンネルを多数（テスト用に数十件以上）登録した状態で、スムーズにスクロールできること、DOMノードが画面に表示されている領域近辺のみに制限されていることをブラウザのデベロッパーツールで確認します。
- 購読解除ボタンの動作に問題がないか確認します。
