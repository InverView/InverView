import { openDB } from "idb";

const DB_NAME = "invidious-client-cache";
const DB_VERSION = 1;
const STORE_NAME = "api-cache";

type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

export const setApiCache = async <T>(key: string, value: T, ttlMs: number): Promise<void> => {
  const expiresAt = Date.now() + ttlMs;
  memoryCache.set(key, { value, expiresAt });
  const db = await dbPromise;
  const payload: CacheRecord<T> = {
    value,
    expiresAt,
  };
  await db.put(STORE_NAME, payload, key);
};

export const getApiCache = async <T>(key: string): Promise<T | undefined> => {
  const memoryRecord = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (memoryRecord) {
    if (memoryRecord.expiresAt > Date.now()) {
      return memoryRecord.value;
    }
    memoryCache.delete(key);
  }

  const db = await dbPromise;
  const record = (await db.get(STORE_NAME, key)) as CacheRecord<T> | undefined;
  if (!record) return undefined;
  if (record.expiresAt <= Date.now()) {
    await db.delete(STORE_NAME, key);
    memoryCache.delete(key);
    return undefined;
  }
  memoryCache.set(key, record as CacheRecord<unknown>);
  return record.value;
};

export const deleteApiCache = async (key: string): Promise<void> => {
  memoryCache.delete(key);
  const db = await dbPromise;
  await db.delete(STORE_NAME, key);
};
