import {
  Text,
  makeStyles,
  tokens,
  Button,
  Link,
  Card,
  Divider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import { Add16Regular, Delete16Regular, Dismiss16Regular, MoreHorizontal20Regular } from "@fluentui/react-icons";
import DOMPurify from "dompurify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { BadgeRow } from "../components/BadgeRow";
import { Comments } from "../components/Comments";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { WatchLoadingSkeleton } from "../components/WatchLoadingSkeleton";
import { MobileChannelHeader } from "../components/mobile/MobileChannelHeader";
import { MobileVideoActions } from "../components/mobile/MobileVideoActions";
import { VideoCard } from "../components/VideoCard";
import { VideoPlayer } from "../components/VideoPlayer";
import { useMiniPlayer, useSettings } from "../hooks/useSettings";
import { formatDateJa, formatDuration, formatNumberJa, formatViewCountJa } from "../lib/format";
import { addWatchHistoryItem, findWatchHistoryItem, updateWatchHistoryPosition } from "../lib/watchHistory";
import { getCaptions, getVideo } from "../lib/invidiousClient";
import { pickBestThumbnail, resolveMediaUrl } from "../lib/media";
import { queryKeys } from "../lib/queryKeys";
import { useSettingsStore } from "../store/settingsStore";
import { addLocalSubscription, isLocallySubscribed, removeLocalSubscription } from "../lib/localSubscriptions";
import { getCurrentLocalUser } from "../lib/localUsers";

interface ChapterItem {
  label: string;
  seconds: number;
}

interface QueueItem {
  videoId: string;
  title: string;
  author: string;
}

interface ResumePromptState {
  savedSeconds: number;
}

const QUEUE_STORAGE_KEY = "watch-play-queue-v1";
const RESUME_MIN_SECONDS = 30;
const RESUME_STALE_MS = 1000 * 60 * 60 * 24 * 30;
const RESUME_NEAR_END_RATIO = 0.95;
const SHORTS_MAX_SECONDS = 70;
const RESUME_PROMPT_TIMEOUT_MS = 3000;

const readQueue = (): QueueItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === "object" && item ? item as QueueItem : null))
      .filter((item): item is QueueItem => !!item && !!item.videoId && !!item.title);
  } catch {
    return [];
  }
};

const writeQueue = (queue: QueueItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage quota/private mode errors and keep runtime state only.
  }
};

const parseChapters = (input: string | undefined): ChapterItem[] => {
  if (!input) return [];
  const lines = input.split("\n").map((line) => line.trim()).filter(Boolean);

  return lines
    .map((line) => {
      const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
      if (!match) return null;
      const [hh, mm, ss] = match[1].split(":").map((value) => Number.parseInt(value, 10));
      const seconds = match[1].split(":").length === 3 ? (hh * 3600 + mm * 60 + ss) : (hh * 60 + mm);
      return { label: match[2], seconds };
    })
    .filter((item): item is ChapterItem => item !== null)
    .slice(0, 30);
};

const useStyles = makeStyles({
  container: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    alignItems: "start",
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "minmax(0, 1fr) 380px",
    },
  },
  mainCol: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: 0,
  },
  playerContainer: {
    width: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    "@media (max-width: 1023px)": {
      paddingBottom: "12px",
    },
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    "@media (max-width: 1023px)": {
      padding: "0 12px",
    },
  },
  metadataRow: {
    display: "flex",
    gap: "12px",
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
    flexWrap: "wrap",
  },
  descriptionCard: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  descriptionContent: {
    fontSize: "15px",
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.7",
    overflow: "hidden",
    transition: "max-height 0.3s ease",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecorationLine: "none",
      ":hover": {
        textDecorationLine: "underline",
      },
    },
    "& p": {
      marginBottom: "8px",
    },
  },
  chapterItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    padding: "4px 0",
  },
  sideCol: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: 0,
  },
  queueCard: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  queueHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  queueList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  queueItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    minWidth: 0,
  },
  queueItemText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  ellipsis: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rowActions: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    height: "102px",
  },
  relatedCardWrap: {
    flex: 1,
    minWidth: 0,
  },
  mobileActionsWrap: {
    width: "100%",
  },
  resumePromptCard: {
    margin: "0 12px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    "@media (min-width: 1024px)": {
      margin: "0",
    },
  },
  resumePromptActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
});

