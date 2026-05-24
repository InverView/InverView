import { defaultSettings, SEARCH_HISTORY_STORAGE_KEY, SETTINGS_STORAGE_KEY, WATCH_HISTORY_STORAGE_KEY } from "./defaults";
import type { AppSettings, WatchHistoryItem } from "./types";
import { scheduleTask, withWebLock } from "../lib/webPlatform";

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const clampNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

export const mergeSettings = (raw: unknown): AppSettings => {
  if (!isObject(raw)) return defaultSettings;

  const legacyInstance = typeof raw.apiBaseUrl === "string" ? raw.apiBaseUrl : undefined;
  const legacyTheme = raw.theme === "amoled" ? "amoled" : raw.theme;



  const merged: AppSettings = {
    ...defaultSettings,
    ...raw,
    instanceUrl:
      typeof raw.instanceUrl === "string" && raw.instanceUrl.trim()
        ? raw.instanceUrl
        : legacyInstance && legacyInstance.trim()
          ? legacyInstance
          : defaultSettings.instanceUrl,
    apiProxyUrl: typeof raw.apiProxyUrl === "string" ? raw.apiProxyUrl : defaultSettings.apiProxyUrl,
    region: typeof raw.region === "string" && raw.region.trim() ? raw.region : defaultSettings.region,
    language: typeof raw.language === "string" && raw.language.trim() ? raw.language : defaultSettings.language,
    audioTrackLanguage:
      typeof raw.audioTrackLanguage === "string" && raw.audioTrackLanguage.trim()
        ? raw.audioTrackLanguage
        : defaultSettings.audioTrackLanguage,
    token: typeof raw.token === "string" ? raw.token : "",
    youtubeJsProxyUrl:
      typeof raw.youtubeJsProxyUrl === "string" && raw.youtubeJsProxyUrl.trim()
        ? raw.youtubeJsProxyUrl
        : defaultSettings.youtubeJsProxyUrl,
    youtubeAuthMode:
      raw.youtubeAuthMode === "cookie" || raw.youtubeAuthMode === "tv_oauth" || raw.youtubeAuthMode === "none"
        ? raw.youtubeAuthMode
        : defaultSettings.youtubeAuthMode,
    youtubeCookie: typeof raw.youtubeCookie === "string" ? raw.youtubeCookie : defaultSettings.youtubeCookie,
    youtubeTvOauthCredentials:
      typeof raw.youtubeTvOauthCredentials === "string"
        ? raw.youtubeTvOauthCredentials
        : defaultSettings.youtubeTvOauthCredentials,
    livePlaybackEnabled:
      typeof raw.livePlaybackEnabled === "boolean"
        ? raw.livePlaybackEnabled
        : defaultSettings.livePlaybackEnabled,
    hapticFeedback:
      typeof raw.hapticFeedback === "boolean"
        ? raw.hapticFeedback
        : defaultSettings.hapticFeedback,
    theme: (legacyTheme as AppSettings["theme"]) || defaultSettings.theme,
    customAccentColor: typeof raw.customAccentColor === "string" ? raw.customAccentColor : defaultSettings.customAccentColor,
    cardOpacity: clampNumber(raw.cardOpacity, defaultSettings.cardOpacity, 0.2, 1),
    shadowStrength: clampNumber(raw.shadowStrength, defaultSettings.shadowStrength, 0, 1),
    thumbnailRadius: clampNumber(raw.thumbnailRadius, defaultSettings.thumbnailRadius, 0, 40),
    playerRadius: clampNumber(raw.playerRadius, defaultSettings.playerRadius, 0, 40),
    bottomNavOpacity: clampNumber(raw.bottomNavOpacity, defaultSettings.bottomNavOpacity, 0.25, 1),
    maxContentWidth: clampNumber(raw.maxContentWidth, defaultSettings.maxContentWidth, 960, 1920),
    hideShorts: typeof raw.hideShorts === "boolean" ? raw.hideShorts : defaultSettings.hideShorts,
    hideMobileNavLabels: typeof raw.hideMobileNavLabels === "boolean" ? raw.hideMobileNavLabels : defaultSettings.hideMobileNavLabels,
  };

  return merged;
};

export const loadSettingsFromStorage = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    return mergeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
};

export const saveSettingsToStorage = (settings: AppSettings): void => {
  scheduleTask(() => {
    withWebLock("inverview-settings-write", () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    });
  }, "background");
};

let settingsCache: AppSettings | null = null;

export const getSettingsSnapshot = (): AppSettings => {
  if (settingsCache) return settingsCache;
  settingsCache = loadSettingsFromStorage();
  return settingsCache;
};

export const setSettingsSnapshot = (settings: AppSettings): void => {
  settingsCache = settings;
  saveSettingsToStorage(settings);
};

export const loadWatchHistory = (): WatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem(WATCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.videoId === "string");
  } catch {
    return [];
  }
};

export const saveWatchHistory = (history: WatchHistoryItem[]): void => {
  scheduleTask(() => {
    withWebLock("inverview-watch-history-write", () => {
      localStorage.setItem(WATCH_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 300)));
    });
  }, "background");
};

export const loadSearchHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

export const saveSearchHistory = (history: string[]): void => {
  scheduleTask(() => {
    withWebLock("inverview-search-history-write", () => {
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    });
  }, "background");
};
