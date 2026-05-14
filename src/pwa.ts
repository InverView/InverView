import { registerSW } from "virtual:pwa-register";
import { resolveLaunchPath } from "./lib/launchIntent";

interface WindowControlsOverlayLike extends EventTarget {
  visible: boolean;
  getTitlebarAreaRect?: () => DOMRect;
}
let advancedWebApisInitialized = false;

export const registerPwaServiceWorker = (): void => {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      console.info("[PWA] Service Worker registered:", swUrl);
    },
    onRegisterError(error) {
      console.error("[PWA] Service Worker registration failed:", error);
    },
  });
};

const setupWindowControlsOverlay = (): void => {
  const navigatorWithOverlay = navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlayLike };
  const overlay = navigatorWithOverlay.windowControlsOverlay;
  const root = document.documentElement;
  const isSupported = !!overlay;

  root.dataset.windowControlsOverlaySupport = isSupported ? "supported" : "unsupported";
  if (!overlay) return;

  const applyGeometry = () => {
    const rect = overlay.getTitlebarAreaRect?.();
    const isOverlayDisplayMode = window.matchMedia("(display-mode: window-controls-overlay)").matches;
    const visible = !!overlay.visible && isOverlayDisplayMode;

    root.dataset.windowControlsOverlay = visible ? "visible" : "hidden";
    root.style.setProperty("--titlebar-area-x", `${rect?.x ?? 0}px`);
    root.style.setProperty("--titlebar-area-y", `${rect?.y ?? 0}px`);
    root.style.setProperty("--titlebar-area-width", `${rect?.width ?? 0}px`);
    root.style.setProperty("--titlebar-area-height", `${visible ? rect?.height ?? 0 : 0}px`);
  };

  applyGeometry();
  overlay.addEventListener("geometrychange", applyGeometry);
  window.addEventListener("resize", applyGeometry, { passive: true });
  document.addEventListener("visibilitychange", applyGeometry, { passive: true });
};

const setupLaunchQueue = (): void => {
  const launchQueue = (window as any).launchQueue;
  if (!launchQueue || typeof launchQueue.setConsumer !== "function") return;

  launchQueue.setConsumer((launchParams: any) => {
    const rawTargetUrl = typeof launchParams?.targetURL === "string" ? launchParams.targetURL : "";
    if (!rawTargetUrl) return;

    let parsed: URL | null = null;
    try {
      parsed = new URL(rawTargetUrl);
    } catch {
      return;
    }

    if (!parsed) return;

    if (parsed.origin === window.location.origin) {
      const next = `${parsed.pathname}${parsed.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next !== current) window.location.assign(next);
      return;
    }

    const nextPath = resolveLaunchPath({ url: parsed.toString() });
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (nextPath !== currentPath) window.location.assign(nextPath);
  });
};

const setupIdleDetection = async (): Promise<void> => {
  const IdleDetectorClass = (window as any).IdleDetector;
  if (!IdleDetectorClass || !navigator.permissions?.query) return;

  try {
    const permission = await navigator.permissions.query({ name: "idle-detection" as PermissionName });
    if (permission.state !== "granted") return;

    const detector = new IdleDetectorClass();
    detector.addEventListener("change", () => {
      const isIdle = detector.userState === "idle" || detector.screenState === "locked";
      document.documentElement.dataset.idleState = isIdle ? "idle" : "active";
      if (isIdle) {
        for (const videoElement of document.querySelectorAll("video")) {
          if (!videoElement.paused) videoElement.pause();
        }
      }
    });

    await detector.start({ threshold: 60_000 });
  } catch {
    // Ignore permission errors and unsupported environments.
  }
};

const setupPageVisibility = (): void => {
  const root = document.documentElement;

  const applyVisibility = () => {
    const hidden = document.hidden;
    root.dataset.pageVisibility = hidden ? "hidden" : "visible";

    if (hidden) {
      window.dispatchEvent(new Event("inverview:page-hidden"));
      return;
    }

    window.dispatchEvent(new Event("inverview:page-visible"));
  };

  applyVisibility();
  document.addEventListener("visibilitychange", applyVisibility, { passive: true });
};

export const setupAdvancedWebApis = (): void => {
  if (advancedWebApisInitialized) return;
  advancedWebApisInitialized = true;
  setupPageVisibility();
  setupWindowControlsOverlay();
  setupLaunchQueue();
  void setupIdleDetection();
};
