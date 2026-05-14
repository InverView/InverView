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
  if (typeof viewCount !== "number") return "視聴回数不明";

  return `${new Intl.NumberFormat("ja-JP").format(viewCount)} 回視聴`;
};

export const formatNumberJa = (value?: number): string => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("ja-JP").format(value);
};

export const formatRelativeDateJa = (unixSeconds?: number, fallbackText?: string): string => {
  if (fallbackText) return fallbackText;
  if (!unixSeconds) return "日時不明";

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - unixSeconds);

  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 時間前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 日前`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} か月前`;
  return `${Math.floor(diff / 31536000)} 年前`;
};

export const formatDateJa = (unixSeconds?: number): string => {
  if (!unixSeconds) return "日時不明";
  const date = new Date(unixSeconds * 1000);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);
};
