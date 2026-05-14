# 実装計画：プレイヤーの二重描画解消と自動再生対応

## 課題
- 動画再生ページで Shaka Player が二重に重なって表示される（React 18 の Strict Mode 等による再描画が原因）。
- 動画遷移時に自動再生が確実に行われない。YouTube のように URL パラメータによる制御が求められている。

## 修正方針

### 1. プレイヤーのロバスト化
`VideoPlayer.tsx` の `useEffect` 内で以下の処理を行う。
- 初期化前に `containerRef` の中身を空にする。
- 非同期処理の途中でクリーンアップが呼ばれた場合、以降の DOM 操作や Shaka Player のロードを中断するフラグを導入する。

### 2. URL パラメータによる自動再生制御
- 各所からの動画遷移時に `?autoplay=1` を URL に付与する。
- `WatchPage` でそのパラメータを読み取り、`VideoPlayer` にプロパティとして渡す。
- `VideoPlayer` はそのプロパティがある場合、設定に関わらず自動再生を試みる。

## 修正対象
- `src/components/VideoPlayer.tsx`
- `src/pages/WatchPage.tsx`
- `src/components/VideoCard.tsx`
- `src/pages/PlaylistPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/components/MiniPlayer.tsx`
- `src/components/mobile/MobileVideoActions.tsx`
