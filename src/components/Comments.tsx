import {
  Text,
  makeStyles,
  tokens,
  Button,
  Select,
} from "@fluentui/react-components";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getComments } from "../lib/invidiousClient";
import { queryKeys } from "../lib/queryKeys";
import { CommentCard } from "./CommentCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingGrid } from "./LoadingGrid";

interface CommentsProps {
  videoId: string;
  initiallyExpanded?: boolean;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  controls: {
    display: "flex",
    gap: "8px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: "8px",
  },
});

export const Comments = ({ videoId, initiallyExpanded = true }: CommentsProps): JSX.Element => {
  const styles = useStyles();
  const [sortBy, setSortBy] = useState<"top" | "new">("top");
  const [continuation, setContinuation] = useState<string | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(4);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const commentsQuery = useQuery({
    queryKey: queryKeys.comments(videoId, sortBy, continuation),
    queryFn: ({ signal }) => getComments(videoId, sortBy, continuation, signal),
    enabled: !!videoId,
  });

  useEffect(() => {
    setVisibleCount(4);
  }, [sortBy, videoId, continuation]);

  const comments = commentsQuery.data?.comments ?? [];
  const visibleComments = useMemo(() => comments.slice(0, visibleCount), [comments, visibleCount]);

  if (commentsQuery.isLoading) return <LoadingGrid count={3} />;
  if (commentsQuery.isError) {
    return <ErrorState title="コメント取得エラー" message="コメントを取得できませんでした。" onRetry={() => commentsQuery.refetch()} />;
  }


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold">コメント</Text>
        <div className={styles.controls}>
          <Select
            value={sortBy}
            onChange={(e) => {
              const value = e.target.value === "new" ? "new" : "top";
              setSortBy(value);
              setContinuation(undefined);
            }}
            size="small"
          >
            <option value="top">人気順</option>
            <option value="new">新しい順</option>
          </Select>
          <Button size="small" appearance="outline" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? "折りたたむ" : "展開"}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className={styles.list}>
          {comments.length === 0 ? (
            <EmptyState title="コメントはまだありません" description="この動画には表示できるコメントがありません。" />
          ) : (
            visibleComments.map((comment) => <CommentCard key={comment.commentId} comment={comment} />)
          )}

          {comments.length > visibleCount && (
            <Button appearance="outline" className={styles.loadMoreBtn} onClick={() => setVisibleCount((prev) => prev + 4)}>
              コメントをさらに表示
            </Button>
          )}

          {commentsQuery.data?.continuation && (
            <Button
              appearance="outline"
              className={styles.loadMoreBtn}
              onClick={() => setContinuation(commentsQuery.data?.continuation)}
            >
              次のコメントを読み込む
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

