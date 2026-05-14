import {
  Text,
  makeStyles,
  Button,
  Spinner,
} from "@fluentui/react-components";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChannelCard } from "../components/ChannelCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { addSubscription, getAuthSubscriptions, removeSubscription } from "../lib/invidiousClient";
import { getLocalSubscriptionIds, removeLocalSubscription } from "../lib/localSubscriptions";
import { getCurrentLocalUser } from "../lib/localUsers";
import { queryKeys } from "../lib/queryKeys";
import { getChannel } from "../lib/invidiousClient";
import { useSettingsStore } from "../store/settingsStore";
import type { ChannelObject } from "../types/invidious";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "1fr 1fr",
    },
  },
  channelItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
});

export const SubscriptionsPage = (): JSX.Element => {
  const styles = useStyles();
  const token = useSettingsStore((state) => state.token);
  const localUser = getCurrentLocalUser();

  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.authSubscriptions,
    queryFn: ({ signal }) => getAuthSubscriptions(signal),
    enabled: !!token,
  });

  const localSubscriptionIdsQuery = useQuery({
    queryKey: queryKeys.localSubscriptions(localUser.id),
    queryFn: async () => getLocalSubscriptionIds(),
    enabled: !token,
  });

  const localSubscriptionsQuery = useQuery({
    queryKey: [...queryKeys.localSubscriptions(localUser.id), "channels"],
    queryFn: async ({ signal }) => {
      const ids = getLocalSubscriptionIds();
      const settled = await Promise.allSettled(ids.map((id) => getChannel(id, signal)));
      return settled
        .filter((item): item is PromiseFulfilledResult<Awaited<ReturnType<typeof getChannel>>> => item.status === "fulfilled")
        .map((item) => item.value);
    },
    enabled: !token,
  });

  const addMutation = useMutation({
    mutationFn: (ucid: string) => addSubscription(ucid),
    onSuccess: () => subscriptionsQuery.refetch(),
  });

  const removeMutation = useMutation({
    mutationFn: (ucid: string) => removeSubscription(ucid),
    onSuccess: () => subscriptionsQuery.refetch(),
  });

  const removeLocalMutation = useMutation({
    mutationFn: async (ucid: string) => {
      removeLocalSubscription(ucid);
    },
    onSuccess: () => {
      void localSubscriptionIdsQuery.refetch();
      void localSubscriptionsQuery.refetch();
    },
  });

  const subscriptions = token ? subscriptionsQuery.data ?? [] : localSubscriptionsQuery.data ?? [];
  const normalizedSubscriptions: ChannelObject[] = subscriptions.map((channel) =>
    "type" in channel ? (channel as ChannelObject) : ({ ...channel, type: "channel" } as ChannelObject),
  );
  const isLoading = token ? subscriptionsQuery.isLoading : localSubscriptionsQuery.isLoading;
  const isError = token ? subscriptionsQuery.isError : localSubscriptionsQuery.isError;
  const isLocalEmpty = !token && (localSubscriptionIdsQuery.data?.length ?? 0) === 0;

  return (
    <div className={styles.container}>
      <Text size={700} weight="bold">登録チャンネル</Text>
      {!token ? <Text size={200}>現在のローカルユーザー: {localUser.name}</Text> : null}

      {isLoading ? <LoadingGrid /> : null}
      {isError ? (
        <ErrorState
          title="登録チャンネル取得失敗"
          message={token ? "/auth/subscriptions を取得できませんでした。" : "ローカル登録チャンネルの取得に失敗しました。"}
          onRetry={() => (token ? subscriptionsQuery.refetch() : localSubscriptionsQuery.refetch())}
        />
      ) : null}
      {!isLoading && !isError && (isLocalEmpty || normalizedSubscriptions.length === 0) ? (
        <EmptyState
          title="登録チャンネルがありません"
          description={token ? "Invidious 側でチャンネル登録を行ってください。" : "チャンネルページまたは視聴ページからローカル登録してください。"}
        />
      ) : null}

      <div className={styles.grid}>
        {normalizedSubscriptions.map((channel) => (
          <div key={channel.authorId} className={styles.channelItem}>
            <ChannelCard channel={channel} />
            <div className={styles.actions}>
              <Button
                size="small"
                appearance="outline"
                disabled={token ? addMutation.isPending : true}
                onClick={() => token && addMutation.mutate(channel.authorId)}
                icon={token && addMutation.isPending ? <Spinner size="tiny" /> : undefined}
              >
                登録
              </Button>
              <Button
                size="small"
                appearance="outline"
                disabled={token ? removeMutation.isPending : removeLocalMutation.isPending}
                onClick={() => (token ? removeMutation.mutate(channel.authorId) : removeLocalMutation.mutate(channel.authorId))}
                icon={token ? (removeMutation.isPending ? <Spinner size="tiny" /> : undefined) : (removeLocalMutation.isPending ? <Spinner size="tiny" /> : undefined)}
              >
                登録解除
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
