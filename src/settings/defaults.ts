import type { AppSettings } from "./types";

export const SETTINGS_STORAGE_KEY = "invidious-client-settings";
export const WATCH_HISTORY_STORAGE_KEY = "invidious-client-watch-history";
export const SEARCH_HISTORY_STORAGE_KEY = "invidious-client-search-history";

export const defaultSettings: AppSettings = {
  instanceUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_INVIDIOUS_API_BASE_URL || "https://invidious.tsub4sa.xyz",
  region: import.meta.env.VITE_DEFAULT_REGION || "JP",
  language: import.meta.env.VITE_DEFAULT_LANGUAGE || "ja",
  token: "",
  startPage: "home",
  theme: "system",
  amoledEnabled: false,
  cornerRadius: "large",

  saveWatchHistory: true,
  showSearchSuggestions: true,

  autoplay: false,
  quality: "auto",
  audioOnly: false,
  dataSaver: false,
  loopVideo: false,
  useProxyVideo: true,
  rememberPlaybackPosition: true,
  miniPlayer: false,
  theaterMode: false,
  autoplayNextVideo: false,
  showCaptionsByDefault: false,
  preferOriginalTranslation: true,

  expandDescriptionByDefault: false,
  expandChaptersByDefault: false,
  expandCommentsByDefault: true,

  accentColor: "blue",
  customAccentColor: "#2A8CFF",
  cardOpacity: 0.92,
  shadowStrength: 0.5,
  uiDensity: "normal",
  thumbnailRadius: 14,
  playerRadius: 14,
  bottomNavOpacity: 0.72,
  sidebarCollapsed: false,
  showDesktopSidebar: true,
  maxContentWidth: 1280,
  animationStrength: "normal",
  useLenis: false,

  companionMode: "default",
  companionUrl: import.meta.env.VITE_COMPANION_URL || "https://companion.tsub4sa.xyz",
  companionSecret: import.meta.env.VITE_COMPANION_SECRET || "",
  volume: 1,
  muted: false,
  favoriteShortsChannelIds: [],
};


