import { useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  Link,
  Button,
  makeStyles,
  tokens,
  Card,
} from "@fluentui/react-components";
import screenfull from "screenfull";
import { useTranslation } from "react-i18next";
import type { VideoDetails } from "../types/invidious";
import { pickPlayableStream, pickPosterThumbnail, resolveMediaUrl } from "../lib/media";
import { togglePictureInPicture, vibrate } from "../lib/webPlatform";
import { useSettingsStore } from "../store/settingsStore";
import { notifyError } from "../lib/notifications";

type ShakaRuntime = typeof import("shaka-player/dist/shaka-player.ui.js").default;
type HlsRuntime = typeof import("hls.js").default;

let playerRuntimePromise: Promise<{ shaka: ShakaRuntime; Hls: HlsRuntime }> | null = null;

const loadPlayerRuntime = async (): Promise<{ shaka: ShakaRuntime; Hls: HlsRuntime }> => {
  if (playerRuntimePromise) return playerRuntimePromise;
  playerRuntimePromise = (async () => {
    const [shakaModule, hlsModule] = await Promise.all([
      import("shaka-player/dist/shaka-player.ui.js"),
      import("hls.js"),
      import("shaka-player/dist/controls.css"),
    ]);
    return { shaka: shakaModule.default, Hls: hlsModule.default };
  })();
  return playerRuntimePromise;
};

interface VideoPlayerProps {
  video: VideoDetails;
  baseUrl: string;
  initialPositionSeconds?: number;
  onPositionChange?: (seconds: number) => void;
  onEnded?: () => void;
  autoplay?: boolean;
  isShorts?: boolean;
}

const useStyles = makeStyles({
  container: {
    padding: "0",
    display: "flex",
    flexDirection: "column",
    gap: "0",
    overflow: "hidden",
  },
  surfaceWrap: {
    position: "relative",
    width: "100%",
    backgroundColor: "black",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  contentArea: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  audioOnlyWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    padding: "16px",
    margin: "12px",
  },
  errorText: {
    color: tokens.colorPalettePumpkinForeground2,
    fontWeight: tokens.fontWeightBold,
  },
  embedWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    overflow: "hidden",
    aspectRatio: "16 / 9",
  },
  linkRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
});

