import { useState } from "react";
import {
  Text,
  makeStyles,
  tokens,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemRadio,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  WeatherSunny24Regular,
  WeatherMoon24Regular,
  Settings24Regular,
  Globe24Regular,
  VideoClip24Regular,
  Open24Regular,
  Navigation24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { useSettings } from "../hooks/useSettings";
import { withViewTransition } from "../lib/webPlatform";
import type { ThemeMode, QualityMode } from "../hooks/useSettings";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    height: "46px",
    position: "relative",
    zIndex: 20,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "#0f6cbd",
    color: "#ffffff",
    padding: "0 24px 0 16px",
    boxSizing: "border-box",
    flexShrink: 0,
    WebkitAppRegion: "drag",
    appRegion: "drag",
    "@media (max-width: 767px)": {
      display: "none",
    },
  },
  container: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    width: "100%",
  },
  sidebarToggle: {
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
    color: "#ffffff !important",
    "& i, & svg": {
      color: "#ffffff !important",
    },
  },
  logoLink: {
    textDecorationLine: "none",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
    ":hover": {
      opacity: 0.8,
      color: "#ffffff",
    },
  },
  searchBarWrap: {
    flexGrow: 1,
    maxWidth: "720px",
    margin: "0 auto",
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
  },
  actions: {
    display: "flex",
    gap: "4px",
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
    "& button, & i, & svg": {
      color: "#ffffff !important",
    },
  },
});

export const Header = (): JSX.Element => {
  const styles = useStyles();
  const location = useLocation();
  const { search } = location;
  const navigate = useNavigate();
  const { settings, setSetting } = useSettings();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const initialQ = new URLSearchParams(search).get("q") ?? "";

  const onThemeChange = (_e: any, data: any) => {
    setSetting("theme", data.checkedItems[0] as ThemeMode);
  };

  const onQualityChange = (_e: any, data: any) => {
    setSetting("quality", data.checkedItems[0] as QualityMode);
  };

  const onRegionChange = (_e: any, data: any) => {
    setSetting("region", data.checkedItems[0] as string);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Button
          className={styles.sidebarToggle}
          appearance="subtle"
          icon={<Navigation24Regular />}
          title={settings.sidebarCollapsed ? "サイドバーを展開" : "サイドバーを最小化"}
          aria-label={settings.sidebarCollapsed ? "サイドバーを展開" : "サイドバーを最小化"}
          onClick={() => setSetting("sidebarCollapsed", !settings.sidebarCollapsed)}
        />
        <Link to="/" className={styles.logoLink}>
          <Text size={500} weight="bold" style={{ letterSpacing: "0.5px" }}>
            InverView
          </Text>
        </Link>
        <div className={styles.searchBarWrap}>
          <SearchBar initialQuery={initialQ} />
        </div>
        <div className={styles.actions}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<Settings24Regular />}
                title="設定メニュー"
                aria-label="設定メニュー"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuGroup>
                  <MenuGroupHeader>外観</MenuGroupHeader>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <MenuItem icon={settings.theme === "dark" ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}>
                        テーマ: {settings.theme}
                      </MenuItem>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList
                        checkedValues={{ theme: [settings.theme] }}
                        onCheckedValueChange={onThemeChange}
                      >
                        <MenuItemRadio name="theme" value="system">System</MenuItemRadio>
                        <MenuItemRadio name="theme" value="light">Light</MenuItemRadio>
                        <MenuItemRadio name="theme" value="dark">Dark</MenuItemRadio>
                        <MenuItemRadio name="theme" value="amoled">Amoled</MenuItemRadio>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </MenuGroup>

                <MenuGroup>
                  <MenuGroupHeader>再生</MenuGroupHeader>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <MenuItem icon={<VideoClip24Regular />}>
                        画質: {settings.quality}
                      </MenuItem>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList
                        checkedValues={{ quality: [settings.quality] }}
                        onCheckedValueChange={onQualityChange}
                      >
                        <MenuItemRadio name="quality" value="auto">Auto</MenuItemRadio>
                        <MenuItemRadio name="quality" value="1080p">1080p</MenuItemRadio>
                        <MenuItemRadio name="quality" value="720p">720p</MenuItemRadio>
                        <MenuItemRadio name="quality" value="480p">480p</MenuItemRadio>
                        <MenuItemRadio name="quality" value="360p">360p</MenuItemRadio>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <MenuItem icon={<Globe24Regular />}>
                        地域: {settings.region}
                      </MenuItem>
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList
                        checkedValues={{ region: [settings.region] }}
                        onCheckedValueChange={onRegionChange}
                      >
                        {["JP", "US", "KR", "GB", "DE", "FR", "TW"].map((r) => (
                          <MenuItemRadio key={r} name="region" value={r}>{r}</MenuItemRadio>
                        ))}
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </MenuGroup>

                <MenuDivider />
                <MenuItem
                  icon={<Open24Regular />}
                  onClick={() => withViewTransition(() => navigate("/settings", { state: { backgroundLocation: location } }))}
                >
                  すべての設定を表示
                </MenuItem>
                <MenuItem
                  icon={<Info24Regular />}
                  onClick={() => setIsAboutOpen(true)}
                >
                  InverViewについて
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      <Dialog open={isAboutOpen} onOpenChange={(_, data) => setIsAboutOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>InverViewについて</DialogTitle>
            <DialogContent>
              InverView は Invidious 互換の動画クライアントです。<br />
              PWA と各種 Web API に対応し、軽量で快適な視聴体験を目指しています。
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setIsAboutOpen(false)}>
                閉じる
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </header>
  );
};
