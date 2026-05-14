import {
  Text,
  makeStyles,
  tokens,
  Button,
  Avatar,
  Card,
  Tab,
  TabList,
  Spinner,
  Combobox,
  Option,
} from "@fluentui/react-components";
import DOMPurify from "dompurify";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ChannelCard } from "../components/ChannelCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { MobileChannelHeader } from "../components/mobile/MobileChannelHeader";
import { PlaylistCard } from "../components/PlaylistCard";
import { VideoCard } from "../components/VideoCard";
import { VideoGrid } from "../components/VideoGrid";
import { formatNumberJa } from "../lib/format";
import { getChannel, getChannelPlaylists, getChannelShorts, getChannelStreams, getChannelVideos } from "../lib/invidiousClient";
import { pickBestThumbnail, resolveMediaUrl } from "../lib/media";
import { queryKeys } from "../lib/queryKeys";
import { useSettingsStore } from "../store/settingsStore";
import { addLocalSubscription, isLocallySubscribed, removeLocalSubscription } from "../lib/localSubscriptions";
import { getCurrentLocalUser } from "../lib/localUsers";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  banner: {
    width: "100%",
    height: "110px",
    borderRadius: "12px",
    backgroundPosition: "center",
    backgroundSize: "cover",
    "@media (min-width: 600px)": {
      height: "140px",
    },
    "@media (min-width: 1024px)": {
      height: "180px",
    },
  },
  desktopHeader: {
    display: "none",
    "@media (min-width: 768px)": {
      display: "flex",
      gap: "16px",
      alignItems: "start",
    },
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tabArea: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: "4px",
  },
  descriptionCard: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  descriptionContent: {
    fontSize: "14px",
    overflow: "hidden",
    transition: "max-height 0.3s ease",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    "@media (min-width: 600px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (min-width: 900px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
    "@media (min-width: 1200px)": {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
    "@media (min-width: 1600px)": {
      gridTemplateColumns: "repeat(5, 1fr)",
    },
  },
  playlistGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    "@media (min-width: 600px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  },
  filterRow: {
    maxWidth: "240px",
    marginBottom: "12px",
  },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: "12px",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
});

