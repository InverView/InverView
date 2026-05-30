# ミニプレイヤー・メインプレイヤー切り替え時の動画再生バグ修正計画

ミニプレイヤーとメインプレイヤー（またはその他のページコンポーネント）間で往復した際に、動画が再生されなくなったり、映像が黒くなったり、プレイヤーのコントロールが壊れたりする不具合を解決するための計画です。

## 課題の分析と原因
1. **Shaka UI のコントロールバインディング崩壊**
   - 旧実装では `containerRef.current.appendChild(globalPlayerCache.uiContainer)` を行っていましたが、`uiContainer` が `.shaka-video-container` (Shaka UIの生成物) でした。
   - Shaka UI (Overlay) はインスタンス化の際、渡された親コンテナに各種のイベントリスナーやリサイズイベントをバインドします。親コンテナ (`containerRef.current`) 自体が新コンポーネントに切り替わると、Shaka UI の内部で参照するコンテナと実際の DOM ツリー上での親要素が乖離し、操作できなくなったりバグが発生します。
2. **非同期初期化の競合**
   - プレイヤーが完全に初期化 (Shakaのロードとアタッチ) される前に、別のコンポーネントがキャッシュを再利用しようとすると、`shakaPlayer` や `shakaUi` が `null` の不完全な状態のキャッシュを掴んでしまい、初期化が壊れます。
3. **DOMの孤立によるデコーダのリセット**
   - 旧プレイヤーのアンマウント時に、ビデオ要素が DOM ツリーから完全に切り離される瞬間があると、ブラウザの仕様によりビデオデコーダや再生バッファが即座に破棄され、再アタッチしても再生が再開できなくなります。
4. **グローバルリソース（MediaSession・イベントリスナー）の競合と古い Props の参照**
   - イベントリスナーや `navigator.mediaSession` の設定が、キャッシュ作成時の古い props (PIP有効無効、動画タイトルなど) をキャプチャしたままになっており、切り替え後に最新の props が反映されません。

## 解決策（Wrapper DOM方式の導入とライフサイクル再設計）
1. **Wrapper DOM 方式の導入**
   - キャッシュ内に、ビデオ要素と Shaka UI コンテナをすべて内包する独立した `div` 要素（`wrapperElement`）を生成します。
   - Shaka UI Overlay は、この `wrapperElement` を親コンテナとして初期化します。
   - React コンポーネント側は、この `wrapperElement` 自体を `containerRef.current.appendChild(globalPlayerCache.wrapperElement)` で丸ごとテレポートさせます。
   - これにより、Shaka UI が認識する親コンテナ (`wrapperElement`) はテレポート前後で一切変わらないため、バインディングの崩壊やリサイズ処理の不具合が完全に解消されます。
2. **初期化完了後のキャッシュ登録**
   - `globalPlayerCache` への登録タイミングを、`initPlayer` による Shaka Player の初期化とストリームの最初のロードが完了した時点に限定します。初期化途中の不完全な状態のキャッシュが他インスタンスから参照されるのを防ぎます。
3. **安全な DOM 退避（孤立の完全防止）**
   - アンマウント時、自分がキャッシュの所有者 (`activeInstanceId === instanceId`) であれば、即座に `document.body.appendChild(globalPlayerCache.wrapperElement)` を行い、DOMツリー上に常に要素を維持し、ブラウザによるデコーダの破棄を防ぎます。
4. **グローバルリソースの動的再アタッチ**
   - グローバルな window リスナーや `navigator.mediaSession` の設定は、アタッチ時（新規作成またはキャッシュ再利用時）に最新の props を使用してセットアップし、コンポーネントのアンマウント時に適切にクリーンアップします。
   - 一方、ビデオ要素に対するリスナー（`timeupdate` や `play` など）は、キャッシュ作成時に一度だけ登録し、コールバック内では常に最新のコンポーネントインスタンスの Ref 経由で実行するようにします。

## 変更内容

### [MODIFY] [VideoPlayer.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/components/VideoPlayer.tsx)
- `PlayerCacheEntry` インターフェースの更新:
  - `uiContainer` を `wrapperElement` に置き換える。
- `destroyCachedPlayer` の更新:
  - `wrapperElement` のクリーンアップおよび破棄に対応させる。
- メイン `useEffect` (Shaka初期化・クリーンアップ) の再実装:
  - キャッシュ再利用時、`wrapperElement` を `containerRef` に append する。
  - キャッシュ新規作成時、`wrapperElement` を作成し、Shaka UI の親コンテナとして使用する。
  - アタッチ時、グローバルリソース（`setupGlobalResources`）を最新の props で実行し、`globalCleanup` を設定する。
  - `initPlayer` のロード完了後にのみ `globalPlayerCache` に登録・キャッシュを確定させる。
  - アンマウントクリーンアップ時、自分がアクティブオーナーであれば `wrapperElement` を `document.body` に退避させ、`globalCleanup` を呼ぶ。また 2000ms のクリーンアップ遅延タイマーを設定する。

---

## 検証計画
### 自動/ビルド検証
- `npm run build` を実行し、TypeScriptの型エラーやコンパイルエラーが無いことを確認します。

### 手動検証
- ミニプレイヤーとメインプレイヤーの間を高速で行き来して、動画再生が止まったり、映像が黒くならず、シームレスに再生が引き継がれることを確認します。
