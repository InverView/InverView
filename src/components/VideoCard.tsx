import { memo, useCallback, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Caption1,
  makeStyles,
  tokens,
  Avatar,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import { MoreHorizontal20Regular } from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { formatDuration, formatRelativeDateJa, formatViewCountJa } from "../lib/format";
import { pickBestThumbnail } from "../lib/media";
import { withViewTransition } from "../lib/webPlatform";
import { useSettingsStore } from "../store/settingsStore";
import type { VideoObject } from "../types/invidious";
import { BadgeRow } from "./BadgeRow";
import { Thumbnail } from "./Thumbnail";

interface VideoCardProps {
  video: VideoObject;
  horizontal?: boolean;
  isShorts?: boolean;
  authorId?: string;
  prioritizeThumbnail?: boolean;
}
const useStyles = makeStyles({
  card: {
    width: "100%",
    maxWidth: "100%",
    cursor: "pointer",
    height: "fit-content",
    transition: "box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease",
    ":hover": {
      boxShadow: tokens.shadow8,
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  verticalCard: {
    padding: "12px",
    overflow: "hidden",
    rowGap: "0",
  },
  horizontalCard: {
    display: "flex",
    flexDirection: "row",
    height: "94px",
    padding: "0",
    gap: "8px",
    alignItems: "flex-start",
    minWidth: 0,
  },
  body: {
    padding: "10px 0 0",
    display: "flex",
    flexDirection: "column",
    gap: "0",
    minWidth: 0,
  },
  preview: {
    width: "auto",
    margin: "-12px -12px 0 -12px",
    overflow: "hidden",
    position: "relative",
  },
  horizontalPreview: {
    width: "160px",
    minWidth: "160px",
    aspectRatio: "16 / 9",
    flexShrink: 0,
  },
  title: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.2em",
    fontWeight: tokens.fontWeightBold,
    fontSize: "14px",
  },
  horizontalTitle: {
    fontSize: "12px",
    lineHeight: "1.3em",
    WebkitLineClamp: 2,
  },
  metadata: {
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  authorLink: {
    cursor: "pointer",
    ":hover": {
      color: tokens.colorNeutralForeground2BrandHover,
    },
  },
  horizontalMetadata: {
    fontSize: "11px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  duration: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "white",
    padding: "1px 4px",
    borderRadius: "2px",
    fontSize: "10px",
    fontWeight: "bold",
  },
});

const VideoCardBase = ({
  video,
  horizontal = false,
  isShorts,
  authorId,
  prioritizeThumbnail = false,
}: VideoCardProps): JSX.Element => {
  const styles = useStyles();
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const thumbnail = useMemo(() => pickBestThumbnail(video.videoThumbnails), [video.videoThumbnails]);
  const authorThumbnail = useMemo(
    () => (video.authorThumbnails ? pickBestThumbnail(video.authorThumbnails) : null),
    [video.authorThumbnails],
  );

  const handleNavigate = useCallback(() => {
    if (isShorts) {
      const query = authorId ? `?authorId=${authorId}` : "";
      withViewTransition(() => navigate(`/shorts/${video.videoId}${query}`));
    } else {
      withViewTransition(() => navigate(`/watch/${video.videoId}?autoplay=1`));
    }
  }, [authorId, isShorts, navigate, video.videoId]);

  const handleChannelNavigate = useCallback(() => {
    withViewTransition(() => navigate(`/channel/${video.authorId}`));
  }, [navigate, video.authorId]);

  return (
    <Card
      className={`${styles.card} ${horizontal ? styles.horizontalCard : styles.verticalCard}`}
      onClick={handleNavigate}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") {
          handleNavigate();
        }
      }}
      appearance="subtle"
      orientation={horizontal ? "horizontal" : "vertical"}
      focusMode="off"
    >
      <CardPreview className={horizontal ? styles.horizontalPreview : styles.preview}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Thumbnail
            src={thumbnail?.url}
            sources={video.videoThumbnails}
            alt={video.title}
            baseUrl={baseUrl}
            squareBottomCorners={!horizontal}
            loading={prioritizeThumbnail ? "eager" : "lazy"}
            fetchPriority={prioritizeThumbnail ? "high" : "auto"}
            sizes={horizontal ? "(max-width: 1024px) 45vw, 160px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"}
          />
          {!video.liveNow && video.lengthSeconds ? (
            <div className={styles.duration}>{formatDuration(video.lengthSeconds)}</div>
          ) : null}
        </div>
      </CardPreview>

      {horizontal ? (
        <CardHeader
          style={{ padding: "4px 0", minWidth: 0 }}
          header={
            <Text className={`${styles.title} ${styles.horizontalTitle}`} block>
              {video.title}
            </Text>
          }
          description={
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <Caption1
                className={`${styles.metadata} ${styles.horizontalMetadata} ${styles.authorLink}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChannelNavigate();
                }}
              >
                {video.author}
              </Caption1>
              <Caption1 className={`${styles.metadata} ${styles.horizontalMetadata}`}>
                {formatViewCountJa(video.viewCount, video.viewCountText)} ・{" "}
                {formatRelativeDateJa(video.published, video.publishedText)}
              </Caption1>
            </div>
          }
        />
      ) : (
        <div className={styles.body}>
          <CardHeader
            style={{ minWidth: 0 }}
            image={
              <Avatar
                size={32}
                name={video.author}
                image={{
                  src: authorThumbnail?.url ? (authorThumbnail.url.startsWith("http") ? authorThumbnail.url : `${baseUrl}${authorThumbnail.url}`) : undefined,
                }}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChannelNavigate();
                }}
              />
            }
            header={
              <Text className={styles.title} block>
                {video.title}
              </Text>
            }
            description={
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <Caption1
                  className={`${styles.metadata} ${styles.authorLink}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChannelNavigate();
                  }}
                >
                  {video.author}
                </Caption1>
                <Caption1 className={styles.metadata}>
                  {formatViewCountJa(video.viewCount, video.viewCountText)} ・{" "}
                  {formatRelativeDateJa(video.published, video.publishedText)}
                </Caption1>
                <BadgeRow video={video} />
              </div>
            }
            action={
              <Menu positioning="below-end">
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    appearance="transparent"
                    icon={<MoreHorizontal20Regular />}
                    aria-label="その他の操作"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChannelNavigate();
                      }}
                    >
                      チャンネルを開く
                    </MenuItem>
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate();
                      }}
                    >
                      動画を開く
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            }
          />
        </div>
      )}
    </Card>
  );
};

export const VideoCard = memo(VideoCardBase, (prev, next) => {
  return (
    prev.horizontal === next.horizontal &&
    prev.isShorts === next.isShorts &&
    prev.authorId === next.authorId &&
    prev.prioritizeThumbnail === next.prioritizeThumbnail &&
    prev.video.videoId === next.video.videoId &&
    prev.video.title === next.video.title &&
    prev.video.published === next.video.published &&
    prev.video.viewCount === next.video.viewCount &&
    prev.video.liveNow === next.video.liveNow &&
    prev.video.lengthSeconds === next.video.lengthSeconds
  );
});
