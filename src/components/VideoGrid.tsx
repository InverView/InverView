import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SearchResultObject, VideoObject } from "../types/invidious";
import { ChannelCard } from "./ChannelCard";
import { HashtagCard } from "./HashtagCard";
import { PlaylistCard } from "./PlaylistCard";
import { VideoCard } from "./VideoCard";

interface VideoGridProps {
  items: Array<VideoObject | SearchResultObject>;
  isShorts?: boolean;
  authorId?: string;
}

interface DeferredRenderItemProps {
  children: ReactNode;
  estimatedHeight?: number;
  rootMargin?: string;
  disableVirtualization?: boolean;
}

const useKeyboardNavigationMode = (): boolean => {
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsKeyboardNavigating(true);
      }
    };

    const onPointerDown = () => {
      setIsKeyboardNavigating(false);
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return isKeyboardNavigating;
};

const DeferredRenderItem = ({
  children,
  estimatedHeight = 280,
  rootMargin = "300px 0px",
  disableVirtualization = false,
}: DeferredRenderItemProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(disableVirtualization);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableVirtualization) {
      setIsVisible(true);
      return;
    }

    const target = containerRef.current;
    if (!target) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [disableVirtualization, rootMargin]);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: isVisible ? undefined : estimatedHeight,
        contentVisibility: isVisible ? "visible" : "auto",
        containIntrinsicSize: `${estimatedHeight}px 1px`,
      }}
      onFocusCapture={() => {
        setIsVisible(true);
      }}
    >
      {isVisible ? children : null}
    </div>
  );
};

export const VideoGrid = ({ items, isShorts, authorId }: VideoGridProps): JSX.Element => {
  const isKeyboardNavigating = useKeyboardNavigationMode();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { videos, others } = useMemo(() => {
    const filteredVideos: VideoObject[] = [];
    const filteredOthers: SearchResultObject[] = [];
    for (const item of items) {
      if (item.type === "video" || item.type === "shortVideo") {
        filteredVideos.push(item as VideoObject);
      } else {
        filteredOthers.push(item as SearchResultObject);
      }
    }
    return { videos: filteredVideos, others: filteredOthers };
  }, [items]);
  const shouldVirtualizeVideos = videos.length >= 12 && !isKeyboardNavigating;

  useEffect(() => {
    if (!shouldVirtualizeVideos) return;
    const target = parentRef.current;
    if (!target) return;
    const updateWidth = () => {
      setContainerWidth(target.clientWidth);
    };
    updateWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldVirtualizeVideos]);

  const videoColumnCount = useMemo(() => {
    const minCardWidth = 280;
    const gap = 16;
    const width = containerWidth || (typeof window !== "undefined" ? window.innerWidth : minCardWidth);
    return Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)));
  }, [containerWidth]);

  const videoRowCount = Math.ceil(videos.length / videoColumnCount);
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualizeVideos ? videoRowCount : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isShorts ? 300 : 340),
    overscan: 2,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {videos.length > 0 && (
        shouldVirtualizeVideos ? (
          <div ref={parentRef} style={{ maxHeight: "70vh", overflowY: "auto", overscrollBehavior: "contain" }}>
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {virtualRows.map((virtualRow) => {
                const startIndex = virtualRow.index * videoColumnCount;
                const rowVideos = videos.slice(startIndex, startIndex + videoColumnCount);
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${videoColumnCount}, minmax(0, 1fr))`,
                        gap: 16,
                        paddingBottom: 16,
                      }}
                    >
                      {rowVideos.map((video, colIndex) => {
                        const index = startIndex + colIndex;
                        return (
                          <VideoCard
                            key={`${video.videoId}-${video.published ?? 0}`}
                            video={video}
                            isShorts={isShorts}
                            authorId={authorId}
                            prioritizeThumbnail={index < 2}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
              gap: 16,
            }}
          >
            {videos.map((video, index) => (
              // Keep above-the-fold cards out of intersection-gated rendering to improve LCP.
              // These thumbnails are likely candidates for the largest painted content.
              <DeferredRenderItem
                key={`${video.videoId}-${video.published ?? 0}`}
                disableVirtualization={isKeyboardNavigating || index < 4}
                estimatedHeight={260}
              >
                <VideoCard
                  video={video}
                  isShorts={isShorts}
                  authorId={authorId}
                  prioritizeThumbnail={index < 2}
                />
              </DeferredRenderItem>
            ))}
          </div>
        )
      )}

      {others.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gap: 16,
          }}
        >
          {others.map((item, index) => {
            if (item.type === "channel" && "authorThumbnails" in item) {
              return (
                <DeferredRenderItem
                  key={`ch-${item.authorId}-${index}`}
                  disableVirtualization={isKeyboardNavigating}
                  estimatedHeight={108}
                >
                  <ChannelCard channel={item as any} />
                </DeferredRenderItem>
              );
            }
            if ((item.type === "playlist" || item.type === "invidiousPlaylist") && "playlistId" in item) {
              return (
                <DeferredRenderItem
                  key={`pl-${item.playlistId}-${index}`}
                  disableVirtualization={isKeyboardNavigating}
                  estimatedHeight={240}
                >
                  <PlaylistCard playlist={item as any} />
                </DeferredRenderItem>
              );
            }
            return (
              <DeferredRenderItem
                key={`hs-${index}`}
                disableVirtualization={isKeyboardNavigating}
                estimatedHeight={120}
              >
                <HashtagCard hashtag={item as any} />
              </DeferredRenderItem>
            );
          })}
        </div>
      )}
    </div>
  );
};
