import { makeStyles, tokens, mergeClasses } from "@fluentui/react-components";
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MiniPlayer } from "./MiniPlayer";
import { MobileBottomNav } from "./mobile/MobileBottomNav";
import { MobileHeader } from "./mobile/MobileHeader";
import { MobileSearchOverlay } from "./mobile/MobileSearchOverlay";
import { useMiniPlayer, useSettings } from "../hooks/useSettings";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    paddingTop: "var(--window-top-inset)",
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: "hidden",
  },
  headerArea: {
    flexShrink: 0,
    zIndex: 110,
  },
  body: {
    display: "flex",
    flexGrow: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  sidebarWrap: {
    flexShrink: 0,
    width: "var(--sidebar-width-expanded)",
    transition: "var(--sidebar-transition)",
    height: "100%",
    zIndex: 100,
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
    borderRight: "none",
    "@media (max-width: 767px)": {
      display: "none",
    },
  },
  sidebarWrapCollapsed: {
    width: "var(--sidebar-width-collapsed)",
  },
  mainContent: {
    flexGrow: 1,
    minWidth: 0,
    overflowY: "auto",
    padding: "24px",
    transition: "var(--sidebar-transition)",
    paddingBottom: "24px",
    "@media (max-width: 767px)": {
      padding: "16px",
      paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
    },
  },
  mainContentInner: {
    minHeight: "100%",
  },
  mobileWatchEnterMotion: {
    "@media (max-width: 767px)": {
      animationName: {
        from: {
          opacity: 0.96,
          transform: "translate3d(0, 10px, 0) scale(0.995)",
        },
        to: {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1)",
        },
      },
      animationDuration: "280ms",
      animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      animationFillMode: "both",
      willChange: "transform, opacity",
    },
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none",
    },
  },
});

export const AppShell = (): JSX.Element => {
  const styles = useStyles();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileWatchEntering, setMobileWatchEntering] = useState(false);
  const location = useLocation();
  const { settings, setSetting } = useSettings();
  const { miniPlayer, setMiniPlayer } = useMiniPlayer();
  const wasWatchRouteRef = useRef(location.pathname.startsWith("/watch/"));

  useEffect(() => {
    const isWatchRoute = location.pathname.startsWith("/watch/");
    const enteredWatchRoute = isWatchRoute && !wasWatchRouteRef.current;

    if (enteredWatchRoute && !settings.sidebarCollapsed) {
      setSetting("sidebarCollapsed", true);
    }

    const isMobileViewport = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (enteredWatchRoute && isMobileViewport) {
      setMobileWatchEntering(true);
      const timerId = window.setTimeout(() => setMobileWatchEntering(false), 240);
      wasWatchRouteRef.current = isWatchRoute;
      return () => window.clearTimeout(timerId);
    }

    setMobileWatchEntering(false);
    wasWatchRouteRef.current = isWatchRoute;
  }, [location.pathname, settings.sidebarCollapsed, setSetting]);

  return (
    <div className={styles.root}>
      {/* ヘッダーエリア (全幅) */}
      <div className={styles.headerArea}>
        <Header />
        <MobileHeader
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          showHomeTitle={location.pathname === "/"}
        />
      </div>

      <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ボディエリア (サイドバー + メイン) */}
      <div className={styles.body}>
        {settings.showDesktopSidebar && (
          <div className={mergeClasses(styles.sidebarWrap, settings.sidebarCollapsed && styles.sidebarWrapCollapsed)}>
            <Sidebar />
          </div>
        )}

        {/* モバイルメニュー (Drawer) */}
        <Sidebar mobile isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main
          id="app-scroll-container"
          className={mergeClasses(styles.mainContent, mobileWatchEntering && styles.mobileWatchEnterMotion)}
        >
          <div id="app-scroll-content" className={styles.mainContentInner}>
            <Outlet />
          </div>
        </main>
      </div>

      {settings.miniPlayer && miniPlayer?.visible && !location.pathname.startsWith("/watch/") && (
        <MiniPlayer
          videoId={miniPlayer.videoId}
          title={miniPlayer.title}
          thumbnailUrl={miniPlayer.thumbnailUrl}
          baseUrl={settings.instanceUrl}
          onClose={() => setMiniPlayer(null)}
        />
      )}

      <MobileBottomNav onOpenSearch={() => setIsSearchOpen(true)} />
    </div>
  );
};

