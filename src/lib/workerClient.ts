let worker: Worker | null = null;

try {
  if (typeof window !== "undefined" && window.Worker) {
    // Vite に適した URL ベースの Worker インスタンス作成
    worker = new Worker(
      new URL("../workers/dataProcessor.worker.ts", import.meta.url),
      { type: "module" }
    );
  }
} catch (e) {
  console.warn("Web Worker could not be initialized, falling back to main thread.", e);
}

// メインスレッド用の完全に等価なフォールバック関数
const filterAndSortFallback = (
  videos: any[],
  query: string,
  sortBy: string,
  sortOrder: "asc" | "desc"
): any[] => {
  let result = [...videos];

  const seen = new Set<string>();
  result = result.filter((v) => {
    const id = v.videoId || v.playlistId;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (v) =>
        v.title?.toLowerCase().includes(q) ||
        v.author?.toLowerCase().includes(q)
    );
  }

  if (sortBy === "date") {
    result.sort((a, b) => {
      const timeA = a.published ?? a.watchedAt ?? 0;
      const timeB = b.published ?? b.watchedAt ?? 0;
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  } else if (sortBy === "views") {
    result.sort((a, b) => {
      const viewsA = a.viewCount ?? 0;
      const viewsB = b.viewCount ?? 0;
      return sortOrder === "desc" ? viewsB - viewsA : viewsA - viewsB;
    });
  } else if (sortBy === "duration") {
    result.sort((a, b) => {
      const durA = a.lengthSeconds ?? 0;
      const durB = b.lengthSeconds ?? 0;
      return sortOrder === "desc" ? durB - durA : durA - durB;
    });
  }

  return result;
};

/**
 * 動画リストの重複排除、フィルタリング、ソート処理をバックグラウンドスレッド (Web Worker) で非同期に実行します。
 * Web Worker が非対応な古いブラウザやロードエラー時は、自動的にメインスレッドでフォールバック実行され、UIを破壊しません。
 */
export const filterAndSortVideos = (
  videos: any[],
  query: string = "",
  sortBy: "date" | "views" | "duration" | "none" = "none",
  sortOrder: "asc" | "desc" = "desc"
): Promise<any[]> => {
  if (!worker) {
    return Promise.resolve(filterAndSortFallback(videos, query, sortBy, sortOrder));
  }

  return new Promise((resolve) => {
    const messageId = Math.random().toString(36).substring(2);

    const handleMessage = (e: MessageEvent) => {
      if (e.data.messageId === messageId) {
        worker?.removeEventListener("message", handleMessage);
        resolve(e.data.result);
      }
    };

    worker?.addEventListener("message", handleMessage);
    worker?.postMessage({
      messageId,
      type: "filterAndSort",
      payload: { videos, query, sortBy, sortOrder },
    });
  });
};

// メインスレッド用の完全に等価なフォールバック関数（TrendingとSubscribedのマージ用）
const mergeTrendingAndSubscriptionsFallback = (
  trendingVideos: any[],
  subscribedVideos: any[]
): any[] => {
  const filterOutLive = (videos: any[]): any[] =>
    videos.filter((item) => !item.liveNow && !item.isUpcoming);

  const trendingItems = filterOutLive(trendingVideos ?? []);
  const subscribedItems = filterOutLive(subscribedVideos ?? []);

  const seen = new Set<string>();
  const merged: any[] = [];
  const maxLength = Math.max(trendingItems.length, subscribedItems.length);

  for (let i = 0; i < maxLength; i += 1) {
    const fromSubscribed = subscribedItems[i];
    if (fromSubscribed && !seen.has(fromSubscribed.videoId)) {
      seen.add(fromSubscribed.videoId);
      merged.push(fromSubscribed);
    }
    const fromTrending = trendingItems[i];
    if (fromTrending && !seen.has(fromTrending.videoId)) {
      seen.add(fromTrending.videoId);
      merged.push(fromTrending);
    }
  }

  return merged;
};

/**
 * 急上昇動画と登録チャンネル動画を、ライブ配信を除外しながら交互にマージし、重複排除する処理を
 * バックグラウンドスレッド (Web Worker) で実行します。
 * Worker が無効な環境では自動的にメインスレッドでフォールバックされます。
 */
export const mergeTrendingAndSubscriptions = (
  trendingVideos: any[],
  subscribedVideos: any[]
): Promise<any[]> => {
  if (!worker) {
    return Promise.resolve(
      mergeTrendingAndSubscriptionsFallback(trendingVideos, subscribedVideos)
    );
  }

  return new Promise((resolve) => {
    const messageId = Math.random().toString(36).substring(2);

    const handleMessage = (e: MessageEvent) => {
      if (e.data.messageId === messageId) {
        worker?.removeEventListener("message", handleMessage);
        resolve(e.data.result);
      }
    };

    worker?.addEventListener("message", handleMessage);
    worker?.postMessage({
      messageId,
      type: "mergeTrendingAndSubscriptions",
      payload: { trendingVideos, subscribedVideos },
    });
  });
};

