// self が WorkerGlobalScope であることを TypeScript に認識させる
const ctx: Worker = self as any;

ctx.addEventListener("message", (e: MessageEvent) => {
  const { messageId, type, payload } = e.data;

  if (type === "filterAndSort") {
    const { videos, query, sortBy, sortOrder } = payload;
    if (!Array.isArray(videos)) {
      ctx.postMessage({ messageId, result: [] });
      return;
    }
    let result = [...videos];

    // 1. 重複排除
    const seen = new Set<string>();
    result = result.filter((v) => {
      const id = v.videoId || v.playlistId;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // 2. 検索クエリによるフィルタリング
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.author?.toLowerCase().includes(q)
      );
    }

    // 3. 各キーに応じた並び替え
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

    ctx.postMessage({ messageId, result });
  } else if (type === "mergeTrendingAndSubscriptions") {
    const { trendingVideos, subscribedVideos } = payload;

    const filterOutLive = (videos: any): any[] =>
      Array.isArray(videos) ? videos.filter((item) => item && !item.liveNow && !item.isUpcoming) : [];

    const trendingItems = filterOutLive(trendingVideos);
    const subscribedItems = filterOutLive(subscribedVideos);

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

    ctx.postMessage({ messageId, result: merged });
  }
});
