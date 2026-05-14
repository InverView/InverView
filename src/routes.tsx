import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Spinner } from "@fluentui/react-components";
import { useSettings } from "./hooks/useSettings";
import { resolveLaunchPath } from "./lib/launchIntent";
import { ErrorBoundary } from "./components/ErrorBoundary";

const AuthPlaylistsPage = lazy(() => import("./pages/AuthPlaylistsPage").then((module) => ({ default: module.AuthPlaylistsPage })));
const ChannelPage = lazy(() => import("./pages/ChannelPage").then((module) => ({ default: module.ChannelPage })));
const ChannelVideosPage = lazy(() => import("./pages/ChannelVideosPage").then((module) => ({ default: module.ChannelVideosPage })));
const FeedPage = lazy(() => import("./pages/FeedPage").then((module) => ({ default: module.FeedPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then((module) => ({ default: module.HistoryPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage").then((module) => ({ default: module.PlaylistPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const ShortsPage = lazy(() => import("./pages/ShortsPage").then((module) => ({ default: module.ShortsPage })));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage").then((module) => ({ default: module.SubscriptionsPage })));
const WatchPage = lazy(() => import("./pages/WatchPage").then((module) => ({ default: module.WatchPage })));

const ScrollToTop = (): null => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
};

const LandingRedirect = (): JSX.Element => {
  const { settings } = useSettings();

  if (settings.startPage === "trending") return <Navigate to="/?homeTab=trending" replace />;
  if (settings.startPage === "popular") return <Navigate to="/?homeTab=popular" replace />;
  if (settings.startPage === "subscriptions") return <Navigate to="/subscriptions" replace />;
  if (settings.startPage === "search") return <Navigate to="/search" replace />;
  return <Navigate to="/?homeTab=trending" replace />;
};

const LaunchIntentRedirect = (): JSX.Element => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const to = resolveLaunchPath({
    url: params.get("url"),
    text: params.get("text"),
    title: params.get("title"),
  });
  return <Navigate to={to} replace />;
};

const RouteFallback = (): JSX.Element => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Spinner
        tabIndex={0}
        size="large"
        delay={120}
        label={reducedMotion ? "ページを読み込んでいます" : "読み込み中"}
        labelPosition="below"
      />
    </div>
  );
};

export const AppRoutes = (): JSX.Element => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: typeof location } | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <ScrollToTop />
      <ErrorBoundary
        title="ページの読み込みに失敗しました"
        message="ページファイルの読み込み中に問題が発生しました。再試行してください。"
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes location={backgroundLocation || location}>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/landing" element={<LandingRedirect />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/share-target" element={<LaunchIntentRedirect />} />
              <Route path="/open" element={<LaunchIntentRedirect />} />
              <Route path="/watch/:videoId" element={<WatchPage />} />
              <Route path="/shorts/:videoId?" element={<ShortsPage />} />
              <Route path="/channel/:authorId" element={<ChannelPage />} />
              <Route path="/channel/:authorId/videos" element={<ChannelVideosPage mode="videos" />} />
              <Route path="/channel/:authorId/shorts" element={<ChannelVideosPage mode="shorts" />} />
              <Route path="/channel/:authorId/streams" element={<ChannelVideosPage mode="streams" />} />
              <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/playlists" element={<AuthPlaylistsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>

          {backgroundLocation ? (
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
