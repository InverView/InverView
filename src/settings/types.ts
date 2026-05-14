export type StartPage = "home" | "trending" | "popular" | "subscriptions" | "search";
export type ThemeMode = "system" | "light" | "dark" | "amoled";
export type CornerRadius = "none" | "small" | "medium" | "large" | "xlarge";
export type AccentColor = "blue" | "red" | "purple" | "green" | "orange" | "pink" | "custom";
export type UiDensity = "compact" | "normal" | "comfortable";
export type AnimationStrength = "off" | "reduced" | "normal";
export type QualityMode = "auto" | "1080p" | "720p" | "480p" | "360p";

export type CompanionMode = "default" | "custom";

export interface AppSettings {
  instanceUrl: string;
  region: string;
  language: string;
  token: string;
  startPage: StartPage;
  theme: ThemeMode;
  amoledEnabled: boolean;
  cornerRadius: CornerRadius;

  saveWatchHistory: boolean;
  showSearchSuggestions: boolean;

  autoplay: boolean;
  quality: QualityMode;
  audioOnly: boolean;
  dataSaver: boolean;
  loopVideo: boolean;
  useProxyVideo: boolean;
  rememberPlaybackPosition: boolean;
  miniPlayer: boolean;
  theaterMode: boolean;
  autoplayNextVideo: boolean;
  showCaptionsByDefault: boolean;
  preferOriginalTranslation: boolean;

  expandDescriptionByDefault: boolean;
  expandChaptersByDefault: boolean;
  expandCommentsByDefault: boolean;

  accentColor: AccentColor;
  customAccentColor: string;
  cardOpacity: number;
  shadowStrength: number;
  uiDensity: UiDensity;
  thumbnailRadius: number;
  playerRadius: number;
  bottomNavOpacity: number;
  // Sidebar
  sidebarCollapsed: boolean;
  showDesktopSidebar: boolean;
  maxContentWidth: number;
  animationStrength: AnimationStrength;
  useLenis: boolean;

  // Invidious Companion
  companionMode: CompanionMode;
  companionUrl: string;
  companionSecret: string;

  // Volume
  volume: number;
  muted: boolean;

  // Shorts
  favoriteShortsChannelIds: string[];
}


export interface WatchHistoryItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  watchedAt: number;
  positionSeconds: number;
  durationSeconds?: number;
}

export interface MiniPlayerState {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  visible: boolean;
}

export interface SettingsContextValue {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => { ok: boolean; error?: string };
}

export interface MiniPlayerContextValue {
  miniPlayer: MiniPlayerState | null;
  setMiniPlayer: (state: MiniPlayerState | null) => void;
}
