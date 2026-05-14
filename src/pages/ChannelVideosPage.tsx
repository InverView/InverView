import {
  Text,
  makeStyles,
  tokens,
  Button,
  Spinner,
  Combobox,
  Option,
} from "@fluentui/react-components";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { VideoGrid } from "../components/VideoGrid";
import { getChannelShorts, getChannelStreams, getChannelVideos } from "../lib/invidiousClient";
import { queryKeys } from "../lib/queryKeys";

type Mode = "videos" | "shorts" | "streams";

interface ChannelVideosPageProps {
  mode: Mode;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  filterRow: {
    maxWidth: "240px",
  },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: "12px",
  },
});

export const ChannelVideosPage = ({ mode }: ChannelVideosPageProps): JSX.Element => {
  const styles = useStyles();
  const { authorId = "" } = useParams();
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "oldest">("newest");

  const title = mode === "videos" ? "チャンネル動画" : mode === "shorts" ? "ショート" : "配信";

  const query = useInfiniteQuery({
    queryKey: queryKeys.channelVideos(authorId, sortBy, mode),
    queryFn: ({ pageParam, signal }) => {
      const continuation = typeof pageParam === "string" ? pageParam : undefined;
      if (mode === "videos") {
        return getChannelVideos(authorId, { sort_by: sortBy, continuation }, signal);
      }
      if (mode === "shorts") {
        return getChannelShorts(authorId, { continuation }, signal);
      }
      return getChannelStreams(authorId, { continuation }, signal);
    },
    getNextPageParam: (lastPage) => lastPage.continuation,
    initialPageParam: undefined as string | undefined,
    enabled: !!authorId,
  });

  const videos = useMemo(() => query.data?.pages.flatMap((page) => page.videos ?? []) ?? [], [query.data]);

  return (
    <div className={styles.container}>
      <Text size={700} weight="bold">{title}</Text>

      {mode === "videos" ? (
        <div className={styles.filterRow}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>並び替え</Text>
          <Combobox
            selectedOptions={[sortBy]}
            value={sortBy}
            onOptionSelect={(_, data) => setSortBy(data.optionValue as any)}
          >
            <Option value="newest">newest</Option>
            <Option value="popular">popular</Option>
            <Option value="oldest">oldest</Option>
          </Combobox>
        </div>
      ) : null}

      {query.isLoading ? <LoadingGrid /> : null}
      {query.isError ? <ErrorState title="取得失敗" message="チャンネル動画を取得できませんでした。" onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError && videos.length === 0 ? (
        <EmptyState title="動画がありません" description="このタブに表示できる項目がありません。" />
      ) : null}
      {videos.length > 0 ? <VideoGrid items={videos} /> : null}

      {query.hasNextPage ? (
        <Button
          className={styles.loadMoreBtn}
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          appearance="outline"
          icon={query.isFetchingNextPage ? <Spinner size="tiny" /> : undefined}
        >
          さらに読み込む
        </Button>
      ) : null}
    </div>
  );
};