export const VideoPlayer = ({
  video,
  baseUrl,
  initialPositionSeconds,
  onPositionChange,
  onEnded,
  autoplay: autoplayProp,
  isShorts,
}: VideoPlayerProps): JSX.Element => {
  const styles = useStyles();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const onEndedRef = useRef(onEnded);
  const [playbackError, setPlaybackError] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  
  const settingsAutoplay = useSettingsStore((state) => state.autoplay);
  const autoplay = autoplayProp ?? settingsAutoplay;
  const loopVideo = useSettingsStore((state) => state.loopVideo);
  const quality = useSettingsStore((state) => state.quality);
  const audioOnly = useSettingsStore((state) => state.audioOnly);
  const dataSaver = useSettingsStore((state) => state.dataSaver);
  const companionUrl = useSettingsStore((state) => state.companionUrl);
  const volume = useSettingsStore((state) => state.volume);
  const muted = useSettingsStore((state) => state.muted);
  const setVolume = useSettingsStore((state) => state.setVolume);
  const setMuted = useSettingsStore((state) => state.setMuted);

  const stream = useMemo(
    () =>
      pickPlayableStream(
        video.formatStreams?.map((item) => ({ ...item, url: resolveMediaUrl(item.url, baseUrl) })),
        { quality, dataSaver, audioOnly },
      ),
    [video.formatStreams, baseUrl, quality, dataSaver, audioOnly],
  );

  const dashUrl = useMemo(() => {
    if (companionUrl) {
      let cleanBase = companionUrl.replace(/\/+$/, "");
      if (cleanBase.endsWith("/companion")) {
        cleanBase = cleanBase.substring(0, cleanBase.length - 10);
      }
      return `${cleanBase}/companion/api/manifest/dash/id/${video.videoId}?local=true`;
    }
    return resolveMediaUrl(video.dashUrl, baseUrl);
  }, [companionUrl, video.dashUrl, video.videoId, baseUrl]);

  const hlsUrl = resolveMediaUrl(video.hlsUrl, baseUrl);

  const isIOS = useMemo(() => {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
  }, []);

  const manifestUrl = useMemo(() => {
    // iOS Safari prefers HLS and often fails with DASH via MSE
    if (isIOS && hlsUrl) return hlsUrl;
    return dashUrl || hlsUrl || stream?.url;
  }, [isIOS, dashUrl, hlsUrl, stream?.url]);

  const poster = resolveMediaUrl(pickPosterThumbnail(video.videoThumbnails)?.url, baseUrl);
  const embedUrl = baseUrl
    ? `${baseUrl.replace(/\/+$/, "")}/embed/${video.videoId}`
    : `https://www.youtube-nocookie.com/embed/${video.videoId}`;

  useEffect(() => {
    if (!playbackError) return;
    notifyError(playbackError);
  }, [playbackError]);

  useEffect(() => {
    if (!containerRef.current) return;

    let isCancelled = false;
    let player: InstanceType<ShakaRuntime["Player"]> | null = null;
    let hlsPlayer: InstanceType<HlsRuntime> | null = null;
    let ui: any = null;
    let onTimeUpdate: (() => void) | null = null;
    let onVideoEnded: (() => void) | null = null;
    let onPlay: (() => void) | null = null;
    let onPause: (() => void) | null = null;
    let onVolumeChange: (() => void) | null = null;
    const canUseMediaSession = typeof navigator !== "undefined" && "mediaSession" in navigator;

    setPlaybackError("");
    // Clear existing content to prevent duplicates
    containerRef.current.innerHTML = "";

    const videoElement = document.createElement("video");
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.poster = poster;
    videoElement.autoplay = autoplay;
    videoElement.loop = loopVideo;
    videoElement.playsInline = true;
    videoElement.volume = volume;
    videoElement.muted = muted;
    containerRef.current.appendChild(videoElement);

    const onTogglePip = () => {
      void togglePictureInPicture(videoElement);
    };
    const onToggleFullscreen = () => {
      if (!containerRef.current || !screenfull.isEnabled) return;
      void screenfull.toggle(containerRef.current);
    };
    window.addEventListener("inverview:toggle-pip", onTogglePip as EventListener);
    window.addEventListener("inverview:toggle-fullscreen", onToggleFullscreen as EventListener);

    const onFullscreenChange = () => {
      setIsFullscreen(screenfull.isEnabled ? screenfull.isFullscreen : false);
    };
    if (screenfull.isEnabled) {
      screenfull.on("change", onFullscreenChange);
    }

    if (canUseMediaSession) {
      const artwork = poster
        ? [
            { src: poster, sizes: "96x96", type: "image/jpeg" },
            { src: poster, sizes: "128x128", type: "image/jpeg" },
            { src: poster, sizes: "192x192", type: "image/jpeg" },
            { src: poster, sizes: "256x256", type: "image/jpeg" },
            { src: poster, sizes: "384x384", type: "image/jpeg" },
            { src: poster, sizes: "512x512", type: "image/jpeg" },
          ]
        : undefined;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title,
        artist: video.author,
        album: "InverView",
        artwork,
      });
      navigator.mediaSession.playbackState = videoElement.paused ? "paused" : "playing";
      navigator.mediaSession.setActionHandler("play", async () => {
        await videoElement.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        videoElement.pause();
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const seekOffset = details.seekOffset ?? 10;
        videoElement.currentTime = Math.max(videoElement.currentTime - seekOffset, 0);
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const seekOffset = details.seekOffset ?? 10;
        videoElement.currentTime = Math.min(
          videoElement.currentTime + seekOffset,
          Number.isFinite(videoElement.duration) ? videoElement.duration : videoElement.currentTime + seekOffset,
        );
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") {
          videoElement.currentTime = details.seekTime;
        }
      });
      try {
        navigator.mediaSession.setActionHandler("enterpictureinpicture" as MediaSessionAction, async () => {
          await togglePictureInPicture(videoElement);
        });
      } catch {
        // unsupported action name
      }
    }

    const initPlayer = async () => {
      const { shaka, Hls } = await loadPlayerRuntime();
      if (isCancelled) return;

      const enableHlsFallback = (): boolean => {
        if (!hlsUrl) return false;

        if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
          videoElement.src = hlsUrl;
          if (autoplay) {
            void videoElement.play().catch(() => {
              // no-op
            });
          }
          return true;
        }

        if (!Hls.isSupported()) return false;
        hlsPlayer = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsPlayer.loadSource(hlsUrl);
        hlsPlayer.attachMedia(videoElement);
        if (autoplay) {
          void videoElement.play().catch(() => {
            // no-op
          });
        }
        return true;
      };

      try {
        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
          if (!isCancelled) setPlaybackError("このブラウザは Shaka Player をサポートしていません。");
          return;
        }

        player = new shaka.Player();
        await player.attach(videoElement);
        if (isCancelled) return;

        if (containerRef.current) {
          ui = new (shaka as any).ui.Overlay(player, containerRef.current, videoElement);
          
          const uiConfig = {
            seekBarColors: {
              base: 'rgba(255, 255, 255, 0.3)',
              buffered: 'rgba(255, 255, 255, 0.5)',
              played: '#2a8cff',
            },
            volumeBarColors: {
              base: 'rgba(255, 255, 255, 0.3)',
              level: '#2a8cff',
            }
          };
          ui.configure(uiConfig);
        }

        player.addEventListener("error", (event: any) => {
          if (isCancelled) return;
          const error = event.detail;
          if (error.code === shaka.util.Error.Code.LOAD_INTERRUPTED) return;
          console.error("Shaka Error:", error);
          setPlaybackError(`再生エラー: ${error.code} (${error.message || '不明なエラー'})`);
        });

        onTimeUpdate = () => {
          if (!isCancelled && onPositionChangeRef.current) {
            onPositionChangeRef.current(videoElement.currentTime);
          }
          if (canUseMediaSession && Number.isFinite(videoElement.duration) && videoElement.duration > 0) {
            navigator.mediaSession.setPositionState({
              duration: videoElement.duration,
              playbackRate: videoElement.playbackRate,
              position: videoElement.currentTime,
            });
          }
        };

        onVideoEnded = () => {
          if (!isCancelled && onEndedRef.current) onEndedRef.current();
          if (!isCancelled) vibrate(40);
        };

        onPlay = () => {
          if (canUseMediaSession) navigator.mediaSession.playbackState = "playing";
        };

        onPause = () => {
          if (canUseMediaSession) navigator.mediaSession.playbackState = "paused";
        };

        onVolumeChange = () => {
          if (!isCancelled) {
            setVolume(videoElement.volume);
            setMuted(videoElement.muted);
          }
        };
        videoElement.addEventListener("timeupdate", onTimeUpdate);
        videoElement.addEventListener("ended", onVideoEnded);
        videoElement.addEventListener("play", onPlay);
        videoElement.addEventListener("pause", onPause);
        videoElement.addEventListener("volumechange", onVolumeChange);

        if (manifestUrl) {
          // If manifestUrl is HLS and we are on iOS, Shaka will automatically use native HLS if configured or support it via polyfill.
          // For iOS, we can also try to enable native HLS playback in Shaka configuration.
          player.configure({
            streaming: {
              useNativeHlsOnSafari: true,
            }
          });

          await player.load(manifestUrl, initialPositionSeconds);
          if (isCancelled) return;
          
          if (autoplay) {
            videoElement.play().catch((err) => {
              console.log("Autoplay blocked or failed:", err);
            });
          }
        } else {
          if (!isCancelled) setPlaybackError("再生可能なストリームが見つかりません。");
        }
      } catch (e: any) {
        if (isCancelled || e.code === shaka.util.Error.Code.LOAD_INTERRUPTED) return;
        console.error("Shaka Init/Load Error:", e);
        if (enableHlsFallback()) {
          setPlaybackError("DASH 再生に失敗したため HLS に切り替えました。");
          return;
        }
        setPlaybackError(`読み込み失敗: ${e.code || "unknown"}`);
        if (stream?.url) {
          videoElement.src = stream.url;
        }
      }
    };

    initPlayer();

    return () => {
      isCancelled = true;
      videoElement.pause();
      videoElement.removeAttribute("src");
      videoElement.load();
      if (onTimeUpdate) videoElement.removeEventListener("timeupdate", onTimeUpdate);
      if (onVideoEnded) videoElement.removeEventListener("ended", onVideoEnded);
      if (onPlay) videoElement.removeEventListener("play", onPlay);
      if (onPause) videoElement.removeEventListener("pause", onPause);
      if (onVolumeChange) videoElement.removeEventListener("volumechange", onVolumeChange);
      if (ui) ui.destroy();
      if (player) player.destroy();
      if (hlsPlayer) hlsPlayer.destroy();
      if (canUseMediaSession) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
        try {
          navigator.mediaSession.setActionHandler("enterpictureinpicture" as MediaSessionAction, null);
        } catch {
          // unsupported action name
        }
      }
      window.removeEventListener("inverview:toggle-pip", onTogglePip as EventListener);
      window.removeEventListener("inverview:toggle-fullscreen", onToggleFullscreen as EventListener);
      if (screenfull.isEnabled) {
        screenfull.off("change", onFullscreenChange);
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [video.videoId, video.title, video.author, manifestUrl, autoplay, loopVideo, poster]);

  const PlayerWrapper = isShorts ? "div" : Card;

  return (
    <PlayerWrapper 
      {...(isShorts ? {} : { appearance: "outline" })} 
      className={isShorts ? "" : styles.container}
      style={isShorts ? { width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "transparent" } : {}}
    >
      {audioOnly ? (
        <div className={styles.audioOnlyWrap}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: "8px" }}>
            音声のみモード
          </Text>
          <div className={styles.surfaceWrap} style={{ aspectRatio: isShorts ? "9 / 16" : "16 / 9" }}>
            <div ref={containerRef} className={styles.videoContainer} />
          </div>
        </div>
      ) : (
        <div 
          className={styles.surfaceWrap} 
          style={{ 
            aspectRatio: isShorts ? "9 / 16" : "16 / 9",
            margin: isShorts ? "0 auto" : "0",
            width: isShorts ? "auto" : "100%",
            height: isShorts ? "100%" : "auto",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        >
          <div ref={containerRef} className={styles.videoContainer} />
        </div>
      )}

      {playbackError && (
        <div className={styles.contentArea}>
          <Text className={styles.errorText}>
            {playbackError}
          </Text>

          <div className={styles.embedWrap}>
            <iframe
              title={video.title}
              src={embedUrl}
              allow="autoplay; encrypted-media; picture-in-picture"
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </div>

          <div className={styles.linkRow}>
            {screenfull.isEnabled && (
              <Button
                appearance="outline"
                size="small"
                onClick={() => {
                  if (!containerRef.current || !screenfull.isEnabled) return;
                  void screenfull.toggle(containerRef.current);
                }}
              >
                {isFullscreen ? t("player.exitFullscreen") : t("player.enterFullscreen")}
              </Button>
            )}
            {hlsUrl && (
              <Link href={hlsUrl} target="_blank">
                HLS 直リンク
              </Link>
            )}
            {stream?.url && (
              <Link href={stream.url} target="_blank">
                代替ストリーム
              </Link>
            )}
            {dashUrl && (
              <Link href={dashUrl} target="_blank">
                DASH 直リンク
              </Link>
            )}
          </div>
        </div>
      )}
    </PlayerWrapper>
  );
};
