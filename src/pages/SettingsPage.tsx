import {
  makeStyles,
  tokens,
  Text,
  Input,
  Switch,
  Dropdown,
  Option,
  Button,
  Label,
  Card,
  CardHeader,
  Caption1,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { useSettings } from "../hooks/useSettings";
import type { AccentColor, AnimationStrength, CompanionMode, CornerRadius, LastFmTitleFormatMode, QualityMode, StartPage, ThemeMode } from "../hooks/useSettings";
import { clearRecentSearches } from "../lib/recentSearch";
import { clearWatchHistory } from "../lib/watchHistory";
import { createLocalUser, getCurrentLocalUser, getLocalUsers, setCurrentLocalUser } from "../lib/localUsers";
import { getLastFmSessionFromToken } from "../lib/lastfm";
import { isCapacitorRuntime, isElectronRuntime } from "../lib/runtimeEnv";
import { openExternalUrl } from "../lib/webPlatform";

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const instanceUrlSchema = z.object({
  instanceUrl: z.string().trim().refine((value) => isValidHttpUrl(value), i18n.t("settings.instanceUrlInvalid")),
});

const isElectron = isElectronRuntime();
const isCapacitor = isCapacitorRuntime();
const electronProxyBaseUrl = import.meta.env.VITE_ELECTRON_LOCAL_PROXY_BASE_URL || "http://127.0.0.1:8282";
const capacitorProxyBaseUrl = import.meta.env.VITE_CAPACITOR_LOCAL_PROXY_BASE_URL || "http://127.0.0.1:8282";
const primaryCompanionUrl = "https://companion.tsub4sa.xyz";
const fallbackCompanionUrl = "https://proxy.tsub4sa.xyz";
const firstNonEmpty = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const getDefaultCompanionConfig = (): { url: string; secret: string } => {
  if (isElectron) {
    return {
      url: import.meta.env.VITE_ELECTRON_COMPANION_URL || `${electronProxyBaseUrl.replace(/\/+$/, "")}/companion`,
      secret: import.meta.env.VITE_ELECTRON_COMPANION_SECRET || import.meta.env.VITE_COMPANION_SECRET || "",
    };
  }
  if (isCapacitor) {
    return {
      url: import.meta.env.VITE_CAPACITOR_COMPANION_URL || `${capacitorProxyBaseUrl.replace(/\/+$/, "")}/companion`,
      secret: import.meta.env.VITE_CAPACITOR_COMPANION_SECRET || import.meta.env.VITE_COMPANION_SECRET || "",
    };
  }

  return {
    url: firstNonEmpty(import.meta.env.VITE_COMPANION_URL, primaryCompanionUrl, fallbackCompanionUrl),
    secret: import.meta.env.VITE_COMPANION_SECRET || "",
  };
};

type InstanceUrlFormValues = z.infer<typeof instanceUrlSchema>;

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  overlaySurface: {
    width: "min(calc(100vw - 16px), 760px)",
    maxWidth: "760px",
  },
  overlayBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxHeight: "88vh",
    overflowY: "auto",
    padding: "20px 22px",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  rowField: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    width: "100%",
    flexWrap: "wrap",
  },
  alert: {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: tokens.colorStatusWarningBackground1,
    border: `1px solid ${tokens.colorStatusWarningBorder1}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
  helperText: {
    color: tokens.colorNeutralForeground3,
  },
});

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }): JSX.Element => {
  const styles = useStyles();
  return (
    <Card appearance="outline">
      <CardHeader
        header={<Text weight="bold" size={400}>{title}</Text>}
      />
      <div className={styles.section}>
        {children}
      </div>
    </Card>
  );
};

export const SettingsPage = (): JSX.Element => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { settings, setSetting: applySetting, resetSettings, exportSettings, importSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const overlayBodyRef = useRef<HTMLDivElement | null>(null);
  const overlayScrollTopRef = useRef(0);
  const pageScrollTopRef = useRef(0);
  const pendingScrollRestoreRef = useRef(false);
  const instanceUrlForm = useForm<InstanceUrlFormValues>({
    resolver: zodResolver(instanceUrlSchema),
    defaultValues: { instanceUrl: settings.instanceUrl },
    mode: "onSubmit",
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  const [isClearSearchConfirmOpen, setIsClearSearchConfirmOpen] = useState(false);
  const [noticeDialog, setNoticeDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });
  const noticeDialogId = useId();
  const shouldSkipHistoryBackRef = useRef(false);

  const openNoticeDialog = (title: string, message: string): void => {
    setNoticeDialog({ open: true, title, message });
  };

  const setSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]): void => {
    overlayScrollTopRef.current = overlayBodyRef.current?.scrollTop ?? overlayScrollTopRef.current;
    pageScrollTopRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    pendingScrollRestoreRef.current = true;
    applySetting(key, value);
  };

  useLayoutEffect(() => {
    if (!pendingScrollRestoreRef.current) return;
    pendingScrollRestoreRef.current = false;
    if (overlayBodyRef.current) {
      overlayBodyRef.current.scrollTop = overlayScrollTopRef.current;
    }
    const y = pageScrollTopRef.current;
    if (window.scrollY !== y) {
      window.scrollTo({ top: y, behavior: "auto" });
    }
    requestAnimationFrame(() => {
      if (overlayBodyRef.current) {
        overlayBodyRef.current.scrollTop = overlayScrollTopRef.current;
      }
      if (window.scrollY !== y) {
        window.scrollTo({ top: y, behavior: "auto" });
      }
    });
  }, [settings]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isLastFmCallback = params.get("lastfm") === "1";
    const token = params.get("token");
    const hasAuthCallback = !!token && (isLastFmCallback || !isLastFmCallback);
    const referrerOrigin = (() => {
      try {
        return document.referrer ? new URL(document.referrer).origin : "";
      } catch {
        return "";
      }
    })();
    if (hasAuthCallback && referrerOrigin && referrerOrigin !== window.location.origin) {
      shouldSkipHistoryBackRef.current = true;
    }
    if (token && isLastFmCallback) {
      if (!settings.lastFmApiKey.trim() || !settings.lastFmApiSecret.trim()) {
        openNoticeDialog(t("settings.lastFmAuthErrorTitle"), t("settings.lastFmCredentialsRequired"));
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }
      void getLastFmSessionFromToken(settings.lastFmApiKey, settings.lastFmApiSecret, token)
        .then(({ username, sessionKey }) => {
          setSetting("lastFmUsername", username);
          setSetting("lastFmSessionKey", sessionKey);
          setSetting("lastFmEnabled", true);
          openNoticeDialog(t("settings.lastFmAuthSuccessTitle"), t("settings.lastFmAuthSuccessMessage", { username }));
        })
        .catch((error) => {
          console.error(error);
          openNoticeDialog(t("settings.lastFmAuthErrorTitle"), t("settings.lastFmAuthFailed"));
        })
        .finally(() => {
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        });
      return;
    }
    if (token) {
      setSetting("token", token);
      // URLからトークンを削除してクリーンにする
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      openNoticeDialog(t("settings.loginSuccessTitle"), t("settings.loginSuccessMessage"));
    }
  }, [setSetting, t]);

  const [newChannelId, setNewChannelId] = useState("");
  const [localUsers, setLocalUsers] = useState(getLocalUsers());
  const [newLocalUserName, setNewLocalUserName] = useState("");
  const currentLocalUser = getCurrentLocalUser();

  useEffect(() => {
    instanceUrlForm.reset({ instanceUrl: settings.instanceUrl });
  }, [settings.instanceUrl, instanceUrlForm]);

  const applyInstanceUrl = instanceUrlForm.handleSubmit((values) => {
    setSetting("instanceUrl", values.instanceUrl.trim());
  });

  const handleInvidiousLogin = (): void => {
    const scopes = [
      ":preferences",
      ":subscriptions*",
      ":playlists*",
      "GET:feed*",
      "GET:notifications*",
    ].join(",");
    
    const callbackUrl = window.location.origin + window.location.pathname;
    const authUrl = `${settings.instanceUrl}/authorize_token?scopes=${encodeURIComponent(scopes)}&callback_url=${encodeURIComponent(callbackUrl)}`;
    
    window.location.href = authUrl;
  };

  const handleExport = (): void => {
    const blob = new Blob([exportSettings()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invidious-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openLastFmAuth = (): void => {
    if (!settings.lastFmApiKey.trim()) {
      openNoticeDialog(t("settings.lastFmAuthErrorTitle"), t("settings.lastFmApiKeyRequired"));
      return;
    }
    const callback = `${window.location.origin}${window.location.pathname}?settings=1&lastfm=1`;
    const authUrl = `https://www.last.fm/api/auth/?api_key=${encodeURIComponent(settings.lastFmApiKey.trim())}&cb=${encodeURIComponent(callback)}`;
    void openExternalUrl(authUrl);
  };

  const addFavoriteChannel = () => {
    if (!newChannelId.trim()) return;
    if (settings.favoriteShortsChannelIds.includes(newChannelId.trim())) {
      setNewChannelId("");
      return;
    }
    setSetting("favoriteShortsChannelIds", [...settings.favoriteShortsChannelIds, newChannelId.trim()]);
    setNewChannelId("");
  };

  const removeFavoriteChannel = (id: string) => {
    setSetting("favoriteShortsChannelIds", settings.favoriteShortsChannelIds.filter(x => x !== id));
  };

  const playFavoriteShorts = () => {
    const ids = settings.favoriteShortsChannelIds.join(",");
    window.location.href = `/shorts?authorId=${ids}&shuffle=1`;
  };

  const refreshLocalUsers = (): void => {
    setLocalUsers(getLocalUsers());
  };

  const createUser = (): void => {
    createLocalUser(newLocalUserName);
    setNewLocalUserName("");
    refreshLocalUsers();
  };

  const switchUser = (userId: string): void => {
    setCurrentLocalUser(userId);
    refreshLocalUsers();
  };

  const closeSettingsOverlay = (): void => {
    if (shouldSkipHistoryBackRef.current) {
      navigate("/", { replace: true });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };
  const defaultLastFmApiKey = import.meta.env.VITE_LASTFM_API_KEY || "";
  const defaultLastFmApiSecret = import.meta.env.VITE_LASTFM_API_SECRET || "";

  return (
    <Dialog open onOpenChange={(_, data) => { if (!data.open) closeSettingsOverlay(); }}>
      <DialogSurface className={styles.overlaySurface} data-settings-surface="true">
        <div
          className={styles.overlayBody}
          ref={overlayBodyRef}
          onScroll={() => {
            overlayScrollTopRef.current = overlayBodyRef.current?.scrollTop ?? 0;
          }}
        >
          <div className={styles.titleRow}>
            <Text size={700} weight="bold">{t("settings.title")}</Text>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              aria-label={t("common.close")}
              title={t("common.close")}
              onClick={closeSettingsOverlay}
            />
          </div>

          <div className={styles.container}>
            <div className={styles.grid}>
              <SectionCard title={t("settings.generalSection")}>
          <div className={styles.field}>
            <Label>{t("settings.instanceUrlLabel")}</Label>
            <div className={styles.inputRow}>
              <Input
                style={{ flexGrow: 1 }}
                value={instanceUrlForm.watch("instanceUrl")}
                onChange={(_, data) => instanceUrlForm.setValue("instanceUrl", data.value, { shouldValidate: false })}
              />
              <Button onClick={applyInstanceUrl} appearance="primary">{t("settings.apply")}</Button>
            </div>
            {instanceUrlForm.formState.errors.instanceUrl?.message ? (
              <Caption1 className={styles.errorText}>{instanceUrlForm.formState.errors.instanceUrl.message}</Caption1>
            ) : (
              <Caption1 className={styles.helperText}>{t("settings.defaultInstanceUrl", { url: "https://invidious.tsub4sa.xyz" })}</Caption1>
            )}
          </div>

          <div className={styles.field}>
            <Label>{t("settings.apiProxyUrlLabel")}</Label>
            <Input
              value={settings.apiProxyUrl}
              onChange={(_, data) => setSetting("apiProxyUrl", data.value)}
              placeholder="/api-proxy"
            />
            <Caption1 className={styles.helperText}>{t("settings.apiProxyUrlDescription")}</Caption1>
          </div>

          <div className={styles.field}>
            <Label>{t("settings.region")}</Label>
            <Dropdown
              aria-label={t("settings.region")}
              value={settings.region}
              selectedOptions={[settings.region]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("region", data.optionValue);
              }}
            >
              {["JP", "US", "KR", "GB", "DE", "FR", "TW", "CA", "AU"].map((region) => (
                <Option key={region} value={region}>{region}</Option>
              ))}
            </Dropdown>
          </div>

          <div className={styles.field}>
            <Label>{t("settings.displayLanguage")}</Label>
            <Dropdown
              aria-label={t("settings.displayLanguage")}
              value={settings.language?.startsWith("ja") ? "ja" : "en"}
              selectedOptions={[settings.language?.startsWith("ja") ? "ja" : "en"]}
              inlinePopup
              onOptionSelect={(_, data) => {
                const next = data.optionValue === "ja" ? "ja" : "en";
                setSetting("language", next);
                void i18n.changeLanguage(next);
              }}
            >
              <Option value="ja">{t("settings.japanese")}</Option>
              <Option value="en">English</Option>
            </Dropdown>
          </div>

          <div className={styles.field}>
            <Label>{t("settings.favoriteChannels")}</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
              {settings.favoriteShortsChannelIds.map((id) => (
                <div key={id} className={styles.inputRow}>
                  <Input value={id} readOnly style={{ flexGrow: 1 }} />
                  <Button 
                    onClick={() => removeFavoriteChannel(id)}
                    appearance="subtle"
                  >
                    {t("settings.remove")}
                  </Button>
                </div>
              ))}
            </div>
            <div className={styles.inputRow}>
              <Input
                style={{ flexGrow: 1 }}
                value={newChannelId}
                onChange={(e, data) => setNewChannelId(data.value)}
                placeholder={t("settings.addChannelPlaceholder")}
              />
              <Button onClick={addFavoriteChannel} appearance="primary">{t("settings.add")}</Button>
            </div>
            <Button 
              style={{ marginTop: "8px" }}
              disabled={settings.favoriteShortsChannelIds.length === 0}
              onClick={playFavoriteShorts}
              appearance="outline"
            >
              {t("settings.favoriteShufflePlay", { count: settings.favoriteShortsChannelIds.length })}
            </Button>
            <Caption1 className={styles.helperText}>
              {t("settings.favoriteShuffleHelp")}
            </Caption1>
          </div>

          <div className={styles.field}>
            <Label>{t("settings.startPage")}</Label>
            <Dropdown
              aria-label={t("settings.startPage")}
              value={settings.startPage}
              selectedOptions={[settings.startPage]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("startPage", data.optionValue as StartPage);
              }}
            >
              <Option value="home">{t("nav.home")}</Option>
              <Option value="trending">{t("nav.trending")}</Option>
              <Option value="popular">{t("nav.popular")}</Option>
              <Option value="subscriptions">{t("nav.subscriptions")}</Option>
              <Option value="search">{t("nav.search")}</Option>
            </Dropdown>
          </div>

          <div className={styles.field}>
            <Label>{t("settings.theme")}</Label>
            <Dropdown
              aria-label={t("settings.theme")}
              value={settings.theme}
              selectedOptions={[settings.theme]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("theme", data.optionValue as ThemeMode);
              }}
            >
              <Option value="system">{t("settings.themeSystem")}</Option>
              <Option value="light">{t("settings.themeLight")}</Option>
              <Option value="dark">{t("settings.themeDark")}</Option>
              <Option value="amoled">{t("settings.themeAmoled")}</Option>
            </Dropdown>
          </div>

          <div className={styles.rowField}>
            <Label>{t("settings.forceAmoled")}</Label>
            <Switch checked={settings.amoledEnabled} onChange={(e) => setSetting("amoledEnabled", e.target.checked)} />
          </div>

          <div className={styles.field}>
            <Label>{t("settings.cornerRadius")}</Label>
            <Dropdown
              aria-label={t("settings.cornerRadius")}
              value={settings.cornerRadius}
              selectedOptions={[settings.cornerRadius]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("cornerRadius", data.optionValue as CornerRadius);
              }}
            >
              <Option value="none">{t("settings.none")}</Option>
              <Option value="small">{t("settings.small")}</Option>
              <Option value="medium">{t("settings.medium")}</Option>
              <Option value="large">{t("settings.large")}</Option>
              <Option value="xlarge">{t("settings.extraLarge")}</Option>
            </Dropdown>
          </div>
        </SectionCard>

              <SectionCard title={t("settings.historySearchSection")}>
          <div className={styles.rowField}>
            <Label>{t("settings.saveWatchHistory")}</Label>
            <Switch checked={settings.saveWatchHistory} onChange={(e) => setSetting("saveWatchHistory", e.target.checked)} />
          </div>
          <div className={styles.rowField}>
            <Label>{t("settings.showSearchSuggestions")}</Label>
            <Switch checked={settings.showSearchSuggestions} onChange={(e) => setSetting("showSearchSuggestions", e.target.checked)} />
          </div>

          {isClearHistoryConfirmOpen ? (
            <div className={styles.alert}>
              <Text weight="semibold">{t("settings.confirmClearWatchHistory")}</Text>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="small" appearance="primary" onClick={() => { clearWatchHistory(); setIsClearHistoryConfirmOpen(false); }}>{t("settings.delete")}</Button>
                <Button size="small" appearance="outline" onClick={() => setIsClearHistoryConfirmOpen(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          ) : (
            <Button appearance="outline" onClick={() => setIsClearHistoryConfirmOpen(true)}>{t("settings.clearWatchHistory")}</Button>
          )}

          {isClearSearchConfirmOpen ? (
            <div className={styles.alert}>
              <Text weight="semibold">{t("settings.confirmClearSearchHistory")}</Text>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="small" appearance="primary" onClick={() => { clearRecentSearches(); setIsClearSearchConfirmOpen(false); }}>{t("settings.delete")}</Button>
                <Button size="small" appearance="outline" onClick={() => setIsClearSearchConfirmOpen(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          ) : (
            <Button appearance="outline" onClick={() => setIsClearSearchConfirmOpen(true)}>{t("settings.clearSearchHistory")}</Button>
          )}
        </SectionCard>

              <SectionCard title={t("settings.playbackSection")}>
          <div className={styles.rowField}><Label>{t("settings.autoplay")}</Label><Switch checked={settings.autoplay} onChange={(e) => setSetting("autoplay", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.loopVideo")}</Label><Switch checked={settings.loopVideo} onChange={(e) => setSetting("loopVideo", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.useProxyVideo")}</Label><Switch checked={settings.useProxyVideo} onChange={(e) => setSetting("useProxyVideo", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.rememberPlaybackPosition")}</Label><Switch checked={settings.rememberPlaybackPosition} onChange={(e) => setSetting("rememberPlaybackPosition", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.miniPlayer")}</Label><Switch checked={settings.miniPlayer} onChange={(e) => setSetting("miniPlayer", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.theaterMode")}</Label><Switch checked={settings.theaterMode} onChange={(e) => setSetting("theaterMode", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.autoplayNextVideo")}</Label><Switch checked={settings.autoplayNextVideo} onChange={(e) => setSetting("autoplayNextVideo", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.showCaptionsByDefault")}</Label><Switch checked={settings.showCaptionsByDefault} onChange={(e) => setSetting("showCaptionsByDefault", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.preferOriginalTranslation")}</Label><Switch checked={settings.preferOriginalTranslation} onChange={(e) => setSetting("preferOriginalTranslation", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.hapticFeedback")}</Label><Switch checked={settings.hapticFeedback} onChange={(e) => setSetting("hapticFeedback", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.privacyScreenEnabled")}</Label><Switch checked={settings.privacyScreenEnabled} onChange={(e) => setSetting("privacyScreenEnabled", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.cinematicLighting")}</Label><Switch checked={settings.cinematicLighting} onChange={(e) => setSetting("cinematicLighting", e.target.checked)} /></div>
          {isCapacitor ? (
            <>
              <div className={styles.rowField}><Label>{t("settings.pictureInPictureEnabled")}</Label><Switch checked={settings.pictureInPictureEnabled} onChange={(e) => setSetting("pictureInPictureEnabled", e.target.checked)} /></div>
              <div className={styles.rowField}><Label>{t("settings.autoEnterPipOnBackground")}</Label><Switch checked={settings.autoEnterPipOnBackground} disabled={!settings.pictureInPictureEnabled} onChange={(e) => setSetting("autoEnterPipOnBackground", e.target.checked)} /></div>
              <div className={styles.rowField}><Label>{t("settings.backgroundPlaybackEnabled")}</Label><Switch checked={settings.backgroundPlaybackEnabled} onChange={(e) => setSetting("backgroundPlaybackEnabled", e.target.checked)} /></div>
              <div className={styles.rowField}><Label>{t("settings.androidMediaNotificationEnabled")}</Label><Switch checked={settings.androidMediaNotificationEnabled} onChange={(e) => setSetting("androidMediaNotificationEnabled", e.target.checked)} /></div>
            </>
          ) : null}

          <div className={styles.field}>
            <Label>{t("settings.quality")}</Label>
            <Dropdown
              aria-label={t("settings.quality")}
              value={settings.quality}
              selectedOptions={[settings.quality]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("quality", data.optionValue as QualityMode);
              }}
            >
              <Option value="auto">Auto</Option>
              <Option value="1080p">1080p</Option>
              <Option value="720p">720p</Option>
              <Option value="480p">480p</Option>
              <Option value="360p">360p</Option>
            </Dropdown>
          </div>
          <div className={styles.field}>
            <Label>{t("settings.defaultAudioTrackLanguage")}</Label>
            <Dropdown
              aria-label={t("settings.defaultAudioTrackLanguage")}
              value={settings.audioTrackLanguage}
              selectedOptions={[settings.audioTrackLanguage]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("audioTrackLanguage", data.optionValue);
              }}
            >
              <Option value="auto">{t("settings.audioTrackLanguageAuto")}</Option>
              <Option value="ja">Japanese (ja)</Option>
              <Option value="en">English (en)</Option>
            </Dropdown>
          </div>

          <div className={styles.rowField}><Label>{t("settings.audioOnly")}</Label><Switch checked={settings.audioOnly} onChange={(e) => setSetting("audioOnly", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.dataSaver")}</Label><Switch checked={settings.dataSaver} onChange={(e) => setSetting("dataSaver", e.target.checked)} /></div>
        </SectionCard>

              <SectionCard title={t("settings.watchSection")}>
          <div className={styles.rowField}><Label>{t("settings.expandDescriptionByDefault")}</Label><Switch checked={settings.expandDescriptionByDefault} onChange={(e) => setSetting("expandDescriptionByDefault", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.hideDescriptionSection")}</Label><Switch checked={settings.hideDescriptionSection} onChange={(e) => setSetting("hideDescriptionSection", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.expandChaptersByDefault")}</Label><Switch checked={settings.expandChaptersByDefault} onChange={(e) => setSetting("expandChaptersByDefault", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>{t("settings.expandCommentsByDefault")}</Label><Switch checked={settings.expandCommentsByDefault} onChange={(e) => setSetting("expandCommentsByDefault", e.target.checked)} /></div>
        </SectionCard>

              <SectionCard title={t("settings.appearanceSection")}>
          <div className={styles.field}>
            <Label>{t("settings.accentColor")}</Label>
            <Dropdown
              aria-label={t("settings.accentColor")}
              value={settings.accentColor}
              selectedOptions={[settings.accentColor]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("accentColor", data.optionValue as AccentColor);
              }}
            >
              <Option value="blue">{t("settings.colorBlue")}</Option>
              <Option value="red">{t("settings.colorRed")}</Option>
              <Option value="purple">{t("settings.colorPurple")}</Option>
              <Option value="green">{t("settings.colorGreen")}</Option>
              <Option value="orange">{t("settings.colorOrange")}</Option>
              <Option value="pink">{t("settings.colorPink")}</Option>
              <Option value="custom">{t("settings.custom")}</Option>
            </Dropdown>
          </div>
          {settings.accentColor === "custom" ? (
            <div className={styles.field}>
              <Label>{t("settings.customColor")}</Label>
              <Input value={settings.customAccentColor} onChange={(e, data) => setSetting("customAccentColor", data.value)} />
            </div>
          ) : null}

          <div className={styles.rowField}><Label>{t("settings.showDesktopSidebar")}</Label><Switch checked={settings.showDesktopSidebar} onChange={(e) => setSetting("showDesktopSidebar", e.target.checked)} /></div>

          <div className={styles.field}>
            <Label>{t("settings.animationStrength")}</Label>
            <Dropdown
              aria-label={t("settings.animationStrength")}
              value={settings.animationStrength}
              selectedOptions={[settings.animationStrength]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("animationStrength", data.optionValue as AnimationStrength);
              }}
            >
              <Option value="off">{t("settings.off")}</Option>
              <Option value="reduced">{t("settings.reduced")}</Option>
              <Option value="normal">{t("settings.normal")}</Option>
            </Dropdown>
          </div>
          <div className={styles.rowField}>
            <Label>{t("settings.useLenis")}</Label>
            <Switch checked={settings.useLenis} onChange={(e) => setSetting("useLenis", e.target.checked)} />
          </div>
          <div className={styles.rowField}>
            <Label>{t("settings.hideShorts") || "Shortsを非表示にする"}</Label>
            <Switch checked={settings.hideShorts} onChange={(e) => setSetting("hideShorts", e.target.checked)} />
          </div>
          <div className={styles.rowField}>
            <Label>{t("settings.hideMobileNavLabels") || "モバイルナビのテキストを非表示"}</Label>
            <Switch checked={settings.hideMobileNavLabels} onChange={(e) => setSetting("hideMobileNavLabels", e.target.checked)} />
          </div>
        </SectionCard>

              <SectionCard title={t("settings.accountSection")}>
          <Text size={200} className={styles.helperText}>
            {t("settings.accountDescription")}
          </Text>
          <div className={styles.field}>
            <Label>{t("settings.localUser")}</Label>
            <Dropdown
              aria-label={t("settings.localUser")}
              value={currentLocalUser.name}
              selectedOptions={[currentLocalUser.id]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) switchUser(data.optionValue);
              }}
            >
              {localUsers.map((user) => (
                <Option key={user.id} value={user.id} text={user.name}>{user.name}</Option>
              ))}
            </Dropdown>
            <div className={styles.inputRow}>
              <Input
                value={newLocalUserName}
                onChange={(_, data) => setNewLocalUserName(data.value)}
                placeholder={t("settings.newUserNamePlaceholder")}
                style={{ flexGrow: 1 }}
              />
              <Button appearance="outline" onClick={createUser}>{t("settings.add")}</Button>
            </div>
            <Caption1 className={styles.helperText}>
              {t("settings.currentUser", { name: currentLocalUser.name })}
            </Caption1>
          </div>
          {settings.token ? (
            <div className={styles.alert} style={{ backgroundColor: tokens.colorStatusSuccessBackground1, borderColor: tokens.colorStatusSuccessBorder1 }}>
              <Text weight="semibold">{t("settings.loggedIn")}</Text>
              <Caption1>{t("settings.tokenConfigured")}</Caption1>
              <Button appearance="outline" onClick={() => setSetting("token", "")}>{t("settings.logout")}</Button>
            </div>
          ) : (
            <Button appearance="primary" onClick={handleInvidiousLogin}>{t("settings.loginWithInvidious")}</Button>
          )}
        </SectionCard>

              <SectionCard title={t("settings.companionSection")}>
          <Text size={200} className={styles.helperText}>
            {t("settings.companionDescription")}
          </Text>
          <div className={styles.field}>
            <Label>{t("settings.companionMode")}</Label>
            <Dropdown
              aria-label={t("settings.companionMode")}
              value={settings.companionMode === "default" ? t("settings.companionDefault") : t("settings.companionCustom")}
              selectedOptions={[settings.companionMode]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (!data.optionValue) return;
                const mode = data.optionValue as CompanionMode;
                setSetting("companionMode", mode);
                if (mode === "default") {
                  const defaults = getDefaultCompanionConfig();
                  setSetting("companionUrl", defaults.url);
                  setSetting("companionSecret", defaults.secret);
                }
              }}
            >
              <Option value="default">{t("settings.companionDefault")}</Option>
              <Option value="custom">{t("settings.companionCustom")}</Option>
            </Dropdown>
          </div>
          
          <div className={styles.field}>
            <Label>{t("settings.companionUrl")}</Label>
            <Input
              value={settings.companionUrl}
              onChange={(e, data) => setSetting("companionUrl", data.value)}
              disabled={settings.companionMode !== "custom"}
              placeholder="https://companion.example.com"
            />
          </div>
          <div className={styles.field}>
            <Label>{t("settings.companionSecret")}</Label>
            <Input
              type="password"
              value={settings.companionSecret}
              onChange={(e, data) => setSetting("companionSecret", data.value)}
              disabled={settings.companionMode !== "custom"}
              placeholder="YOURSECRETKEY"
            />
          </div>
        </SectionCard>

              <SectionCard title={t("settings.lastFmSection")}>
          <Text size={200} className={styles.helperText}>
            {t("settings.lastFmDescription")}
          </Text>
          <div className={styles.rowField}>
            <Label>{t("settings.lastFmEnabled")}</Label>
            <Switch checked={settings.lastFmEnabled} onChange={(e) => setSetting("lastFmEnabled", e.target.checked)} />
          </div>
          <div className={styles.field}>
            <Label>{t("settings.lastFmApiKey")}</Label>
            <div className={styles.inputRow}>
              <Input
                value={settings.lastFmApiKey}
                onChange={(_, data) => setSetting("lastFmApiKey", data.value)}
                placeholder="LASTFM_API_KEY"
                style={{ flexGrow: 1 }}
              />
              <Button
                appearance="outline"
                disabled={!defaultLastFmApiKey}
                onClick={() => setSetting("lastFmApiKey", defaultLastFmApiKey)}
              >
                {t("settings.lastFmUseDefaultApiKey")}
              </Button>
            </div>
            <Caption1 className={styles.helperText}>
              {defaultLastFmApiKey ? t("settings.lastFmDefaultApiKeyDetected") : t("settings.lastFmDefaultApiKeyMissing")}
            </Caption1>
          </div>
          <div className={styles.field}>
            <Label>{t("settings.lastFmApiSecret")}</Label>
            <div className={styles.inputRow}>
              <Input
                type="password"
                value={settings.lastFmApiSecret}
                onChange={(_, data) => setSetting("lastFmApiSecret", data.value)}
                placeholder="LASTFM_API_SECRET"
                style={{ flexGrow: 1 }}
              />
              <Button
                appearance="outline"
                disabled={!defaultLastFmApiSecret}
                onClick={() => setSetting("lastFmApiSecret", defaultLastFmApiSecret)}
              >
                {t("settings.lastFmUseDefaultApiSecret")}
              </Button>
            </div>
            <Caption1 className={styles.helperText}>
              {defaultLastFmApiSecret ? t("settings.lastFmDefaultApiSecretDetected") : t("settings.lastFmDefaultApiSecretMissing")}
            </Caption1>
          </div>
          <div className={styles.field}>
            <Label>{t("settings.lastFmSessionKey")}</Label>
            <Input
              type="password"
              value={settings.lastFmSessionKey}
              onChange={(_, data) => setSetting("lastFmSessionKey", data.value)}
              placeholder="LASTFM_SESSION_KEY"
            />
          </div>
          <div className={styles.field}>
            <Label>{t("settings.lastFmUsername")}</Label>
            <Input
              value={settings.lastFmUsername}
              onChange={(_, data) => setSetting("lastFmUsername", data.value)}
              placeholder="your_lastfm_name"
            />
          </div>
          <div className={styles.rowField}>
            <Label>{t("settings.lastFmScrobbleEnabled")}</Label>
            <Switch checked={settings.lastFmScrobbleEnabled} onChange={(e) => setSetting("lastFmScrobbleEnabled", e.target.checked)} />
          </div>
          <div className={styles.field}>
            <Label>{t("settings.lastFmTitleFormatMode")}</Label>
            <Dropdown
              aria-label={t("settings.lastFmTitleFormatMode")}
              value={settings.lastFmTitleFormatMode}
              selectedOptions={[settings.lastFmTitleFormatMode]}
              inlinePopup
              onOptionSelect={(_, data) => {
                if (data.optionValue) setSetting("lastFmTitleFormatMode", data.optionValue as LastFmTitleFormatMode);
              }}
            >
              <Option value="raw">{t("settings.lastFmTitleFormatRaw")}</Option>
              <Option value="clean">{t("settings.lastFmTitleFormatClean")}</Option>
            </Dropdown>
          </div>
          {settings.lastFmTitleFormatMode === "clean" ? (
            <>
              <div className={styles.rowField}>
                <Label>{t("settings.lastFmTrimArtistPrefix")}</Label>
                <Switch checked={settings.lastFmTrimArtistPrefix} onChange={(e) => setSetting("lastFmTrimArtistPrefix", e.target.checked)} />
              </div>
              <div className={styles.rowField}>
                <Label>{t("settings.lastFmTrimFeaturingSuffix")}</Label>
                <Switch checked={settings.lastFmTrimFeaturingSuffix} onChange={(e) => setSetting("lastFmTrimFeaturingSuffix", e.target.checked)} />
              </div>
              <div className={styles.rowField}>
                <Label>{t("settings.lastFmTrimBracketTags")}</Label>
                <Switch checked={settings.lastFmTrimBracketTags} onChange={(e) => setSetting("lastFmTrimBracketTags", e.target.checked)} />
              </div>
              <div className={styles.rowField}>
                <Label>{t("settings.lastFmTrimDashTags")}</Label>
                <Switch checked={settings.lastFmTrimDashTags} onChange={(e) => setSetting("lastFmTrimDashTags", e.target.checked)} />
              </div>
            </>
          ) : null}
          <Button appearance="outline" onClick={openLastFmAuth}>
            {t("settings.lastFmOpenAuth")}
          </Button>
        </SectionCard>

              <SectionCard title={t("settings.advancedSection")}>

          <div className={styles.field}>
            <Label>{t("settings.bearerToken")}</Label>
            <Input value={settings.token} onChange={(e, data) => setSetting("token", data.value)} placeholder={t("settings.optional")} />
            <Caption1 className={styles.helperText}>{t("settings.oauthRecommended")}</Caption1>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Button onClick={handleExport} appearance="outline">{t("settings.exportSettings")}</Button>
            <Button onClick={() => fileInputRef.current?.click()} appearance="outline">{t("settings.importSettings")}</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const result = importSettings(text);
                if (result.ok) {
                  openNoticeDialog(t("settings.importSuccessTitle"), t("settings.importSuccessMessage"));
                } else {
                  openNoticeDialog(t("settings.importFailedTitle"), result.error || t("settings.importFailedMessage"));
                }
              }}
            />
          </div>

          {isResetConfirmOpen ? (
            <div className={styles.alert}>
              <Text weight="semibold">{t("settings.confirmReset")}</Text>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  size="small"
                  appearance="primary"
                  onClick={() => {
                    resetSettings();
                    instanceUrlForm.reset({ instanceUrl: "https://invidious.tsub4sa.xyz" });
                    setIsResetConfirmOpen(false);
                  }}
                >
                  {t("settings.reset")}
                </Button>
                <Button size="small" appearance="outline" onClick={() => setIsResetConfirmOpen(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          ) : (
            <Button appearance="outline" onClick={() => setIsResetConfirmOpen(true)}>{t("settings.resetSettings")}</Button>
          )}
              </SectionCard>
            </div>
          </div>

          <Dialog
            modalType="alert"
            open={noticeDialog.open}
            onOpenChange={(_, data) => setNoticeDialog((prev) => ({ ...prev, open: data.open }))}
          >
            <DialogSurface
              aria-labelledby={`${noticeDialogId}-title`}
              aria-describedby={`${noticeDialogId}-content`}
            >
              <DialogBody>
                <DialogTitle id={`${noticeDialogId}-title`}>{noticeDialog.title}</DialogTitle>
                <DialogContent id={`${noticeDialogId}-content`}>{noticeDialog.message}</DialogContent>
                <DialogActions>
                  <Button appearance="primary" onClick={() => setNoticeDialog((prev) => ({ ...prev, open: false }))}>
                    {t("common.close")}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>
      </DialogSurface>
    </Dialog>
  );
};
