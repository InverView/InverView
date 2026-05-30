# タスクリスト: オーバーレイ方式への変更

- `[x]` 1. `VideoPlayer.tsx` のグローバル状態の再設計
  - `wrapperElement` を `document.body` に固定配置する仕組みの実装
  - 既存の `appendChild` によるDOM移動処理の削除
- `[x]` 2. 座標追従ロジック（オーバーレイ同期）の実装
  - 現在アクティブな `containerRef` の画面内座標 (`getBoundingClientRect`) の取得
  - `requestAnimationFrame` を用いたリアルタイムな位置・サイズ同期ループの実装
- `[x]` 3. 古いテレポート処理のクリーンアップ
  - `isTeleporting` や遅延リフロー (`teleportRenderTimer`) など不要になったバグ回避用ハックの削除
- `[ ]` 4. 動作検証
  - 通常プレーヤーとミニプレーヤー間の切り替えテスト
  - ミニプレーヤー移動中の追従テスト
  - 再生が止まらないこと、黒画面にならないことの確認
