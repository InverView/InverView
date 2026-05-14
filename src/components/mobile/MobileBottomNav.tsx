import { Text, makeStyles, tokens } from "@fluentui/react-components";
import {
  Home24Regular,
  Home24Filled,
  Search24Regular,
  Search24Filled,
  Flash24Regular,
  Flash24Filled,
  Star24Regular,
  Star24Filled,
  VideoClip24Regular,
  VideoClip24Filled,
  bundleIcon,
} from "@fluentui/react-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { withViewTransition } from "../../lib/webPlatform";

interface MobileBottomNavProps {
  onOpenSearch: () => void;
}

const HomeIcon = bundleIcon(Home24Filled, Home24Regular);
const SearchIcon = bundleIcon(Search24Filled, Search24Regular);
const TrendingIcon = bundleIcon(Flash24Filled, Flash24Regular);
const SubscriptionsIcon = bundleIcon(Star24Filled, Star24Regular);
const ShortsIcon = bundleIcon(VideoClip24Filled, VideoClip24Regular);

type NavItem = {
  key: string;
  label: string;
  to?: string;
  action?: "search";
  icon: any;
};

const items: NavItem[] = [
  { key: "home", label: "ホーム", to: "/", icon: HomeIcon },
  { key: "search", label: "検索", action: "search", icon: SearchIcon },
  { key: "trending", label: "トレンド", to: "/?homeTab=trending", icon: TrendingIcon },
  { key: "shorts", label: "ショート", to: "/shorts", icon: ShortsIcon },
  { key: "subscriptions", label: "登録", to: "/subscriptions", icon: SubscriptionsIcon },
];

const useStyles = makeStyles({
  nav: {
    display: "block",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    backdropFilter: "blur(14px)",
    paddingBottom: "env(safe-area-inset-bottom)",
    "@media (min-width: 768px)": {
      display: "none",
    },
  },
  container: {
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 0",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    minWidth: "64px",
    cursor: "pointer",
    textDecorationLine: "none",
    background: "none",
    border: "none",
    padding: 0,
    color: tokens.colorNeutralForeground3,
    transition: "color 150ms ease",
  },
  itemActive: {
    color: tokens.colorBrandForeground1,
  },
  icon: {
    fontSize: "24px",
  },
  label: {
    fontSize: "10px",
  },
});

export const MobileBottomNav = ({ onOpenSearch }: MobileBottomNavProps): JSX.Element => {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (key: string): boolean => {
    if (key === "home") {
      return location.pathname === "/" && !location.search.includes("homeTab=trending");
    }
    if (key === "trending") {
      return location.pathname === "/" && location.search.includes("homeTab=trending");
    }
    if (key === "shorts") {
      return location.pathname.startsWith("/shorts");
    }
    if (key === "subscriptions") return location.pathname.startsWith("/subscriptions");
    if (key === "settings") return location.pathname.startsWith("/settings");
    if (key === "search") return location.pathname.startsWith("/search");
    return false;
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {items.map((item) => {
          const active = isActive(item.key);
          const Icon = item.icon;

          if (item.action === "search") {
            return (
              <button
                key={item.key}
                className={`${styles.item} ${active ? styles.itemActive : ""}`}
                onClick={onOpenSearch}
              >
                <Icon className={styles.icon} />
                <Text className={styles.label}>{item.label}</Text>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              className={`${styles.item} ${active ? styles.itemActive : ""}`}
              onClick={() => withViewTransition(() => navigate(item.to || "/"))}
            >
              <Icon className={styles.icon} />
              <Text className={styles.label}>{item.label}</Text>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
