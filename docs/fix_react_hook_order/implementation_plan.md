# 実装計画 - React Hook順序の修正

`Comments.tsx` におけるフック呼び出し順序の不整合を解消します。

## 現状の課題
`Comments` コンポーネントにおいて、`isLoading` または `isError` の状態による早期リターンが、`useMemo` フックの呼び出しよりも前に行われています。Reactではレンダリングごとにフックが呼び出される順序と数が一致している必要があるため、データ取得中やエラー時にフックの数が変わり、エラーが発生しています。

## 修正内容
`useMemo` およびその依存変数である `comments` の定義を、早期リターンの前に移動します。

### 修正箇所: `src/components/Comments.tsx`

```tsx
// 修正前
if (commentsQuery.isLoading) return <LoadingGrid count={3} />;
if (commentsQuery.isError) {
  return <ErrorState ... />;
}

const comments = commentsQuery.data?.comments ?? [];
const visibleComments = useMemo(() => comments.slice(0, visibleCount), [comments, visibleCount]);

// 修正後
const comments = commentsQuery.data?.comments ?? [];
const visibleComments = useMemo(() => comments.slice(0, visibleCount), [comments, visibleCount]);

if (commentsQuery.isLoading) return <LoadingGrid count={3} />;
if (commentsQuery.isError) {
  return <ErrorState ... />;
}
```

## 影響範囲
- `Comments` コンポーネントの内部ロジックのみ。
- 機能的な変更はなく、不具合の修正のみとなります。