export const ChannelPage = (): JSX.Element => {
  const styles = useStyles();
  const { authorId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "home";
  const baseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "oldest">("newest");
  const queryClient = useQueryClient();
  const localUser = getCurrentLocalUser();

  const localSubscribedQuery = useQuery({
    queryKey: [...queryKeys.localSubscriptions(localUser.id), authorId, "status"],
    queryFn: async () => isLocallySubscribed(authorId),
    enabled: !!authorId,
  });

  const channelQuery = useQuery({
    queryKey: queryKeys.channel(authorId),
    queryFn: ({ signal }) => getChannel(authorId, signal),
    enabled: !!authorId,
  });

  const playlistsQuery = useQuery({
    queryKey: queryKeys.channelPlaylists(authorId),
    queryFn: ({ signal }) => getChannelPlaylists(authorId, {}, signal),
    enabled: !!authorId && (currentTab === "home" || currentTab === "playlists"),
  });

  // Videos, Shorts, Streams logic
  const mode = currentTab === "videos" ? "videos" : currentTab === "shorts" ? "shorts" : "streams";
  const isVideoTab = currentTab === "videos" || currentTab === "shorts" || currentTab === "streams";

  const videoListQuery = useInfiniteQuery({
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
    enabled: !!authorId && isVideoTab,
  });

  const videoListItems = useMemo(() => videoListQuery.data?.pages.flatMap((page) => page.videos ?? []) ?? [], [videoListQuery.data]);

  if (!authorId) return <EmptyState title="チャンネルIDがありません" description="URL を確認してください。" />;
  if (channelQuery.isLoading) return <LoadingGrid />;
  if (channelQuery.isError || !channelQuery.data) {
    return <ErrorState title="チャンネルを取得できません" message="チャンネル情報の取得に失敗しました。" onRetry={() => channelQuery.refetch()} />;
  }

  const channel = channelQuery.data;
  const isLocalSubscribed = localSubscribedQuery.data ?? false;
  const banner = channel.authorBanners?.[0];
  const avatar = pickBestThumbnail(channel.authorThumbnails);

  const onTabSelect = (_: any, data: any) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", data.value);
      return next;
    });
  };

  const toggleLocalSubscribe = (): void => {
    if (isLocalSubscribed) {
      removeLocalSubscription(authorId);
    } else {
      addLocalSubscription(authorId);
    }
    void localSubscribedQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: queryKeys.localSubscriptions(localUser.id) });
  };

  const renderHome = () => (
    <>
      <Card appearance="outline" className={styles.descriptionCard}>
        <div
          className={styles.descriptionContent}
          style={{ maxHeight: showFullDescription ? "none" : "120px" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(channel.descriptionHtml || channel.description || "説明なし") }}
        />
        <Button
          appearance="subtle"
          size="small"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setShowFullDescription((prev) => !prev)}
        >
          {showFullDescription ? "閉じる" : "もっと見る"}
        </Button>
      </Card>

      <div className={styles.section}>
        <Text size={400} weight="bold">最新動画</Text>
        {(channel.latestVideos ?? []).length === 0 ? (
          <EmptyState title="動画がありません" description="最新動画が取得できませんでした。" />
        ) : (
          <div className={styles.grid}>
            {(channel.latestVideos ?? []).map((v) => (
              <VideoCard key={v.videoId} video={v} />
            ))}
          </div>
        )}
      </div>

      {(playlistsQuery.data?.playlists?.length ?? 0) > 0 && (
        <div className={styles.section}>
          <Text size={400} weight="bold">プレイリスト</Text>
          <div className={styles.playlistGrid}>
            {(playlistsQuery.data?.playlists ?? []).slice(0, 6).map((p) => (
              <PlaylistCard key={p.playlistId} playlist={p} />
            ))}
          </div>
        </div>
      )}

      {(channel.relatedChannels ?? []).length > 0 && (
        <div className={styles.section}>
          <Text size={400} weight="bold">関連チャンネル</Text>
          <div className={styles.playlistGrid}>
            {(channel.relatedChannels ?? []).slice(0, 6).map((related) => (
              <ChannelCard key={related.authorId} channel={related} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderVideoList = () => (
    <div className={styles.section}>
      {currentTab === "videos" && (
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
      )}
      
      {videoListQuery.isLoading ? <LoadingGrid /> : null}
      {videoListQuery.isError ? <ErrorState title="取得失敗" message="動画を取得できませんでした。" onRetry={() => videoListQuery.refetch()} /> : null}
      {!videoListQuery.isLoading && !videoListQuery.isError && videoListItems.length === 0 ? (
        <EmptyState title="動画がありません" description="このタブに表示できる項目がありません。" />
      ) : null}
      {videoListItems.length > 0 && <VideoGrid items={videoListItems} isShorts={currentTab === "shorts"} authorId={authorId} />}

      {videoListQuery.hasNextPage && (
        <Button
          className={styles.loadMoreBtn}
          onClick={() => videoListQuery.fetchNextPage()}
          disabled={videoListQuery.isFetchingNextPage}
          appearance="outline"
          icon={videoListQuery.isFetchingNextPage ? <Spinner size="tiny" /> : undefined}
        >
          さらに読み込む
        </Button>
      )}
    </div>
  );

  const renderPlaylists = () => (
    <div className={styles.section}>
      {playlistsQuery.isLoading ? <LoadingGrid count={4} /> : null}
      {playlistsQuery.isError ? <ErrorState title="取得失敗" message="プレイリストを取得できませんでした。" onRetry={() => playlistsQuery.refetch()} /> : null}
      {!playlistsQuery.isLoading && !playlistsQuery.isError && (playlistsQuery.data?.playlists?.length ?? 0) === 0 ? (
        <EmptyState title="プレイリストがありません" description="公開プレイリストが見つかりません。" />
      ) : null}
      {(playlistsQuery.data?.playlists?.length ?? 0) > 0 && (
        <div className={styles.playlistGrid}>
          {(playlistsQuery.data?.playlists ?? []).map((p) => (
            <PlaylistCard key={p.playlistId} playlist={p} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {banner?.url ? (
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${resolveMediaUrl(banner.url, baseUrl)})` }}
        />
      ) : null}

      <div className={styles.desktopHeader}>
        <Avatar
          image={{ src: resolveMediaUrl(avatar?.url, baseUrl) }}
          name={channel.author}
          size={96}
        />
        <div className={styles.headerInfo}>
          <Text size={600} weight="bold">{channel.author}</Text>
          <Text style={{ color: tokens.colorNeutralForeground3 }}>登録者 {formatNumberJa(channel.subCount)} 人</Text>
          <div style={{ marginTop: "8px" }}>
            <Button appearance={isLocalSubscribed ? "outline" : "primary"} size="small" onClick={toggleLocalSubscribe}>
              {isLocalSubscribed ? "登録解除" : "チャンネル登録"}
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: "none" }} className="mobile-only-header">
        <MobileChannelHeader
          authorId={authorId}
          author={channel.author}
          avatarSrc={resolveMediaUrl(avatar?.url, baseUrl)}
          subCount={channel.subCount}
        />
        <style>{`
          @media (max-width: 767px) {
            .mobile-only-header { display: block !important; }
          }
        `}</style>
      </div>

      <div className={styles.tabArea}>
        <TabList selectedValue={currentTab} onTabSelect={onTabSelect}>
          <Tab value="home">ホーム</Tab>
          <Tab value="videos">動画</Tab>
          <Tab value="shorts">ショート</Tab>
          <Tab value="streams">ライブ</Tab>
          <Tab value="playlists">プレイリスト</Tab>
        </TabList>
      </div>

      <div className={styles.tabContent}>
        {currentTab === "home" && renderHome()}
        {isVideoTab && renderVideoList()}
        {currentTab === "playlists" && renderPlaylists()}
      </div>
    </div>
  );
};
