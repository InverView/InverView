# タスクリスト: 動画再生バグの修正

- [x] 実装計画のユーザー承認を得る
- [x] `VideoPlayer.tsx` の修正
  - [x] `PlayerCacheEntry` を `wrapperElement` ベースに更新
  - [x] `destroyCachedPlayer` の更新
  - [x] メイン `useEffect` (初期化・再利用・クリーンアップ) を Wrapper DOM 方式で再実装
- [x] ビルド検証 (`npm run build`)
- [x] 手動検証（動作確認）
- [x] 追加修正: ミニプレイヤーで Shaka UI を非表示にする
- [x] 追加修正: 頻繁な切り替え時の再生安定化 (isPlaying フラグ、playリトライループ)
- [/] 再ビルド検証
- [ ] `walkthrough.md` の更新
