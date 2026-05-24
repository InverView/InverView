import { useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  Link,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import screenfull from "screenfull";
import { useTranslation } from "react-i18next";
import type { VideoDetails } from "../types/invidious";
import { pickPlayableStream, pickPosterThumbnail, resolveMediaUrl } from "../lib/media";
import { togglePictureInPicture, vibrate } from "../lib/webPlatform";
import { useSettingsStore } from "../store/settingsStore";
import { notifyError } from "../lib/notifications";
import { setNativeNowPlaying, setNativePlaybackState } from "../lib/nativePlayback";
import { isCapacitorRuntime } from "../lib/runtimeEnv";
import {
  clearBackgroundPlaybackNotification,
  showBackgroundPlaybackNotification,
} from "../lib/capacitorSpecial";

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

const TAB_INACTIVE_DISABLE_DELAY_MS = 30_000;

interface VideoPlayerProps {
  video: VideoDetails;
  baseUrl: string;
  initialPositionSeconds?: number;
  externalSeekSeconds?: number | null;
  onPositionChange?: (seconds: number) => void;
  onPlay?: () => void;
  onEnded?: () => void;
  autoplay?: boolean;
  isShorts?: boolean;
  miniMode?: boolean;
}

const useStyles = makeStyles({
  container: {
    padding: "0",
    display: "flex",
    flexDirection: "column",
    gap: "0",
    overflow: "visible",
    borderRadius: "var(--player-radius)",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    "@media (max-width: 767px)": {
      borderTopLeftRadius: "0",
      borderTopRightRadius: "0",
    },
  },
  surfaceWrap: {
    position: "relative",
    width: "100%",
    backgroundColor: "black",
    zIndex: 0,
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
  externalSeekSeconds,
  onPositionChange,
  onPlay,
  onEnded,
  autoplay: autoplayProp,
  isShorts,
  miniMode = false,
}: VideoPlayerProps): JSX.Element => {
  const styles = useStyles();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const onEndedRef = useRef(onEnded);
  const onPlayRef = useRef(onPlay);
  const hiddenTimerRef = useRef<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cinematicGlowColor, setCinematicGlowColor] = useState("rgba(0, 0, 0, 0)");
  const [isTabActiveForGlow, setIsTabActiveForGlow] = useState(true);
  const shouldKeepPlayingInBackgroundRef = useRef(false);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    onPlayRef.current = onPlay;
  }, [onPlay]);
  
  const settingsAutoplay = useSettingsStore((state) => state.autoplay);
  const autoplay = autoplayProp ?? settingsAutoplay;
  const isLiveLike = !!video.liveNow || !!video.isUpcoming;
  const loopVideo = useSettingsStore((state) => state.loopVideo);
  const quality = useSettingsStore((state) => state.quality);
  const audioTrackLanguage = useSettingsStore((state) => state.audioTrackLanguage);
  const audioOnly = useSettingsStore((state) => state.audioOnly);
  const dataSaver = useSettingsStore((state) => state.dataSaver);
  const companionUrl = useSettingsStore((state) => state.companionUrl);
  const hapticFeedback = useSettingsStore((state) => state.hapticFeedback);
  const cinematicLighting = useSettingsStore((state) => state.cinematicLighting);
  const pictureInPictureEnabled = useSettingsStore((state) => state.pictureInPictureEnabled);
  const autoEnterPipOnBackground = useSettingsStore((state) => state.autoEnterPipOnBackground);
  const backgroundPlaybackEnabled = useSettingsStore((state) => state.backgroundPlaybackEnabled);
  const androidMediaNotificationEnabled = useSettingsStore((state) => state.androidMediaNotificationEnabled);
  const theme = useSettingsStore((state) => state.theme);
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
    if (isLiveLike && hlsUrl) return hlsUrl;
    // iOS Safari prefers HLS and often fails with DASH via MSE
    if (isIOS && hlsUrl) return hlsUrl;
    return dashUrl || hlsUrl || stream?.url;
  }, [isLiveLike, isIOS, dashUrl, hlsUrl, stream?.url]);

  const poster = resolveMediaUrl(pickPosterThumbnail(video.videoThumbnails)?.url, baseUrl);
  const embedUrl = baseUrl
    ? `${baseUrl.replace(/\/+$/, "")}/embed/${video.videoId}`
    : `https://www.youtube-nocookie.com/embed/${video.videoId}`;
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = theme === "dark" || (theme === "system" && prefersDark);
  const cinematicLightingEnabled = cinematicLighting && isDarkTheme && isTabActiveForGlow && !audioOnly;

  useEffect(() => {
    if (miniMode) return;
    if (!playbackError) return;
    notifyError(playbackError);
  }, [playbackError, miniMode]);

  useEffect(() => {
    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        if (hiddenTimerRef.current) {
          window.clearTimeout(hiddenTimerRef.current);
          hiddenTimerRef.current = null;
        }
        setIsTabActiveForGlow(true);
        return;
      }

      if (hiddenTimerRef.current) return;
      hiddenTimerRef.current = window.setTimeout(() => {
        setIsTabActiveForGlow(false);
        hiddenTimerRef.current = null;
      }, TAB_INACTIVE_DISABLE_DELAY_MS);
    };

    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (hiddenTimerRef.current) {
        window.clearTimeout(hiddenTimerRef.current);
        hiddenTimerRef.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !cinematicLightingEnabled) {
      setCinematicGlowColor("rgba(0, 0, 0, 0)");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;
    let hasSampledColor = false;
    const fallbackGlow =
      getComputedStyle(document.documentElement).getPropertyValue("--app-accent").trim() || "rgba(42, 140, 255, 0.45)";
    const sampleFrame = (): void => {
      if (cancelled || videoElement.paused || videoElement.ended || videoElement.readyState < 2) return;
      try {
        const sampleSize = 24;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(videoElement, 0, 0, sampleSize, sampleSize);
        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        if (count > 0) {
          const avgR = Math.round(r / count);
          const avgG = Math.round(g / count);
          const avgB = Math.round(b / count);
          setCinematicGlowColor(`rgba(${avgR}, ${avgG}, ${avgB}, 0.45)`);
          hasSampledColor = true;
        }
      } catch {
        if (!hasSampledColor) {
          setCinematicGlowColor(fallbackGlow);
        }
      }
    };

    setCinematicGlowColor(fallbackGlow);
    sampleFrame();
    const intervalId = window.setInterval(sampleFrame, 500);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [video.videoId, cinematicLightingEnabled]);

  useEffect(() => {
    if (!isCapacitorRuntime()) return;

    const onVisibilityChange = () => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      if (document.visibilityState === "hidden") {
        shouldKeepPlayingInBackgroundRef.current = backgroundPlaybackEnabled && !videoElement.paused && !videoElement.ended;
        if (!shouldKeepPlayingInBackgroundRef.current) return;
        void showBackgroundPlaybackNotification(video.title, video.author || "InverView");

        window.setTimeout(() => {
          const latestVideo = videoRef.current;
          if (!latestVideo || document.visibilityState !== "hidden") return;
          if (!backgroundPlaybackEnabled) return;
          if (!latestVideo.paused || latestVideo.ended) return;
          void latestVideo.play().catch(() => {
            // Some devices/webviews still block background resume.
          });
        }, 180);
        return;
      }

      shouldKeepPlayingInBackgroundRef.current = false;
      void clearBackgroundPlaybackNotification();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void clearBackgroundPlaybackNotification();
    };
  }, [backgroundPlaybackEnabled, video.title, video.author]);

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
    videoElement.loop = loopVideo && !isLiveLike;
    videoElement.playsInline = true;
    videoElement.volume = volume;
    videoElement.muted = muted;
    videoRef.current = videoElement;
    containerRef.current.appendChild(videoElement);

    const onTogglePip = () => {
      if (!pictureInPictureEnabled) return;
      void togglePictureInPicture(videoElement);
    };
    const onToggleFullscreen = () => {
      if (!containerRef.current || !screenfull.isEnabled) return;
      void screenfull.toggle(containerRef.current);
    };
    const onNativeMediaControl = (event: Event) => {
      const customEvent = event as CustomEvent<{ command?: string } | string>;
      const detail = customEvent.detail;
      let command: string | undefined;
      if (typeof detail === "string") {
        try {
          const parsed = JSON.parse(detail) as { command?: string };
          command = parsed.command;
        } catch {
          command = undefined;
        }
      } else {
        command = detail?.command;
      }
      if (command === "play") {
        void videoElement.play().catch(() => {
          // no-op
        });
        return;
      }
      if (command === "pause") {
        videoElement.pause();
      }
    };
    window.addEventListener("inverview:toggle-pip", onTogglePip as EventListener);
    window.addEventListener("inverview:toggle-fullscreen", onToggleFullscreen as EventListener);
    window.addEventListener("inverview:native-media-control", onNativeMediaControl as EventListener);

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
      if (!isLiveLike) {
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
      } else {
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      }
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
          const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--app-accent")
            .trim() || "#2a8cff";
          
          const uiConfig = {
            seekBarColors: {
              base: 'rgba(255, 255, 255, 0.3)',
              buffered: 'rgba(255, 255, 255, 0.5)',
              played: accentColor,
            },
            volumeBarColors: {
              base: 'rgba(255, 255, 255, 0.3)',
              level: accentColor,
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
          if (videoElement) {
            (window as any).lastPlaybackPosition = videoElement.currentTime;
            (window as any).lastPlaybackVideoId = video.videoId;
          }
          if (!isCancelled && onPositionChangeRef.current) {
            onPositionChangeRef.current(videoElement.currentTime);
          }
          if (!isLiveLike && canUseMediaSession && Number.isFinite(videoElement.duration) && videoElement.duration > 0) {
            navigator.mediaSession.setPositionState({
              duration: videoElement.duration,
              playbackRate: videoElement.playbackRate,
              position: videoElement.currentTime,
            });
          }
        };

        onVideoEnded = () => {
          if (!isCancelled && onEndedRef.current) onEndedRef.current();
          if (!isCancelled && hapticFeedback) vibrate(40);
        };

        onPlay = () => {
          if (!isCancelled && onPlayRef.current) onPlayRef.current();
          if (canUseMediaSession) navigator.mediaSession.playbackState = "playing";
          void setNativePlaybackState(true, pictureInPictureEnabled && autoEnterPipOnBackground, backgroundPlaybackEnabled);
          if (!miniMode) {
            window.dispatchEvent(new CustomEvent("inverview:main-player-playing"));
          }
        };

        onPause = () => {
          if (canUseMediaSession) navigator.mediaSession.playbackState = "paused";
          void setNativePlaybackState(false, pictureInPictureEnabled && autoEnterPipOnBackground, backgroundPlaybackEnabled);
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

        if (androidMediaNotificationEnabled) {
          void setNativeNowPlaying({
            enabled: true,
            title: video.title,
            artist: video.author,
            artworkUrl: poster,
            playbackUrl: manifestUrl || stream?.url,
            durationSeconds: Number.isFinite(videoElement.duration) ? videoElement.duration : undefined,
            positionSeconds: videoElement.currentTime,
            playing: !videoElement.paused,
          });
        } else {
          void setNativeNowPlaying({ enabled: false });
        }

        if (manifestUrl) {
          let startPosition = initialPositionSeconds;
          if ((window as any).lastPlaybackVideoId === video.videoId && typeof (window as any).lastPlaybackPosition === "number") {
            startPosition = (window as any).lastPlaybackPosition;
          }
          await player.load(manifestUrl, startPosition);
          if (isCancelled) return;

          if (audioTrackLanguage && audioTrackLanguage !== "auto") {
            try {
              (player as any).selectAudioLanguage?.(audioTrackLanguage);
            } catch {
              // Ignore if the requested language does not exist for this stream.
            }
          }
          
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
      void setNativePlaybackState(false, false, backgroundPlaybackEnabled);
      void setNativeNowPlaying({ enabled: false });
      window.removeEventListener("inverview:toggle-pip", onTogglePip as EventListener);
      window.removeEventListener("inverview:toggle-fullscreen", onToggleFullscreen as EventListener);
      window.removeEventListener("inverview:native-media-control", onNativeMediaControl as EventListener);
      if (screenfull.isEnabled) {
        screenfull.off("change", onFullscreenChange);
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
      videoRef.current = null;
    };
  }, [
    video.videoId,
    video.title,
    video.author,
    manifestUrl,
    autoplay,
    loopVideo,
    poster,
    isLiveLike,
    hapticFeedback,
    audioTrackLanguage,
    pictureInPictureEnabled,
    autoEnterPipOnBackground,
    backgroundPlaybackEnabled,
    androidMediaNotificationEnabled,
  ]);

  useEffect(() => {
    if (typeof externalSeekSeconds !== "number") return;
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const maxDuration = Number.isFinite(videoElement.duration) ? videoElement.duration : Number.MAX_SAFE_INTEGER;
    videoElement.currentTime = Math.max(0, Math.min(externalSeekSeconds, maxDuration));
  }, [externalSeekSeconds]);

  if (miniMode) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "black",
          overflow: "hidden",
          borderRadius: "8px",
        }}
      >
        <div ref={containerRef} className={styles.videoContainer} />
      </div>
    );
  }

  return (
    <div
      className={isShorts ? "" : styles.container}
      style={isShorts ? { width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "transparent" } : {}}
    >
      {audioOnly && !miniMode ? (
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
            boxShadow: cinematicLightingEnabled
              ? `0 0 40px 12px ${cinematicGlowColor}, 0 0 90px 24px ${cinematicGlowColor}`
              : "none",
            transition: "box-shadow 220ms ease",
          }}
        >
          <div ref={containerRef} className={styles.videoContainer} />
        </div>
      )}

      {!miniMode && playbackError && (
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
    </div>
  );
};
