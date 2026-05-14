# React Hook順序の修正 (Comments.tsx)

`Comments.tsx` において、`useMemo` フックが条件付きの早期リターン（`isLoading` または `isError` 時）の後に呼び出されているため、Reactの「フックの規則 (Rules of Hooks)」に違反しています。これを修正するために、すべてのフック呼び出しを早期リターンの前に移動します。

## タスク

- [x] `Comments.tsx` の `useMemo` フック呼び出しを、早期リターンの前に移動する。
- [x] 修正後の動作確認。

