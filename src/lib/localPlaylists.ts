import { getCurrentLocalUser } from "./localUsers";
import type { PlaylistObject, PlaylistVideoObject, ThumbnailObject } from "../types/invidious";

const LOCAL_PLAYLISTS_KEY = "invidious-local-playlists-v1";

interface LocalPlaylistRecord {
  playlistId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  videos: PlaylistVideoObject[];
  playlistThumbnail?: string;
}

type LocalPlaylistsMap = Record<string, LocalPlaylistRecord[]>;

const readMap = (): LocalPlaylistsMap => {
  try {
    const raw = localStorage.getItem(LOCAL_PLAYLISTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalPlaylistsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeMap = (value: LocalPlaylistsMap): void => {
  localStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(value));
};

const toPlaylistObject = (record: LocalPlaylistRecord, authorName: string): PlaylistObject => ({
  type: "invidiousPlaylist",
  playlistId: record.playlistId,
  title: record.title,
  author: authorName,
  videoCount: record.videos.length,
  playlistThumbnail: record.playlistThumbnail,
  videos: record.videos,
});

const getUserRecords = (): { userId: string; authorName: string; records: LocalPlaylistRecord[] } => {
  const user = getCurrentLocalUser();
  const map = readMap();
  const records = Array.isArray(map[user.id]) ? map[user.id] : [];
  return { userId: user.id, authorName: user.name, records };
};

export const getLocalPlaylists = (): PlaylistObject[] => {
  const { authorName, records } = getUserRecords();
  return records
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((record) => toPlaylistObject(record, authorName));
};

export const getLocalPlaylist = (playlistId: string): PlaylistObject | null => {
  const { authorName, records } = getUserRecords();
  const found = records.find((record) => record.playlistId === playlistId);
  return found ? toPlaylistObject(found, authorName) : null;
};

export const createLocalPlaylist = (title: string): PlaylistObject => {
  const trimmed = title.trim() || "新しいプレイリスト";
  const { userId, authorName, records } = getUserRecords();
  const map = readMap();
  const next: LocalPlaylistRecord = {
    playlistId: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: trimmed,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    videos: [],
  };
  map[userId] = [next, ...records];
  writeMap(map);
  return toPlaylistObject(next, authorName);
};

export const addVideoToLocalPlaylist = (
  playlistId: string,
  video: {
    videoId: string;
    title: string;
    author?: string;
    authorId?: string;
    authorUrl?: string;
    lengthSeconds?: number;
    thumbnails?: ThumbnailObject[];
  },
): void => {
  const { userId, records } = getUserRecords();
  const map = readMap();
  const nextRecords = records.map((record) => {
    if (record.playlistId !== playlistId) return record;
    if (record.videos.some((item) => item.videoId === video.videoId)) {
      return { ...record, updatedAt: Date.now() };
    }
    const thumbnails = Array.isArray(video.thumbnails) && video.thumbnails.length > 0
      ? video.thumbnails
      : [{ quality: "default", url: "", width: 0, height: 0 }];
    const newItem: PlaylistVideoObject = {
      title: video.title,
      videoId: video.videoId,
      author: video.author,
      authorId: video.authorId,
      authorUrl: video.authorUrl,
      lengthSeconds: video.lengthSeconds,
      index: record.videos.length + 1,
      videoThumbnails: thumbnails,
    };
    return {
      ...record,
      videos: [...record.videos, newItem],
      playlistThumbnail: record.playlistThumbnail || thumbnails[0]?.url,
      updatedAt: Date.now(),
    };
  });
  map[userId] = nextRecords;
  writeMap(map);
};

