import {
  Text,
  makeStyles,
} from "@fluentui/react-components";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { VideoGrid } from "../components/VideoGrid";
import { getAuthFeed } from "../lib/invidiousClient";
import { queryKeys } from "../lib/queryKeys";
import { useSettingsStore } from "../store/settingsStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
});

export const FeedPage = (): JSX.Element => {
  const styles = useStyles();
  const token = useSettingsStore((state) => state.token);

  const feedQuery = useQuery({
    queryKey: queryKeys.authFeed(1),
    queryFn: ({ signal }) => getAuthFeed({ page: 1 }, signal),
    enabled: !!token,
  });

  if (!token) {
    return <EmptyState title="ログインが必要です" description="設定ページで Bearer Token を保存するとフィードを表示できます。" />;
  }

  const videos = feedQuery.data?.videos ?? [];

  return (
    <div className={styles.container}>
      <Text size={700} weight="bold">フィード</Text>
      {feedQuery.isLoading ? <LoadingGrid /> : null}
      {feedQuery.isError ? <ErrorState title="フィード取得失敗" message="/auth/feed の取得に失敗しました。" onRetry={() => feedQuery.refetch()} /> : null}
      {!feedQuery.isLoading && !feedQuery.isError && videos.length === 0 ? (
        <EmptyState title="フィードが空です" description="フォロー中チャンネルの動画がありません。" />
      ) : null}
      {videos.length > 0 ? <VideoGrid items={videos} /> : null}
    </div>
  );
};
