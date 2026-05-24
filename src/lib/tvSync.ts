const TV_SESSION_STORAGE_KEY = "inverview-tv-session-id";

export const setTvSessionId = (sessionId: string): void => {
  if (typeof window === "undefined") return;
  if (sessionId) {
    window.sessionStorage.setItem(TV_SESSION_STORAGE_KEY, sessionId);
    return;
  }
  window.sessionStorage.removeItem(TV_SESSION_STORAGE_KEY);
};

export const getTvSessionId = (): string => {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TV_SESSION_STORAGE_KEY) || "";
};
