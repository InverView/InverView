# プレイリストおよびチャンネル動画の全件取得対応（ページネーション制限の解消）の実装計画

一部のページでデータが途中で途切れてしまい、すべての情報が取得できない問題を修正します。

## ユーザーレビューが必要な項目
特にありませんが、ページ数の上限を撤廃することで、非常に動画数が多いチャンネルで何度も「もっと読み込む」を押した場合にメモリ消費量が増える可能性があります。ただし、通常の使用範囲内では問題ありません。

## 未解決の質問
特になし

## 提案される変更

### 1. プレイリストページ (`PlaylistPage.tsx`)

現在、プレイリストの動画一覧は `useQuery` を用いて最初の1ページ（100件）のみ固定で取得しています。
これを `useInfiniteQuery` に移行し、「もっと読み込む」ボタンを表示することで、100件を超えるプレイリストでも全件取得できるように変更します。

#### [MODIFY] [PlaylistPage.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/pages/PlaylistPage.tsx)

- `@tanstack/react-query` から `useInfiniteQuery` をインポートし、`@fluentui/react-components` から `Spinner` をインポート。
- `useQuery` から `useInfiniteQuery` に書き換え。
- `playlistQuery.data.pages` をマージして、一つのプレイリストオブジェクト構造に結合する `useMemo` を実装。
- `loadMoreBtn` スタイルを `useStyles` に追加。
- リスト下部に「もっと読み込む」ボタンを追加し、次のページがある場合に表示・読み込みできるように実装。

---

### 2. チャンネルページ (`ChannelPage.tsx` および `ChannelVideosPage.tsx`)

チャンネルの「動画」「Shorts」「ライブ配信」タブにおいて、`useInfiniteQuery` の `maxPages` に `4`（最大4ページ・約240件）という制限がかけられています。このため、古い動画へ遡ることができなくなっています。
この `maxPages` 制限を撤廃（削除）し、すべての動画を遡って読み込めるようにします。

#### [MODIFY] [ChannelPage.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/pages/ChannelPage.tsx)
- `maxPages: INFINITE_QUERY_MAX_PAGES` の指定を削除、または `INFINITE_QUERY_MAX_PAGES` 自体を削除。

#### [MODIFY] [ChannelVideosPage.tsx](file:///c:/Users/oronami/Music/invidious_react_client/src/pages/ChannelVideosPage.tsx)
- `maxPages: INFINITE_QUERY_MAX_PAGES` の指定を削除。

---

## 検証計画

### 自動テスト / ビルド確認
- `npm run build` を実行して、TypeScriptの型エラーやビルドエラーが発生しないことを確認します。

### 手動確認
1. **プレイリストページ**:
   - 100件以上の動画が含まれるプレイリスト（例: `PL...`）を開き、最初の100件が表示されること、および下部に「もっと読み込む」ボタンが表示されることを確認します。
   - 「もっと読み込む」をクリックして、101件目以降の動画が正しく追記されることを確認します。
2. **チャンネルページ**:
   - 動画数が非常に多いチャンネル（動画タブなど）を開き、スクロールして「もっと読み込む」を4回以上連続でクリックしても、制限なく次の動画が読み込まれ続けることを確認します。