export const WatchPage = (): JSX.Element => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const { videoId = "" } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const region = useSettingsStore((state) => state.region);
  const { settings } = useSettings();
  const { setMiniPlayer } = useMiniPlayer();
  const queryClient = useQueryClient();
  const localUser = getCurrentLocalUser();

  const [showFullDesc, setShowFullDesc] = useState(settings.expandDescriptionByDefault);
  const [showChapters, setShowChapters] = useState(settings.expandChaptersByDefault);
  const [restoredPosition, setRestoredPosition] = useState(0);
  const [playerSessionId, setPlayerSessionId] = useState(0);
  const [resumePrompt, setResumePrompt] = useState<ResumePromptState | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>(() => readQueue());
  const isAutoplay = useMemo(() => new URLSearchParams(search).get("autoplay") === "1", [search]);
  const lastPersistRef = useRef(0);

  useEffect(() => {
    writeQueue(queue);
  }, [queue]);

  useEffect(() => {
    if (!videoId) return;
    const mainContent = document.querySelector("main");
    if (mainContent instanceof HTMLElement) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [videoId]);

  useEffect(() => {
    setShowFullDesc(settings.expandDescriptionByDefault);
    setShowChapters(settings.expandChaptersByDefault);
  }, [settings.expandDescriptionByDefault, settings.expandChaptersByDefault, videoId]);

  const videoQuery = useQuery({
    queryKey: queryKeys.video(videoId, region),
    queryFn: ({ signal }) => getVideo(videoId, signal),
    enabled: !!videoId,
  });
  const video = videoQuery.data;

  const captionsQuery = useQuery({
    queryKey: queryKeys.captions(videoId),
    queryFn: ({ signal }) => getCaptions(videoId, undefined, signal),
    enabled: !!videoId,
  });
  const subscribeAuthorId = videoQuery.data?.authorId ?? "";
  const localSubscribedQuery = useQuery({
    queryKey: [...queryKeys.localSubscriptions(localUser.id), subscribeAuthorId, "status"],
    queryFn: async () => (subscribeAuthorId ? isLocallySubscribed(subscribeAuthorId) : false),
    enabled: !!subscribeAuthorId,
  });

  useEffect(() => {
    const video = videoQuery.data;
    if (!video) return;

    const thumb = pickBestThumbnail(video.videoThumbnails);
    if (settings.saveWatchHistory) {
      addWatchHistoryItem({
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: thumb?.url ?? "",
        channelName: video.author,
        watchedAt: Date.now(),
        positionSeconds: restoredPosition,
        durationSeconds: video.lengthSeconds,
      });
    }

    if (settings.miniPlayer) {
      setMiniPlayer({
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: thumb?.url ?? "",
        visible: true,
      });
    }
  }, [videoQuery.data, settings.saveWatchHistory, settings.miniPlayer, restoredPosition, setMiniPlayer]);

  useEffect(() => {
    if (!videoId || !settings.rememberPlaybackPosition) {
      setRestoredPosition(0);
      setResumePrompt(null);
      return;
    }

    const history = findWatchHistoryItem(videoId);
    const savedSeconds = history?.positionSeconds ?? 0;
    const watchedAt = history?.watchedAt ?? 0;

    if (!video) {
      setRestoredPosition(0);
      setResumePrompt(null);
      return;
    }

    const videoDuration = Math.max(0, video.lengthSeconds ?? 0);
    const isNearEnd = videoDuration > 0 && savedSeconds >= Math.floor(videoDuration * RESUME_NEAR_END_RATIO);
    const isStale = watchedAt > 0 && Date.now() - watchedAt > RESUME_STALE_MS;
    const isShortLike = videoDuration > 0 && videoDuration <= SHORTS_MAX_SECONDS;
    const isLiveLike = !!video.liveNow || !!video.isUpcoming;
    const shouldResume =
      savedSeconds >= RESUME_MIN_SECONDS &&
      !isNearEnd &&
      !isStale &&
      !isShortLike &&
      !isLiveLike;

    if (!shouldResume) {
      setRestoredPosition(0);
      setResumePrompt(null);
      return;
    }

    setRestoredPosition(savedSeconds);
    setResumePrompt({ savedSeconds });
  }, [videoId, settings.rememberPlaybackPosition, video]);

  useEffect(() => {
    if (!resumePrompt) return;
    const timer = window.setTimeout(() => {
      setResumePrompt(null);
    }, RESUME_PROMPT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [resumePrompt]);

  const isLocalSubscribed = localSubscribedQuery.data ?? false;

  const authorThumb = useMemo(
    () => (video ? pickBestThumbnail(video.authorThumbnails ?? video.videoThumbnails) : undefined),
    [video?.authorThumbnails, video?.videoThumbnails],
  );

  const descriptionHtml = useMemo(
    () =>
      video
        ? DOMPurify.sanitize(video.descriptionHtml || video.description || "説明はありません。")
        : "",
    [video?.descriptionHtml, video?.description],
  );
  const rawDescription = useMemo(() => (video?.description ?? "").replace(/\s+/g, " ").trim(), [video?.description]);
  const metaDescription = rawDescription.slice(0, 140) || t("watch.descriptionFallback");
  const pageTitle = video ? `${video.title} - ${t("appName")}` : t("appName");

  const chapters = useMemo(() => (video ? parseChapters(video.description || "") : []), [video?.description]);
  const queueHead = queue[0];
  const queuedVideoIds = useMemo(() => new Set(queue.map((item) => item.videoId)), [queue]);
  const relatedVideos = video?.recommendedVideos ?? [];
  const relatedListRef = useRef<HTMLDivElement | null>(null);
  const shouldVirtualizeRelated = relatedVideos.length >= 20;
  const relatedVirtualizer = useVirtualizer({
    count: shouldVirtualizeRelated ? relatedVideos.length : 0,
    getScrollElement: () => relatedListRef.current,
    estimateSize: () => 110,
    overscan: 4,
  });
  const relatedVirtualRows = relatedVirtualizer.getVirtualItems();
  const enqueue = (item: QueueItem): void => {
    setQueue((prev) => {
      if (item.videoId === videoId || prev.some((q) => q.videoId === item.videoId)) return prev;
      return [...prev, item];
    });
  };

  const removeFromQueue = (videoIdToRemove: string): void => {
    setQueue((prev) => prev.filter((item) => item.videoId !== videoIdToRemove));
  };

  const toggleLocalSubscribe = (): void => {
    if (!video?.authorId) return;
    if (isLocalSubscribed) {
      removeLocalSubscription(video.authorId);
    } else {
      addLocalSubscription(video.authorId);
    }
    void localSubscribedQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: queryKeys.localSubscriptions(localUser.id) });
  };

  if (!videoId) {
    return <EmptyState title="動画IDがありません" description="URL を確認してください。" />;
  }

  if (videoQuery.isLoading) {
    return <WatchLoadingSkeleton theaterMode={settings.theaterMode} />;
  }

  if (videoQuery.isError || !video) {
    return (
      <ErrorState
        title="動画情報を取得できません"
        message="動画情報を取得できません。"
        onRetry={() => videoQuery.refetch()}
      />
    );
  }

  return (
    <>
      <Helmet>
        <html lang={i18n.language} />
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="video.other" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ""} />
      </Helmet>
      <div className={styles.container}>
      <div className={styles.mainCol}>
        <div className={styles.playerContainer}>
          <VideoPlayer
            key={`${video.videoId}-${playerSessionId}-${restoredPosition}`}
            video={video}
            baseUrl={baseUrl}
            initialPositionSeconds={settings.rememberPlaybackPosition ? restoredPosition : 0}
            onPositionChange={(seconds) => {
              if (!settings.rememberPlaybackPosition || !settings.saveWatchHistory) return;
              const now = Date.now();
              if (now - lastPersistRef.current < 3000) return;
              lastPersistRef.current = now;
              updateWatchHistoryPosition(video.videoId, seconds);
            }}
            onEnded={() => {
              if (!settings.autoplayNextVideo) return;
              if (queueHead?.videoId) {
                setQueue((prev) => prev.slice(1));
                navigate(`/watch/${queueHead.videoId}?autoplay=1`);
                return;
              }
              const nextVideo = relatedVideos[0];
              if (nextVideo?.videoId) navigate(`/watch/${nextVideo.videoId}?autoplay=1`);
            }}
            autoplay={isAutoplay}
          />
        </div>
        {resumePrompt ? (
          <Card appearance="filled-alternative" className={styles.resumePromptCard}>
            <Text size={200}>
              前回の続き: {formatDuration(resumePrompt.savedSeconds)}
            </Text>
            <div className={styles.resumePromptActions}>
              <Button appearance="primary" size="small" onClick={() => setResumePrompt(null)}>
                {formatDuration(resumePrompt.savedSeconds)} から再生
              </Button>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => {
                  setResumePrompt(null);
                  setRestoredPosition(0);
                  setPlayerSessionId((prev) => prev + 1);
                }}
              >
                最初から再生
              </Button>
            </div>
          </Card>
        ) : null}

        <div className={styles.infoSection}>
          <Text size={600} weight="bold">
            {video.title}
          </Text>
          <BadgeRow video={video} />
          <div className={styles.metadataRow}>
            <Text>{formatViewCountJa(video.viewCount, video.viewCountText)}</Text>
            <Text>{video.publishedText || formatDateJa(video.published)}</Text>
            {typeof video.likeCount === "number" ? <Text>高評価 {formatNumberJa(video.likeCount)}</Text> : null}
          </div>
        </div>

        <MobileChannelHeader
          authorId={video.authorId}
          author={video.author}
          avatarSrc={resolveMediaUrl(authorThumb?.url, baseUrl)}
          subCount={video.subCount}
          secondaryActionLabel={isLocalSubscribed ? "登録解除" : "チャンネル登録"}
          secondaryActionAppearance={isLocalSubscribed ? "outline" : "primary"}
          onSecondaryActionClick={toggleLocalSubscribe}
        />

        <div className={styles.mobileActionsWrap}>
          <MobileVideoActions
            videoId={video.videoId}
            title={video.title}
            video={video}
            baseUrl={baseUrl}
            startTimeSeconds={settings.rememberPlaybackPosition ? restoredPosition : 0}
          />
        </div>
        <Card appearance="outline" className={styles.descriptionCard}>
          <Text weight="semibold">概要</Text>
          <div
            className={styles.descriptionContent}
            style={{ maxHeight: showFullDesc ? "none" : "96px" }}
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
          <Button
            appearance="subtle"
            size="small"
            style={{ alignSelf: "flex-start" }}
            onClick={() => setShowFullDesc((prev) => !prev)}
          >
            {showFullDesc ? "閉じる" : "もっと見る"}
          </Button>
        </Card>

        {chapters.length > 0 && (
          <Card appearance="outline" className={styles.descriptionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text weight="semibold">チャプター</Text>
              <Button appearance="subtle" size="small" onClick={() => setShowChapters((prev) => !prev)}>
                {showChapters ? "折りたたむ" : "展開"}
              </Button>
            </div>
            {showChapters && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {chapters.map((chapter) => (
                  <div key={`${chapter.seconds}-${chapter.label}`} className={styles.chapterItem}>
                    <Text size={200}>{chapter.label}</Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{formatDuration(chapter.seconds)}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {(captionsQuery.data?.length ?? 0) > 0 && (
          <div className={styles.infoSection}>
            <Text weight="semibold">字幕</Text>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {(captionsQuery.data ?? []).map((caption, index) => (
                <Link
                  key={`${caption.languageCode ?? "caption"}-${index}`}
                  href={caption.url || "#"}
                  target="_blank"
                >
                  {caption.label || caption.languageCode || "字幕"}
                  {settings.showCaptionsByDefault ? " (初期表示ON)" : ""}
                </Link>
              ))}
            </div>
          </div>
        )}

        <Comments videoId={videoId} initiallyExpanded={settings.expandCommentsByDefault} />
      </div>

      <div className={styles.sideCol}>
        <Card appearance="outline" className={styles.queueCard}>
          <div className={styles.queueHeader}>
            <Text weight="bold">再生キュー</Text>
            <Button
              size="small"
              appearance="subtle"
              icon={<Delete16Regular />}
              disabled={queue.length === 0}
              onClick={() => setQueue([])}
            >
              クリア
            </Button>
          </div>
          {queue.length === 0 ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              関連動画の「キューに追加」から登録できます。
            </Text>
          ) : (
            <div className={styles.queueList}>
              {queue.map((item, index) => (
                <div key={`${item.videoId}-${index}`} className={styles.queueItem}>
                  <div className={styles.queueItemText}>
                    <Text size={200} className={styles.ellipsis}>
                      {index === 0 ? `次: ${item.title}` : item.title}
                    </Text>
                    <Text size={100} className={styles.ellipsis} style={{ color: tokens.colorNeutralForeground3 }}>
                      {item.author}
                    </Text>
                  </div>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Dismiss16Regular />}
                    aria-label={`${item.title} をキューから削除`}
                    onClick={() => removeFromQueue(item.videoId)}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Divider />
        <Text weight="bold" size={400} style={{ marginBottom: "4px" }}>
          関連動画
        </Text>
        {relatedVideos.length === 0 ? (
          <EmptyState title="関連動画がありません" description="おすすめ動画が提供されていません。" />
        ) : shouldVirtualizeRelated ? (
          <div ref={relatedListRef} style={{ maxHeight: "70vh", overflowY: "auto", overscrollBehavior: "contain" }}>
            <div style={{ height: relatedVirtualizer.getTotalSize(), position: "relative" }}>
              {relatedVirtualRows.map((virtualRow) => {
                const item = relatedVideos[virtualRow.index];
                if (!item) return null;
                return (
                  <div
                    key={`${item.videoId}-${item.title}-${virtualRow.index}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className={styles.rowActions}>
                      <div className={styles.relatedCardWrap}>
                        <VideoCard video={item} horizontal={true} />
                      </div>
                      <Menu positioning="below-end">
                        <MenuTrigger disableButtonEnhancement>
                          <Button
                            appearance="subtle"
                            icon={<MoreHorizontal20Regular />}
                            aria-label={`${item.title} の操作メニュー`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </MenuTrigger>
                        <MenuPopover>
                          <MenuList>
                            <MenuItem
                              icon={<Add16Regular />}
                              disabled={queuedVideoIds.has(item.videoId)}
                              onClick={(e) => {
                                e.stopPropagation();
                                enqueue({
                                  videoId: item.videoId,
                                  title: item.title,
                                  author: item.author,
                                });
                              }}
                            >
                              {queuedVideoIds.has(item.videoId) ? "キュー追加済み" : "キューに追加"}
                            </MenuItem>
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          relatedVideos.map((item) => (
            <div key={`${item.videoId}-${item.title}`} className={styles.rowActions}>
              <div className={styles.relatedCardWrap}>
                <VideoCard video={item} horizontal={true} />
              </div>
              <Menu positioning="below-end">
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    appearance="subtle"
                    icon={<MoreHorizontal20Regular />}
                    aria-label={`${item.title} の操作メニュー`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem
                      icon={<Add16Regular />}
                      disabled={queuedVideoIds.has(item.videoId)}
                      onClick={(e) => {
                        e.stopPropagation();
                        enqueue({
                          videoId: item.videoId,
                          title: item.title,
                          author: item.author,
                        });
                      }}
                    >
                      {queuedVideoIds.has(item.videoId) ? "キュー追加済み" : "キューに追加"}
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};
