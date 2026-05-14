import { getCurrentLocalUser } from "./localUsers";

const LOCAL_SUBSCRIPTIONS_KEY = "invidious-local-subscriptions-v1";

type LocalSubscriptionsMap = Record<string, string[]>;

const readMap = (): LocalSubscriptionsMap => {
  try {
    const raw = localStorage.getItem(LOCAL_SUBSCRIPTIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalSubscriptionsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeMap = (value: LocalSubscriptionsMap): void => {
  localStorage.setItem(LOCAL_SUBSCRIPTIONS_KEY, JSON.stringify(value));
};

export const getLocalSubscriptionIds = (): string[] => {
  const user = getCurrentLocalUser();
  const map = readMap();
  return Array.isArray(map[user.id]) ? map[user.id] : [];
};

export const isLocallySubscribed = (channelId: string): boolean =>
  getLocalSubscriptionIds().includes(channelId);

export const addLocalSubscription = (channelId: string): void => {
  const trimmed = channelId.trim();
  if (!trimmed) return;
  const user = getCurrentLocalUser();
  const map = readMap();
  const current = Array.isArray(map[user.id]) ? map[user.id] : [];
  if (current.includes(trimmed)) return;
  map[user.id] = [trimmed, ...current];
  writeMap(map);
};

export const removeLocalSubscription = (channelId: string): void => {
  const user = getCurrentLocalUser();
  const map = readMap();
  const current = Array.isArray(map[user.id]) ? map[user.id] : [];
  map[user.id] = current.filter((id) => id !== channelId);
  writeMap(map);
};

export const toggleLocalSubscription = (channelId: string): boolean => {
  if (isLocallySubscribed(channelId)) {
    removeLocalSubscription(channelId);
    return false;
  }
  addLocalSubscription(channelId);
  return true;
};

