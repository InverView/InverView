# 汎用コンポーネントおよびロジックの切り出しと共通化の実装計画

本計画は、現在 `src/App.tsx` および `src/components/VideoGrid.tsx` 内にインラインで定義されている汎用的なコンポーネントやロジックを個別のファイルとして切り出し、コードの可読性・保守性・再利用性を高めるリファクタリングを行います。

## ユーザーレビュー要求事項

> [!NOTE]
> 本変更は機能的な変更を伴わない純粋なリファクタリングです。切り出し後の各コンポーネントやフックは、元のファイルから適切にインポートされ、既存の動作が維持されるようにします。

## 提案される変更

### 1. App.tsx の整理とコンポーネント切り出し

`App.tsx` に含まれる外部遷移ガードおよびテーマ同期ロジックを別コンポーネントに切り出します。

#### [NEW] [ExternalLinkGuard.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/components/ExternalLinkGuard.tsx)
- `App.tsx` 内の `ExternalLinkGuard` コンポーネントを切り出します。
- 関連するヘルパー関数 `isExternalHttpUrl` と `openExternalLink` もこのファイルに移動します。
- 依存関係（`useSettings`、`useTranslation`、Fluent UIのコンポーネントなど）をインポートします。

#### [NEW] [ThemeSync.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/components/ThemeSync.tsx)
- `App.tsx` 内の `ThemeSync` コンポーネントを切り出します。
- 関連するヘルパー関数 `toHexColor` もこのファイルに移動します。
- 依存関係（`useSettings`、`useTranslation`、`useOnlineStatus`、Fluent UIのテーマ作成処理など）をインポートします。

#### [MODIFY] [App.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/App.tsx)
- `ExternalLinkGuard` と `ThemeSync` をインポートするように変更し、インライン定義を削除します。

---

### 2. VideoGrid.tsx の整理と共通ロジック切り出し

`VideoGrid.tsx` に含まれるキーボードナビゲーション検知ロジックと遅延レンダリング用コンポーネントを共通ファイルとして切り出します。

#### [NEW] [useKeyboardNavigationMode.ts](file:///c:/Users/oronami/Music/invidious_react_client/src/hooks/useKeyboardNavigationMode.ts)
- キーボード操作（Tabキー）を監視するカスタムフック `useKeyboardNavigationMode` を作成します。
- 将来的に他のコンポーネント（アクセシビリティ対応など）でも利用可能にします。

#### [NEW] [DeferredRenderItem.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/components/DeferredRenderItem.tsx)
- `IntersectionObserver` を利用して画面外の要素のレンダリングを遅延させる `DeferredRenderItem` コンポーネントを切り出します。
- 他の重いリスト表示やコンテンツでも再利用できるようにします。

#### [MODIFY] [VideoGrid.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/components/VideoGrid.tsx)
- `useKeyboardNavigationMode` と `DeferredRenderItem` をインポートするように変更し、インライン定義を削除します。

---

## 検証計画

### 手動確認
- アプリケーションが正常にビルド・起動することを確認します。
- テーマの切り替え、フォントサイズや角丸設定などの表示が正常に動作し同期されることを確認します。
- 外部リンクをクリックした際に警告ダイアログ（ExternalLinkGuard）が正常に表示されるか確認します。
- キーボードの `Tab` キーを押した際に `VideoGrid` のフォーカス表示などが崩れず、動作することを確認します。
- スクロール時にビデオカードが遅延レンダリング（DeferredRenderItem）され、パフォーマンス上の問題がないことを確認します。
