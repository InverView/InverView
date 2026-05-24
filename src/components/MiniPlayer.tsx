import {
  makeStyles,
  tokens,
  Button,
  Card,
  Text,
} from "@fluentui/react-components";
import { Dismiss16Regular } from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "./VideoPlayer";
import type { MiniPlayerState } from "../settings/types";

interface MiniPlayerProps {
  state: MiniPlayerState;
  onPositionChange: (seconds: number) => void;
  onMove: (x: number, y: number) => void;
  onExpand: () => void;
  onClose: () => void;
}

const useStyles = makeStyles({
  container: {
    position: "fixed",
    zIndex: 45,
    width: "220px",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground3,
    "@media (min-width: 600px)": {
      width: "260px",
    },
    "@media (min-width: 1024px)": {
      right: "24px",
      bottom: "24px",
    },
    "@media (max-width: 767px)": {
      width: "100vw",
      maxWidth: "none",
      left: "0",
      right: "0",
      top: "auto",
      bottom: "calc(64px + env(safe-area-inset-bottom))",
      padding: "6px",
      borderRadius: "0",
      backgroundColor: "#111111",
      color: "#ffffff",
    },
  },
  mobileRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  mobileVideo: {
    width: "96px",
    flexShrink: 0,
    borderRadius: "8px",
    overflow: "hidden",
  },
  mobileMeta: {
    minWidth: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  mobileTitle: {
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  mobileSubtitle: {
    color: "rgba(255,255,255,0.78)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "grab",
  },
});

export const MiniPlayer = ({ state, onPositionChange, onMove, onExpand, onClose }: MiniPlayerProps): JSX.Element => {
  const styles = useStyles();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent): void => setIsMobileViewport(event.matches);
    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  const clampPosition = (x: number, y: number): { x: number; y: number } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = cardRef.current?.offsetWidth ?? 260;
    const cardHeight = cardRef.current?.offsetHeight ?? 220;
    const nextX = Math.max(8, Math.min(x, viewportWidth - cardWidth - 8));
    const nextY = Math.max(8, Math.min(y, viewportHeight - cardHeight - 8));
    return { x: nextX, y: nextY };
  };

  if (isMobileViewport) {
    return (
      <Card
        ref={cardRef}
        appearance="outline"
        className={styles.container}
        style={{ left: "0", top: "auto" }}
      >
        <div className={styles.mobileRow}>
          <div
            className={styles.mobileVideo}
            onPointerUp={onExpand}
            style={{ cursor: "pointer" }}
          >
            <VideoPlayer
              video={state.video}
              baseUrl={state.baseUrl}
              initialPositionSeconds={state.positionSeconds}
              onPositionChange={onPositionChange}
              autoplay={true}
              miniMode={true}
            />
          </div>
          <div className={styles.mobileMeta} onPointerUp={onExpand} style={{ cursor: "pointer" }}>
            <Text size={200} weight="semibold" className={styles.mobileTitle}>{state.video.title}</Text>
            <Text size={100} className={styles.mobileSubtitle}>{state.video.author}</Text>
          </div>
          <Button
            size="small"
            appearance="subtle"
            icon={<Dismiss16Regular />}
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            aria-label="close mini player"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={cardRef}
      appearance="outline"
      className={styles.container}
      style={{ left: `${state.x}px`, top: `${state.y}px` }}
    >
      <div
        className={styles.header}
        onPointerDown={(event) => {
          const rect = cardRef.current?.getBoundingClientRect();
          if (!rect) return;
          dragRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const dragState = dragRef.current;
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          const { x, y } = clampPosition(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
          onMove(x, y);
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId !== event.pointerId) return;
          dragRef.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (dragRef.current?.pointerId !== event.pointerId) return;
          dragRef.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        <div />
        <Button
          size="small"
          appearance="subtle"
          icon={<Dismiss16Regular />}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="close mini player"
        />
      </div>
      <div onPointerUp={onExpand} style={{ cursor: "pointer" }}>
        <VideoPlayer
          video={state.video}
          baseUrl={state.baseUrl}
          initialPositionSeconds={state.positionSeconds}
          onPositionChange={onPositionChange}
          autoplay={true}
          miniMode={true}
        />
      </div>
    </Card>
  );
};

