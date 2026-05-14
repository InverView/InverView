import {
  makeStyles,
  tokens,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavDivider,
  mergeClasses,
  AppItem,
  Hamburger,
  Tooltip,
} from "@fluentui/react-components";
import {
  Home24Regular,
  Home24Filled,
  Flash24Regular,
  Flash24Filled,
  Star24Regular,
  Star24Filled,
  History24Regular,
  History24Filled,
  Tv24Regular,
  Tv24Filled,
  Library24Regular,
  Library24Filled,
  Settings24Regular,
  Settings24Filled,
  VideoClip24Regular,
  VideoClip24Filled,
  Navigation24Regular,
  Play24Filled,
  bundleIcon,
} from "@fluentui/react-icons";
import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { withViewTransition } from "../lib/webPlatform";

interface SidebarProps {
  mobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const HomeIcon = bundleIcon(Home24Filled, Home24Regular);
const TrendingIcon = bundleIcon(Flash24Filled, Flash24Regular);
const ShortsIcon = bundleIcon(VideoClip24Filled, VideoClip24Regular);
const PopularIcon = bundleIcon(Star24Filled, Star24Regular);
const HistoryIcon = bundleIcon(History24Filled, History24Regular);
const SubscriptionsIcon = bundleIcon(Tv24Filled, Tv24Regular);
const PlaylistsIcon = bundleIcon(Library24Filled, Library24Regular);
const SettingsIcon = bundleIcon(Settings24Filled, Settings24Regular);

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    height: "100%",
    backgroundColor: "#0a0a0a",
  },
  nav: {
    height: "100%",
    width: "var(--sidebar-width-expanded)",
    minWidth: "unset",
    borderRight: "none",
    transition: "var(--sidebar-transition)",
    backgroundColor: "#0a0a0a",
  },
  collapsed: {
    width: "var(--sidebar-width-collapsed)",
  },
  navBody: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "0 !important",
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
  },
  topSection: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "8px 12px",
    transition: "padding 0.2s ease",
  },
  topSectionCollapsed: {
    padding: "14px 8px 8px 8px",
  },
  bottomSection: {
    padding: "0 12px 12px 12px",
    flexShrink: 0,
    transition: "padding 0.2s ease",
  },
  bottomSectionCollapsed: {
    padding: "0 8px 12px 8px",
  },
  navItem: {
    height: "44px",
    marginBottom: "2px",
    borderRadius: "8px",
    position: "relative",
    color: "#ffffff",
    transform: "translateX(0)",
    transition: "background-color 0.18s ease, transform 0.18s ease",
    animationName: {
      from: { opacity: 0, transform: "translateX(-8px)" },
      to: { opacity: 1, transform: "translateX(0)" },
    },
    animationDuration: "260ms",
    animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    animationFillMode: "both",
    "& .fui-NavItem__content": {
      marginLeft: "16px",
      fontSize: "14px",
      fontWeight: tokens.fontWeightSemibold,
      whiteSpace: "nowrap",
      color: "#ffffff",
    },
    "& .fui-NavItem__icon": {
      fontSize: "24px",
      width: "24px",
      height: "24px",
      color: "#ffffff",
      flexShrink: 0,
    },
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      transform: "translateX(2px)",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      left: "-12px",
      top: "10px",
      bottom: "10px",
      width: "4px",
      backgroundColor: tokens.colorCompoundBrandForeground1,
      borderRadius: "0 4px 4px 0",
      opacity: 0,
      transition: "opacity 0.2s ease",
    },
    "&.fui-NavItem--selected": {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      "& .fui-NavItem__content": {
        color: "#ffffff",
        fontWeight: tokens.fontWeightBold,
      },
      "& .fui-NavItem__icon": {
        color: "#ffffff",
        fontSize: "24px", // Ensure size remains 24px
      },
    },
    "&.fui-NavItem--selected::before": {
      opacity: 1,
    },
  },
  navItemCollapsed: {
    justifyContent: "center",
    padding: "0 !important",
    "& .fui-NavItem__content": {
      display: "none",
    },
    "& .fui-NavItem__icon": {
      margin: "0 !important",
    },
    "&::before, &.fui-NavItem--selected::before": {
      opacity: 0,
    },
    "&::after, &.fui-NavItem--selected::after": {
      content: "none",
      display: "none",
    },
  },
  divider: {
    margin: "8px 0",
    "&::before": {
      backgroundColor: "rgba(255, 255, 255, 0.1) !important",
    },
  },
});

export const Sidebar = ({
  mobile = false,
  isOpen = false,
  onClose,
}: SidebarProps): JSX.Element => {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const favoriteChannelIds = settings.favoriteShortsChannelIds;

  const isCollapsed = !mobile && settings.sidebarCollapsed;

  const selectedKey = location.pathname + location.search;

  const handleNavigate = (event: MouseEvent<HTMLElement>, value: string) => {
    event.preventDefault();
    const navState = value === "/settings" ? { state: { backgroundLocation: location } } : undefined;
    withViewTransition(() => navigate(value, navState));
    if (mobile) onClose?.();
  };

  const navItems = [
    { icon: <HomeIcon />, label: "ホーム", value: "/" },
    { icon: <TrendingIcon />, label: "トレンド", value: "/?homeTab=trending" },
    { icon: <ShortsIcon />, label: "ショート", value: "/shorts" },
    ...(favoriteChannelIds.length > 0
      ? [{ icon: <Star24Regular />, label: "推し巡回", value: `/shorts?authorId=${favoriteChannelIds.join(",")}&shuffle=1` }]
      : []),
    { icon: <PopularIcon />, label: "人気", value: "/?homeTab=popular" },
    { icon: <HistoryIcon />, label: "履歴", value: "/history" },
    { icon: <SubscriptionsIcon />, label: "登録済み", value: "/subscriptions" },
    { icon: <PlaylistsIcon />, label: "プレイリスト", value: "/playlists" },
  ];

  return (
    <NavDrawer
      open={mobile ? isOpen : true}
      type={mobile ? "overlay" : "inline"}
      selectedValue={selectedKey}
      className={mergeClasses(styles.nav, isCollapsed && styles.collapsed)}
      onOpenChange={(_, data) => {
        if (!data.open && mobile) onClose?.();
      }}
    >
      <NavDrawerBody className={styles.navBody}>
        <div className={mergeClasses(styles.topSection, isCollapsed && styles.topSectionCollapsed)}>
          {navItems.map((item, index) => (
            <NavItem
              key={item.value}
              icon={item.icon}
              value={item.value}
              onClick={(event) => handleNavigate(event, item.value)}
              aria-label={item.label}
              title={item.label}
              className={mergeClasses(styles.navItem, isCollapsed && styles.navItemCollapsed)}
              style={{ animationDelay: `${index * 28}ms` }}
            >
              {!isCollapsed ? item.label : null}
            </NavItem>
          ))}
        </div>

        <div className={mergeClasses(styles.bottomSection, isCollapsed && styles.bottomSectionCollapsed)}>
          <NavDivider className={styles.divider} />
          <NavItem
            icon={<SettingsIcon />}
            value="/settings"
            onClick={(event) => handleNavigate(event, "/settings")}
            aria-label="設定"
            title="設定"
            className={mergeClasses(styles.navItem, isCollapsed && styles.navItemCollapsed)}
          >
            {!isCollapsed ? "設定" : null}
          </NavItem>
        </div>
      </NavDrawerBody>
    </NavDrawer>
  );
};
