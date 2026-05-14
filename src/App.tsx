import { useEffect, useMemo } from "react";
import { FluentProvider } from "@fluentui/react-components";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppRoutes } from "./routes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppToaster } from "./components/AppToaster";
import { useSettings } from "./hooks/useSettings";
import { customV9LightTheme, customV9DarkTheme } from "./v9Theme";

const ThemeSync = (): JSX.Element => {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  const isSystemDark = useMemo(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, []);

  const isActuallyDark = useMemo(() => {
    return (
      settings.theme === "dark" ||
      settings.theme === "amoled" ||
      (settings.theme === "system" && isSystemDark)
    );
  }, [settings.theme, isSystemDark]);

  const v9Theme = useMemo(() => {
    return isActuallyDark ? customV9DarkTheme : customV9LightTheme;
  }, [isActuallyDark]);

  useEffect(() => {
    void i18n.changeLanguage(settings.language?.startsWith("ja") ? "ja" : "en");
  }, [settings.language, i18n]);

  useEffect(() => {
    const root = document.documentElement;
    const radiusMap: Record<string, string> = {
      none: "0px",
      small: "8px",
      medium: "12px",
      large: "18px",
      xlarge: "24px",
    };

    const densityMap: Record<string, string> = {
      compact: "0.9",
      normal: "1",
      comfortable: "1.1",
    };

    root.style.setProperty("--app-radius", radiusMap[settings.cornerRadius] || "18px");
    root.style.setProperty("--thumbnail-radius", `${settings.thumbnailRadius}px`);
    root.style.setProperty("--player-radius", `${settings.playerRadius}px`);
    root.style.setProperty("--app-card-opacity", String(settings.cardOpacity));
    root.style.setProperty("--app-shadow-strength", String(settings.shadowStrength));
    root.style.setProperty("--bottom-nav-opacity", String(settings.bottomNavOpacity));
    root.style.setProperty("--ui-density", densityMap[settings.uiDensity] || "1");
    root.style.setProperty("--content-max-width", `${settings.maxContentWidth}px`);

    const accentMap: Record<string, string> = {
      blue: "#2A8CFF",
      red: "#EF4444",
      purple: "#8B5CF6",
      green: "#16A34A",
      orange: "#EA580C",
      pink: "#EC4899",
      custom: settings.customAccentColor || "#2A8CFF",
    };

    root.style.setProperty("--app-accent", accentMap[settings.accentColor] || "#2A8CFF");

    if (isActuallyDark) {
      root.style.backgroundColor = settings.theme === "amoled" ? "#000000" : "#0f0f10";
      root.style.color = "#ffffff";
    } else {
      root.style.backgroundColor = "#F7F7F8";
      root.style.color = "#1B1E26";
    }
  }, [settings, isSystemDark, isActuallyDark]);

  useEffect(() => {
    if (!settings.useLenis) return;

    let destroyed = false;
    let rafId = 0;
    let lenisInstance: { raf: (time: number) => void; destroy: () => void } | null = null;

    const boot = async (): Promise<void> => {
      const wrapper = document.getElementById("app-scroll-container");
      const content = document.getElementById("app-scroll-content");
      if (!(wrapper instanceof HTMLElement) || !(content instanceof HTMLElement)) return;

      const { default: Lenis } = await import("lenis");
      if (destroyed) return;

      const lenis = new Lenis({
        wrapper,
        content,
        duration: settings.animationStrength === "reduced" ? 0.75 : 1.1,
        smoothWheel: true,
        wheelMultiplier: settings.animationStrength === "reduced" ? 0.8 : 1,
        touchMultiplier: 1,
      });

      lenisInstance = lenis;

      const onFrame = (time: number): void => {
        lenis.raf(time);
        rafId = window.requestAnimationFrame(onFrame);
      };

      rafId = window.requestAnimationFrame(onFrame);
    };

    void boot();

    return () => {
      destroyed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      lenisInstance?.destroy();
    };
  }, [settings.useLenis, settings.animationStrength]);

  return (
    <FluentProvider theme={v9Theme}>
      <AppRoutes />
      <AppToaster />
    </FluentProvider>
  );
};

const App = (): JSX.Element => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        title="アプリの描画でエラーが発生しました"
        message="通信や一時的な状態不整合の可能性があります。再試行してください。"
        onRetry={reset}
      >
        <ThemeSync />
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

export default App;

