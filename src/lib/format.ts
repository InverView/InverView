import { getSettingsSnapshot } from "../settings/storage";
import i18n from "../i18n";

const isJapanese = (): boolean => getSettingsSnapshot().language?.startsWith("ja") ?? true;

const getNumberLocale = (): string => (isJapanese() ? "ja-JP" : "en-US");

export const formatDuration = (seconds?: number): string => {
  if (!seconds || Number.isNaN(seconds)) return "--:--";

  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const formatViewCountJa = (viewCount?: number, fallbackText?: string): string => {
  if (fallbackText) return fallbackText;
  if (typeof viewCount !== "number") return i18n.t("format.unknownViews");
  return i18n.t("format.viewsCount", { count: new Intl.NumberFormat(getNumberLocale()).format(viewCount) });
};

export const formatNumberJa = (value?: number): string => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat(getNumberLocale()).format(value);
};

export const formatRelativeDateJa = (unixSeconds?: number, fallbackText?: string): string => {
  if (fallbackText) return fallbackText;
  if (!unixSeconds) return i18n.t("common.unknownDate");

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - unixSeconds);

  if (diff < 60) return i18n.t("common.justNow");
  if (diff < 3600) return i18n.t("common.minutesAgo", { count: Math.floor(diff / 60) });
  if (diff < 86400) return i18n.t("common.hoursAgo", { count: Math.floor(diff / 3600) });
  if (diff < 2592000) return i18n.t("common.daysAgo", { count: Math.floor(diff / 86400) });
  if (diff < 31536000) return i18n.t("common.monthsAgo", { count: Math.floor(diff / 2592000) });
  return i18n.t("common.yearsAgo", { count: Math.floor(diff / 31536000) });
};

export const formatDateJa = (unixSeconds?: number): string => {
  if (!unixSeconds) return i18n.t("common.unknownDate");
  const date = new Date(unixSeconds * 1000);
  return new Intl.DateTimeFormat(getNumberLocale(), { dateStyle: "medium" }).format(date);
};
