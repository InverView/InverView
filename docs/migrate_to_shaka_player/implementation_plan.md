# 実装計画 - Shaka Player への移行

## 現状
現在、`VideoPlayer.tsx` は `hls.js` を使用して HLS 再生を、ネイティブの `video` タグを使用して直接ストリームの再生を行っています。DASH 再生には対応していません。

## 変更内容
`shaka-player` を導入し、以下の順序で最適なストリームを選択・再生するように変更します。

1. **DASH (`dashUrl`)**: 利用可能な場合、Shaka Player で再生します。
2. **HLS (`hlsUrl`)**: DASH がない場合、Shaka Player で再生します。
3. **直接ストリーム (`stream.url`)**: DASH/HLS が利用できない場合、直接 URL を設定します。

### 具体的な修正ステップ

1. **Polyfill の導入**: Shaka Player の動作を保証するため、アプリの初期化時またはコンポーネント内で `shaka.polyfill.installAll()` を実行します。
2. **Shaka Player インスタンスの管理**:
   - `useRef` を使用して `shaka.Player` インスタンスを保持します。
   - `useEffect` 内で初期化と破棄（`destroy()`）を適切に行います。
3. **ストリーム読み込みロジック**:
   - `dashUrl` -> `hlsUrl` -> `stream.url` の優先順位で読み込みを試行します。
   - エラーハンドリングを追加し、再生失敗時に代替手段（埋め込み iframe 等）を表示します。
4. **設定の反映**:
   - `autoplay`, `loop` などの設定を `video` 要素に適用します。
   - `initialPositionSeconds` がある場合、Shaka Player の `load()` 完了後にシークします。

## 懸念点と対策
- **依存関係**: `hls.js` は不要になるため、動作確認後に削除を検討します（今回は移行のみ行います）。
- **型の定義**: `@types/shaka-player` がない場合、必要に応じて型定義を追加するか `any` で回避します（基本的にはライブラリに含まれています）。
