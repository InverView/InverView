import {
  Hamburger,
  Button,
  Text,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Search24Regular,
  Search24Filled,
  WeatherSunny24Regular,
  WeatherSunny24Filled,
  WeatherMoon24Regular,
  WeatherMoon24Filled,
  bundleIcon,
} from "@fluentui/react-icons";
import { useSettings } from "../../hooks/useSettings";

interface MobileHeaderProps {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  showHomeTitle?: boolean;
}

const SearchIcon = bundleIcon(Search24Filled, Search24Regular);
const SunnyIcon = bundleIcon(WeatherSunny24Filled, WeatherSunny24Regular);
const MoonIcon = bundleIcon(WeatherMoon24Filled, WeatherMoon24Regular);

const useStyles = makeStyles({
  header: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 35,
    height: "46px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "#0f6cbd",
    color: "#ffffff",
    backdropFilter: "blur(12px)",
    padding: "0 16px",
    flexShrink: 0,
    WebkitAppRegion: "drag",
    appRegion: "drag",
    "@media (min-width: 768px)": {
      display: "none",
    },
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
  },
  containerNoTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftActions: {
    display: "flex",
    alignItems: "center",
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
    "& button, & i, & svg": {
      color: "#ffffff !important",
    },
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "10px",
    lineHeight: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  title: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "18px",
    lineHeight: "22px",
  },
  rightActions: {
    display: "flex",
    gap: "4px",
    justifySelf: "end",
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
    "& button, & i, & svg": {
      color: "#ffffff !important",
    },
  },
});

export const MobileHeader = ({
  onOpenMenu,
  onOpenSearch,
  showHomeTitle = false,
}: MobileHeaderProps): JSX.Element => {
  const styles = useStyles();
  const { settings, updateSettings } = useSettings();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  };

  const isDark = settings.theme === "dark" || settings.theme === "amoled";

  return (
    <header className={styles.header}>
      <div className={showHomeTitle ? styles.container : styles.containerNoTitle}>
        <div className={styles.leftActions}>
          <Tooltip content="メニュー" relationship="label">
            <Hamburger onClick={onOpenMenu} />
          </Tooltip>
        </div>
        {showHomeTitle ? (
          <div className={styles.titleArea}>
            <Text className={styles.subtitle}>Discover</Text>
            <Text className={styles.title}>ホーム</Text>
          </div>
        ) : null}
        <div className={styles.rightActions}>
          <Tooltip content="検索" relationship="label">
            <Button icon={<SearchIcon />} appearance="subtle" onClick={onOpenSearch} />
          </Tooltip>
          <Tooltip content="テーマ切替" relationship="label">
            <Button
              icon={isDark ? <SunnyIcon /> : <MoonIcon />}
              appearance="subtle"
              onClick={toggleTheme}
            />
          </Tooltip>
        </div>
      </div>
    </header>
  );
};
