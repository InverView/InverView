# Invidious Companion の統合

動画再生の安定性を向上させるため、外部の復号化プロキシである Invidious Companion を統合します。

## タスク

- [x] `AppSettings` に `companionUrl` と `companionSecret` を追加
- [x] 設定ストア (`settingsStore.ts`) に新しいフィールドとセッターを追加
- [x] `VideoPlayer.tsx` で Companion の DASH マニフェストを使用するように修正
- [x] Shaka Player のリクエストフィルタで認証ヘッダーを付与するように修正
- [x] `SettingsPage.tsx` に Companion 設定用の UI を追加
- [x] DASH URL のクエリパラメータ（check 等）を維持するように修正
- [x] エラー発生時に Shaka のエラーコードを画面に表示するように改善
- [x] DASH マニフェスト内の相対パス BaseURL に対する認証判定をオリジンベースに強化
- [x] デフォルトの Companion URL (https://companion.tsub4sa.xyz) を設定
- [x] コーデック優先順位の調整 (avc1, vp9) により 3016 エラーに対応
- [x] レスポンスフィルタによる 7002 エラーのデバッグ支援を追加
- [x] 動作確認




