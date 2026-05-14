export interface SharePayload {
  title?: string;
  text?: string;
  url?: string;
}

type SchedulerPriority = "user-blocking" | "user-visible" | "background";

type SchedulerLike = {
  postTask?: (callback: () => void | Promise<void>, options?: { priority?: SchedulerPriority; delay?: number }) => Promise<unknown>;
};

export const canUsePictureInPictureApi = (): boolean =>
  typeof document !== "undefined" && !!document.pictureInPictureEnabled;

export const findActiveVideoElement = (): HTMLVideoElement | null => {
  if (typeof document === "undefined") return null;
  const allVideos = Array.from(document.querySelectorAll("video"));
  const playing = allVideos.find((video) => !video.paused && !video.ended);
  return playing ?? allVideos[0] ?? null;
};

export const togglePictureInPicture = async (videoElement?: HTMLVideoElement | null): Promise<boolean> => {
  if (!canUsePictureInPictureApi()) return false;
  const target = videoElement ?? findActiveVideoElement();
  if (!target) return false;

  try {
    if (document.pictureInPictureElement === target) {
      await document.exitPictureInPicture();
      return true;
    }
    await target.requestPictureInPicture();
    return true;
  } catch {
    return false;
  }
};

export const vibrate = (pattern: number | number[]): boolean => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  return navigator.vibrate(pattern);
};

export const shareContent = async (payload: SharePayload): Promise<boolean> => {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;

  const sanitized: SharePayload = {
    title: payload.title?.trim(),
    text: payload.text?.trim(),
    url: payload.url?.trim(),
  };

  if (typeof navigator.canShare === "function") {
    try {
      if (!navigator.canShare(sanitized as ShareData)) return false;
    } catch {
      // Some implementations throw on unknown payload shapes. Fall through to share().
    }
  }

  try {
    await navigator.share(sanitized as ShareData);
    return true;
  } catch {
    return false;
  }
};

export const withWebLock = (name: string, task: () => void): void => {
  if (typeof navigator === "undefined" || !("locks" in navigator) || typeof navigator.locks.request !== "function") {
    task();
    return;
  }

  void navigator.locks.request(name, async () => {
    task();
  });
};

export const scheduleTask = (task: () => void, priority: SchedulerPriority = "background", delay = 0): void => {
  const schedulerLike = (globalThis as { scheduler?: SchedulerLike }).scheduler;
  if (schedulerLike?.postTask) {
    void schedulerLike.postTask(() => task(), { priority, delay });
    return;
  }

  if (delay > 0) {
    window.setTimeout(task, delay);
    return;
  }

  queueMicrotask(task);
};

export const withViewTransition = (task: () => void): void => {
  const transitionStarter = (document as Document & { startViewTransition?: (callback: () => void) => unknown }).startViewTransition;
  if (typeof transitionStarter === "function") {
    try {
      transitionStarter(() => task());
      return;
    } catch {
      // fall back to normal navigation/update path
    }
  }
  task();
};
