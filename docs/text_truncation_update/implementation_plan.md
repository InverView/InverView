# 実装計画: テキスト省略処理の改善

## 概要
CSS の `text-overflow: ellipsis` および `-webkit-line-clamp` を活用し、各カードコンポーネント内の長いテキストを適切に制御する。

## 修正詳細

### 1. VideoCard.tsx
- タイトル: `WebkitLineClamp: 2` を維持（2行まで表示し、以降を省略）。
- メタデータ: `white-space: nowrap`, `text-overflow: ellipsis` を適用し、1行に収める。

### 2. ChannelCard.tsx
- チャンネル名: メタデータと同様に 1 行で省略。
- 説明文: `WebkitLineClamp: 2` を適用。

### 3. PlaylistCard.tsx
- タイトル: `WebkitLineClamp: 2` を適用。
- メタデータ: 1 行で省略。

### 4. HashtagCard.tsx
- タイトルおよび説明文: 1 行で省略。

## スタイリングのポイント
- `overflow: hidden` と `maxWidth: 100%` を組み合わせることで、親要素を突き抜けるのを防止。
- フレックスボックス内での省略が正しく動作するように調整。
