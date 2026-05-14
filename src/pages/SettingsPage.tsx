import {
  makeStyles,
  tokens,
  Text,
  Input,
  Switch,
  Select,
  Button,
  Label,
  Card,
  CardHeader,
  Caption1,
  Slider,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings } from "../hooks/useSettings";
import type { AccentColor, AnimationStrength, CompanionMode, CornerRadius, QualityMode, StartPage, ThemeMode, UiDensity } from "../hooks/useSettings";
import { clearRecentSearches } from "../lib/recentSearch";
import { clearWatchHistory } from "../lib/watchHistory";
import { createLocalUser, getCurrentLocalUser, getLocalUsers, setCurrentLocalUser } from "../lib/localUsers";

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const instanceUrlSchema = z.object({
  instanceUrl: z.string().trim().refine((value) => isValidHttpUrl(value), "有効なURLを入力してください（http/https）。"),
});

type InstanceUrlFormValues = z.infer<typeof instanceUrlSchema>;

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  overlaySurface: {
    width: "min(92vw, 760px)",
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
    "@media (min-width: 1200px)": {
      gridTemplateColumns: "1fr 1fr",
    },
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
  },
  inputRow: {
    display: "flex",
    gap: "8px",
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
  const navigate = useNavigate();
  const { settings, setSetting, resetSettings, exportSettings, importSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const openNoticeDialog = (title: string, message: string): void => {
    setNoticeDialog({ open: true, title, message });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setSetting("token", token);
      // URLからトークンを削除してクリーンにする
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      openNoticeDialog("ログイン成功", "Invidious ログインに成功しました。");
    }
  }, []);

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
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <Dialog open onOpenChange={(_, data) => { if (!data.open) closeSettingsOverlay(); }}>
      <DialogSurface className={styles.overlaySurface}>
        <div className={styles.overlayBody}>
          <div className={styles.titleRow}>
            <Text size={700} weight="bold">設定</Text>
            <Button appearance="subtle" onClick={closeSettingsOverlay}>閉じる</Button>
          </div>

          <div className={styles.container}>
            <div className={styles.grid}>
              <SectionCard title="一般">
          <div className={styles.field}>
            <Label>インスタンスURL</Label>
            <div className={styles.inputRow}>
              <Input
                style={{ flexGrow: 1 }}
                value={instanceUrlForm.watch("instanceUrl")}
                onChange={(_, data) => instanceUrlForm.setValue("instanceUrl", data.value, { shouldValidate: false })}
              />
              <Button onClick={applyInstanceUrl} appearance="primary">適用</Button>
            </div>
            {instanceUrlForm.formState.errors.instanceUrl?.message ? (
              <Caption1 className={styles.errorText}>{instanceUrlForm.formState.errors.instanceUrl.message}</Caption1>
            ) : (
              <Caption1 className={styles.helperText}>既定値: https://invidious.tsub4sa.xyz</Caption1>
            )}
          </div>

          <div className={styles.field}>
            <Label>地域</Label>
            <Select value={settings.region} onChange={(e) => setSetting("region", e.target.value)}>
              {["JP","US","KR","GB","DE","FR","TW","CA","AU"].map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </Select>
          </div>

          <div className={styles.field}>
            <Label>推しチャンネル (ショート巡回用)</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
              {settings.favoriteShortsChannelIds.map((id) => (
                <div key={id} className={styles.inputRow}>
                  <Input value={id} readOnly style={{ flexGrow: 1 }} />
                  <Button 
                    onClick={() => removeFavoriteChannel(id)}
                    appearance="subtle"
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
            <div className={styles.inputRow}>
              <Input
                style={{ flexGrow: 1 }}
                value={newChannelId}
                onChange={(e, data) => setNewChannelId(data.value)}
                placeholder="追加するチャンネルID (UC...)"
              />
              <Button onClick={addFavoriteChannel} appearance="primary">追加</Button>
            </div>
            <Button 
              style={{ marginTop: "8px" }}
              disabled={settings.favoriteShortsChannelIds.length === 0}
              onClick={playFavoriteShorts}
              appearance="outline"
            >
              一括シャッフル再生 ({settings.favoriteShortsChannelIds.length} チャンネル)
            </Button>
            <Caption1 className={styles.helperText}>
              指定した複数のチャンネルの動画を混ぜてシャッフル再生します。
            </Caption1>
          </div>

          <div className={styles.field}>
            <Label>最初に表示するページ</Label>
            <Select value={settings.startPage} onChange={(e) => setSetting("startPage", e.target.value as StartPage)}>
              <option value="home">Home</option>
              <option value="trending">Trending</option>
              <option value="popular">Popular</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="search">Search</option>
            </Select>
          </div>

          <div className={styles.field}>
            <Label>テーマ</Label>
            <Select value={settings.theme} onChange={(e) => setSetting("theme", e.target.value as ThemeMode)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="amoled">Amoled</option>
            </Select>
          </div>

          <div className={styles.rowField}>
            <Label>Amoled 強制有効</Label>
            <Switch checked={settings.amoledEnabled} onChange={(e) => setSetting("amoledEnabled", e.target.checked)} />
          </div>

          <div className={styles.field}>
            <Label>角の丸み</Label>
            <Select value={settings.cornerRadius} onChange={(e) => setSetting("cornerRadius", e.target.value as CornerRadius)}>
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </Select>
          </div>
        </SectionCard>

              <SectionCard title="履歴と検索">
          <div className={styles.rowField}>
            <Label>視聴履歴を保存</Label>
            <Switch checked={settings.saveWatchHistory} onChange={(e) => setSetting("saveWatchHistory", e.target.checked)} />
          </div>
          <div className={styles.rowField}>
            <Label>検索候補を表示</Label>
            <Switch checked={settings.showSearchSuggestions} onChange={(e) => setSetting("showSearchSuggestions", e.target.checked)} />
          </div>

          {isClearHistoryConfirmOpen ? (
            <div className={styles.alert}>
              <Text weight="semibold">視聴履歴をすべて削除しますか？</Text>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="small" appearance="primary" onClick={() => { clearWatchHistory(); setIsClearHistoryConfirmOpen(false); }}>削除</Button>
                <Button size="small" appearance="outline" onClick={() => setIsClearHistoryConfirmOpen(false)}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <Button appearance="outline" onClick={() => setIsClearHistoryConfirmOpen(true)}>視聴履歴を削除</Button>
          )}

          {isClearSearchConfirmOpen ? (
            <div className={styles.alert}>
              <Text weight="semibold">検索履歴をすべて削除しますか？</Text>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="small" appearance="primary" onClick={() => { clearRecentSearches(); setIsClearSearchConfirmOpen(false); }}>削除</Button>
                <Button size="small" appearance="outline" onClick={() => setIsClearSearchConfirmOpen(false)}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <Button appearance="outline" onClick={() => setIsClearSearchConfirmOpen(true)}>検索履歴を削除</Button>
          )}
        </SectionCard>

              <SectionCard title="再生">
          <div className={styles.rowField}><Label>動画を自動再生</Label><Switch checked={settings.autoplay} onChange={(e) => setSetting("autoplay", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>常にループ</Label><Switch checked={settings.loopVideo} onChange={(e) => setSetting("loopVideo", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>動画プロキシ優先</Label><Switch checked={settings.useProxyVideo} onChange={(e) => setSetting("useProxyVideo", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>再生位置を記憶</Label><Switch checked={settings.rememberPlaybackPosition} onChange={(e) => setSetting("rememberPlaybackPosition", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>ミニプレイヤー</Label><Switch checked={settings.miniPlayer} onChange={(e) => setSetting("miniPlayer", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>最初からシアターモード</Label><Switch checked={settings.theaterMode} onChange={(e) => setSetting("theaterMode", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>次の動画を自動再生</Label><Switch checked={settings.autoplayNextVideo} onChange={(e) => setSetting("autoplayNextVideo", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>最初から字幕表示</Label><Switch checked={settings.showCaptionsByDefault} onChange={(e) => setSetting("showCaptionsByDefault", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>オリジナル翻訳を優先</Label><Switch checked={settings.preferOriginalTranslation} onChange={(e) => setSetting("preferOriginalTranslation", e.target.checked)} /></div>

          <div className={styles.field}>
            <Label>画質</Label>
            <Select value={settings.quality} onChange={(e) => setSetting("quality", e.target.value as QualityMode)}>
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </Select>
          </div>

          <div className={styles.rowField}><Label>音声のみモード</Label><Switch checked={settings.audioOnly} onChange={(e) => setSetting("audioOnly", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>データ節約モード</Label><Switch checked={settings.dataSaver} onChange={(e) => setSetting("dataSaver", e.target.checked)} /></div>
        </SectionCard>

              <SectionCard title="Watch画面">
          <div className={styles.rowField}><Label>最初から説明を展開</Label><Switch checked={settings.expandDescriptionByDefault} onChange={(e) => setSetting("expandDescriptionByDefault", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>最初からチャプターを展開</Label><Switch checked={settings.expandChaptersByDefault} onChange={(e) => setSetting("expandChaptersByDefault", e.target.checked)} /></div>
          <div className={styles.rowField}><Label>最初からコメント展開</Label><Switch checked={settings.expandCommentsByDefault} onChange={(e) => setSetting("expandCommentsByDefault", e.target.checked)} /></div>
        </SectionCard>

              <SectionCard title="外観">
          <div className={styles.field}>
            <Label>アクセントカラー</Label>
            <Select value={settings.accentColor} onChange={(e) => setSetting("accentColor", e.target.value as AccentColor)}>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
              <option value="purple">Purple</option>
              <option value="green">Green</option>
              <option value="orange">Orange</option>
              <option value="pink">Pink</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          {settings.accentColor === "custom" ? (
            <div className={styles.field}>
              <Label>カスタムカラー</Label>
              <Input value={settings.customAccentColor} onChange={(e, data) => setSetting("customAccentColor", data.value)} />
            </div>
          ) : null}

          <div className={styles.field}>
            <Label>カード透明度 ({settings.cardOpacity.toFixed(2)})</Label>
            <Slider
              min={0.2}
              max={1}
              step={0.05}
              value={settings.cardOpacity}
              onChange={(_, data) => setSetting("cardOpacity", data.value)}
            />
          </div>
          <div className={styles.field}>
            <Label>影の強さ ({settings.shadowStrength.toFixed(2)})</Label>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={settings.shadowStrength}
              onChange={(_, data) => setSetting("shadowStrength", data.value)}
            />
          </div>

          <div className={styles.field}>
            <Label>UI密度</Label>
            <Select value={settings.uiDensity} onChange={(e) => setSetting("uiDensity", e.target.value as UiDensity)}>
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="comfortable">Comfortable</option>
            </Select>
          </div>

          <div className={styles.field}>
            <Label>サムネイル角丸 ({settings.thumbnailRadius}px)</Label>
            <Slider
              min={0}
              max={40}
              value={settings.thumbnailRadius}
              onChange={(_, data) => setSetting("thumbnailRadius", data.value)}
            />
          </div>

          <div className={styles.field}>
            <Label>プレイヤー角丸 ({settings.playerRadius}px)</Label>
            <Slider
              min={0}
              max={40}
              value={settings.playerRadius}
              onChange={(_, data) => setSetting("playerRadius", data.value)}
            />
          </div>

          <div className={styles.field}>
            <Label>下部ナビ透明度 ({settings.bottomNavOpacity.toFixed(2)})</Label>
            <Slider
              min={0.25}
              max={1}
              step={0.05}
              value={settings.bottomNavOpacity}
              onChange={(_, data) => setSetting("bottomNavOpacity", data.value)}
            />
          </div>

          <div className={styles.rowField}><Label>PCサイドバーを表示</Label><Switch checked={settings.showDesktopSidebar} onChange={(e) => setSetting("showDesktopSidebar", e.target.checked)} /></div>
          <div className={styles.field}>
            <Label>PC最大幅 ({settings.maxContentWidth}px)</Label>
            <Slider
              min={960}
              max={1920}
              step={10}
              value={settings.maxContentWidth}
              onChange={(_, data) => setSetting("maxContentWidth", data.value)}
            />
          </div>

          <div className={styles.field}>
            <Label>アニメーション強度</Label>
            <Select value={settings.animationStrength} onChange={(e) => setSetting("animationStrength", e.target.value as AnimationStrength)}>
              <option value="off">Off</option>
              <option value="reduced">Reduced</option>
              <option value="normal">Normal</option>
            </Select>
          </div>
          <div className={styles.rowField}>
            <Label>Lenis.js を使う</Label>
            <Switch checked={settings.useLenis} onChange={(e) => setSetting("useLenis", e.target.checked)} />
          </div>
        </SectionCard>

              <SectionCard title="アカウント">
          <Text size={200} className={styles.helperText}>
            OAuth2 を使わず、ローカルユーザーでもチャンネル登録を保存できます。
          </Text>
          <div className={styles.field}>
            <Label>ローカルユーザー</Label>
            <Select value={currentLocalUser.id} onChange={(e) => switchUser(e.target.value)}>
              {localUsers.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </Select>
            <div className={styles.inputRow}>
              <Input
                value={newLocalUserName}
                onChange={(_, data) => setNewLocalUserName(data.value)}
                placeholder="新規ユーザー名"
                style={{ flexGrow: 1 }}
              />
              <Button appearance="outline" onClick={createUser}>追加</Button>
            </div>
            <Caption1 className={styles.helperText}>
              現在のユーザー: {currentLocalUser.name}
            </Caption1>
          </div>
          {settings.token ? (
            <div className={styles.alert} style={{ backgroundColor: tokens.colorStatusSuccessBackground1, borderColor: tokens.colorStatusSuccessBorder1 }}>
              <Text weight="semibold">ログイン済み</Text>
              <Caption1>トークンが設定されています。</Caption1>
              <Button appearance="outline" onClick={() => setSetting("token", "")}>ログアウト</Button>
            </div>
          ) : (
            <Button appearance="primary" onClick={handleInvidiousLogin}>Invidious でログイン (OAuth2)</Button>
          )}
        </SectionCard>

              <SectionCard title="Invidious Companion">
          <Text size={200} className={styles.helperText}>
            動画の復号化とプロキシを行う外部サーバーの設定です。再生エラーが発生する場合に使用してください。
          </Text>
          <div className={styles.field}>
            <Label>Companion モード</Label>
            <Select 
              value={settings.companionMode} 
              onChange={(e) => {
                const mode = e.target.value as CompanionMode;
                setSetting("companionMode", mode);
                if (mode === "default") {
                  setSetting("companionUrl", import.meta.env.VITE_COMPANION_URL || "https://companion.tsub4sa.xyz");
                  setSetting("companionSecret", import.meta.env.VITE_COMPANION_SECRET || "");
                }
              }}
            >
              <option value="default">Default (インスタンス推奨)</option>
              <option value="custom">カスタム (自前サーバー等)</option>
            </Select>
          </div>
          
          <div className={styles.field}>
            <Label>Companion URL</Label>
            <Input
              value={settings.companionUrl}
              onChange={(e, data) => setSetting("companionUrl", data.value)}
              disabled={settings.companionMode !== "custom"}
              placeholder="https://companion.example.com"
            />
          </div>
          <div className={styles.field}>
            <Label>Secret Key (Bearer Token)</Label>
            <Input
              type="password"
              value={settings.companionSecret}
              onChange={(e, data) => setSetting("companionSecret", data.value)}
              disabled={settings.companionMode !== "custom"}
              placeholder="YOURSECRETKEY"
            />
          </div>
        </SectionCard>

              <SectionCard title="詳細設定">

          <div className={styles.field}>
            <Label>Bearer Token</Label>
            <Input value={settings.token} onChange={(e, data) => setSetting("token", data.value)} placeholder="任意" />
            <Caption1 className={styles.helperText}>通常は「アカウント」セクションの OAuth ログインを推奨します。</Caption1>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Button onClick={handleExport} appearance="outline">設定を書き出し</Button>
            <Button onClick={() => fileInputRef.current?.click()} appearance="outline">設定を読み込み</Button>
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
                  openNoticeDialog("読み込み成功", "設定を読み込みました。");
                } else {
                  openNoticeDialog("読み込み失敗", result.error || "設定を読み込めませんでした。");
                }
              }}
            />
          </div>

          {isResetConfirmOpen ? (
            <div className={styles.alert}>
              <Text weight="semibold">設定を初期化しますか？</Text>
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
                  初期化
                </Button>
                <Button size="small" appearance="outline" onClick={() => setIsResetConfirmOpen(false)}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <Button appearance="outline" onClick={() => setIsResetConfirmOpen(true)}>設定を初期化</Button>
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
                    閉じる
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
