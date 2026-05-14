import type { ThumbnailObject } from "../types/invidious";
import type { QualityMode } from "../store/settingsStore";

const ABSOLUTE_URL_RE = /^https?:\/\//i;
const normalizeBase = (baseUrl: string): string => baseUrl.replace(/\/+$/, "");

export const resolveMediaUrl = (url: string | undefined, baseUrl: string): string => {
  if (!url) return "";
  if (ABSOLUTE_URL_RE.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (!baseUrl) return url;

  try {
    return new URL(url, `${normalizeBase(baseUrl)}/`).toString();
  } catch {
    return `${normalizeBase(baseUrl)}${url.startsWith("/") ? "" : "/"}${url}`;
  }
};

export const pickBestThumbnail = (thumbnails?: ThumbnailObject[]): ThumbnailObject | undefined => {
  if (!thumbnails || thumbnails.length === 0) return undefined;
  let best = thumbnails[0];
  let bestArea = (best.width || 0) * (best.height || 0);

  for (let i = 1; i < thumbnails.length; i += 1) {
    const candidate = thumbnails[i];
    const area = (candidate.width || 0) * (candidate.height || 0);
    if (area > bestArea) {
      best = candidate;
      bestArea = area;
    }
  }

  return best;
};

export const pickPosterThumbnail = (thumbnails?: ThumbnailObject[]): ThumbnailObject | undefined => {
  if (!thumbnails || thumbnails.length === 0) return undefined;
  let best = thumbnails[0];
  let bestScore = Math.abs((best.width || 0) - 1280);

  for (let i = 1; i < thumbnails.length; i += 1) {
    const candidate = thumbnails[i];
    const score = Math.abs((candidate.width || 0) - 1280);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
};

interface StreamLike {
  url: string;
  container?: string;
  qualityLabel?: string;
  resolution?: string;
  type?: string;
}

interface StreamSelectOptions {
  quality?: QualityMode;
  dataSaver?: boolean;
  audioOnly?: boolean;
}

const parseHeight = (stream: StreamLike): number => {
  const quality = stream.qualityLabel ?? stream.resolution ?? "";
  return Number.parseInt(quality.replace(/[^0-9]/g, ""), 10) || 0;
};

export const pickPlayableStream = (
  streams: StreamLike[] | undefined,
  options: StreamSelectOptions = {},
): StreamLike | undefined => {
  if (!streams?.length) return undefined;

  const preferredLimit = options.quality && options.quality !== "auto"
    ? Number.parseInt(options.quality.replace("p", ""), 10)
    : options.dataSaver
      ? 480
      : 1080;

  const filteredByType = options.audioOnly
    ? streams.filter((stream) => (stream.type ?? stream.container ?? "").includes("audio"))
    : streams;

  const candidates = filteredByType.length ? filteredByType : streams;

  const ranked = [...candidates].sort((a, b) => {
    const aHeight = parseHeight(a);
    const bHeight = parseHeight(b);

    const aContainerScore = (a.container ?? "").includes("mp4") ? 1000 : (a.container ?? "").includes("webm") ? 900 : 800;
    const bContainerScore = (b.container ?? "").includes("mp4") ? 1000 : (b.container ?? "").includes("webm") ? 900 : 800;

    const aPenalty = aHeight > preferredLimit ? (aHeight - preferredLimit) * 4 : preferredLimit - aHeight;
    const bPenalty = bHeight > preferredLimit ? (bHeight - preferredLimit) * 4 : preferredLimit - bHeight;

    return bContainerScore - aContainerScore || aPenalty - bPenalty;
  });

  return ranked[0];
};
