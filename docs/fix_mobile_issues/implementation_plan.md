# iPhone再生不可およびモバイル表示崩れの修正計画

## 現状の課題
1. **iPhone再生不可**:
   - iOS SafariはDASHよりもHLSをネイティブで推奨しており、現在の優先順位（DASH > HLS）ではiPhoneで再生に失敗する可能性がある。
   - `autoplay` 設定が有効な場合、`muted` が適切でないとiOSでブロックされる。
2. **表示崩れ（はみ出し）**:
   - `VideoGrid` において `minmax(280px, 1fr)` や `minmax(360px, 1fr)` が指定されており、画面幅がそれ以下のモバイル端末（iPhone SEなど）で横はみ出しが発生している。
   - `box-sizing: border-box` がグローバルで設定されていないため、パディングが要素幅に含まれず計算が狂っている可能性がある。

## 修正内容

### 1. グローバルスタイルの調整 (`src/index.css`)
- `box-sizing: border-box` を全要素に適用。
- `html`, `body` に `overflow-x: hidden` を追加して不要な横スクロールを防止。

### 2. レスポンシブグリッドの改善 (`src/components/VideoGrid.tsx`)
- `minmax` の値を画面幅に応じて調整、または `min(100%, value)` を使用してコンテナ幅を超えないようにする。
- モバイル端末（特に320px付近）での表示を最適化。

### 3. iPhone再生の最適化 (`src/components/VideoPlayer.tsx`)
- ユーザーエージェントを判定し、iOS/Safariの場合は `hlsUrl` を最優先にする。
- Shaka Playerの読み込みロジックを微調整。

### 4. レイアウトの微調整 (`src/components/AppShell.tsx`)
- モバイル環境でのメインコンテンツのパディングを最適化。

## 完了条件
- iPhone (Safari) で動画が正常に再生されること。
- モバイル端末（320px〜）で横スクロールが発生せず、コンテンツが枠内に収まること。
