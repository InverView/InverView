import { appDb } from "./appDb";
import { loadWatchHistory, saveWatchHistory } from "../settings/storage";
import type { WatchHistoryItem } from "../settings/types";

const MAX_HISTORY = 300;
let watchHistoryCache = loadWatchHistory().slice(0, MAX_HISTORY);

const persistWatchHistory = (history: WatchHistoryItem[]): void => {
  void appDb.transaction("rw", appDb.watchHistory, async () => {
    await appDb.watchHistory.clear();
    if (history.length === 0) return;
    await appDb.watchHistory.bulkPut(history);
  });
};

export const initializeWatchHistory = (): void => {
  void appDb.watchHistory.toArray().then((rows) => {
    if (rows.length > 0) {
      watchHistoryCache = rows.slice(0, MAX_HISTORY);
      saveWatchHistory(watchHistoryCache);
      return;
    }
    persistWatchHistory(watchHistoryCache);
  });
};

export const getWatchHistory = (): WatchHistoryItem[] =>
  [...watchHistoryCache].sort((a, b) => b.watchedAt - a.watchedAt);

export const addWatchHistoryItem = (item: WatchHistoryItem): void => {
  const without = watchHistoryCache.filter((entry) => entry.videoId !== item.videoId);
  const next = [item, ...without].slice(0, MAX_HISTORY);
  watchHistoryCache = next;
  saveWatchHistory(next);
  persistWatchHistory(next);
};

export const updateWatchHistoryPosition = (videoId: string, positionSeconds: number): void => {
  const next = watchHistoryCache.map((entry) =>
    entry.videoId === videoId
      ? { ...entry, positionSeconds: Math.max(0, Math.floor(positionSeconds)), watchedAt: Date.now() }
      : entry,
  );
  watchHistoryCache = next;
  saveWatchHistory(next);
  persistWatchHistory(next);
};

export const removeWatchHistoryItem = (videoId: string): void => {
  const next = watchHistoryCache.filter((item) => item.videoId !== videoId);
  watchHistoryCache = next;
  saveWatchHistory(next);
  persistWatchHistory(next);
};

export const clearWatchHistory = (): void => {
  watchHistoryCache = [];
  saveWatchHistory([]);
  persistWatchHistory([]);
};

export const findWatchHistoryItem = (videoId: string): WatchHistoryItem | undefined =>
  watchHistoryCache.find((item) => item.videoId === videoId);
