# 修正内容の確認 - Invidious Companion の統合

動画の復号化とプロキシを行う外部サービス「Invidious Companion」を統合し、再生の安定性を向上させました。

## 修正内容の要約

- **設定項目の追加**:
    - `SettingsPage.tsx` に「Invidious Companion」セクションを新設。
    - `Companion URL` と `Secret Key (Bearer Token)` を設定可能にしました。
    - デフォルト値は環境変数（`VITE_COMPANION_URL`, `VITE_COMPANION_SECRET`）から取得します。
- **再生エンジンの強化 (`VideoPlayer.tsx`)**:
    - Companion が設定されている場合、`/companion/api/manifest/dash/id/<videoId>?local=true` を DASH マニフェストとして優先的に使用します。
    - Shaka Player のリクエストフィルタを登録し、Companion へのリクエストに自動的に `Authorization: Bearer <key>` ヘッダーを付与するようにしました。
    - `audioOnly` モードでも Shaka Player (DASH) を使用するように変更し、音声のみのトラックを自動選択するロジックを追加しました。これにより、音声のみの場合でも Companion による復号化の恩恵を受けられます。

## 修正後の動作

1. 設定画面で Invidious Companion の情報を入力し、「適用」します。
2. 動画再生時に、Invidious のプロキシではなく Companion を経由した DASH ストリームが使用されるようになります。
3. YouTube の署名（Signature）問題による「ストリームの読み込みに失敗しました」エラーが回避されます。

## 検証手順

- [ ] 設定画面で Invidious Companion の URL と Secret Key を入力。
- [ ] 適当な動画を再生し、正常に再生が開始されることを確認。
- [ ] ブラウザのデベロッパーツール（ネットワークタブ）で、`/companion/api/manifest/dash/id/...` へのリクエストが発生しており、`Authorization` ヘッダーが含まれていることを確認。
- [ ] 「音声のみモード」でも再生ができることを確認。
