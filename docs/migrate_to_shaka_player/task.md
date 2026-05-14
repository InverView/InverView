# 再生ページを Shaka Player に移行

再生エンジンの `hls.js` から `shaka-player` への移行を行い、DASH および HLS の再生サポートを強化します。

## タスク

- [x] `shaka-player` のインストール
- [x] `VideoPlayer.tsx` の実装を Shaka Player に変更
- [x] DASH (dashUrl) への優先対応
- [x] HLS および直接ストリームへのフォールバック実装
- [x] 既存機能（自動再生、ループ、シーク位置、再生終了検知）の維持
- [x] 動作確認

