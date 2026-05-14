# 実装計画：チャンネル画像の表示不具合修正

動画再生ページおよびチャンネルページで、正しいチャンネル画像が表示されない問題を修正します。

## 背景
- 動画再生ページ (`WatchPage.tsx`) で、チャンネルアイコンの取得先が動画のサムネイル (`videoThumbnails`) になっていた。
- Fluent UI v9 の `Avatar` コンポーネントにおいて、画像表示のためのプロパティ `image={{ src: ... }}` ではなく、誤って `src` が使用されていた。

## 修正内容

### 1. 型定義の更新 (`src/types/invidious.ts`)
- `VideoObject` インターフェースに `authorThumbnails?: ThumbnailObject[];` を追加する。

### 2. 動画再生ページの修正 (`src/pages/WatchPage.tsx`)
- `authorThumb` の算出ロジックを `video.authorThumbnails` を使用するように変更する。

### 3. Avatar コンポーネントの修正
以下のファイルで、`Avatar` コンポーネントのプロパティを `src` から `image={{ src: ... }}` に変更する。
- `src/pages/ChannelPage.tsx`
- `src/components/ChannelCard.tsx`
- `src/components/CommentCard.tsx`

## 完了条件
- 動画再生ページで正しいチャンネルアイコンが表示される。
- チャンネルページ、チャンネルカード、コメント欄でアイコンが表示される。
