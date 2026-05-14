import {
  Text,
  TabList,
  Tab,
  Button,
  makeStyles,
  tokens,
  type TabListProps,
} from "@fluentui/react-components";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPopular, getTrending } from "../lib/invidiousClient";
import { SearchBar } from "../components/SearchBar";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { VideoGrid } from "../components/VideoGrid";
import { useSettingsStore } from "../store/settingsStore";
import { useSettings } from "../hooks/useSettings";

const trendCategories = ["default", "music", "gaming", "movies"] as const;
const isTrendCategory = (value: string): value is (typeof trendCategories)[number] =>
  trendCategories.includes(value as (typeof trendCategories)[number]);

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabContent: {
    paddingTop: "20px",
  },
  trendCategoryList: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "8px",
    maxWidth: "100%",
    scrollbarWidth: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
  },
  categoryButton: {
    borderRadius: "var(--app-radius)",
    height: "36px",
    flexShrink: 0,
  },
});

export const HomePage = (): JSX.Element => {
  const styles = useStyles();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const region = useSettingsStore((state) => state.region);
  const { settings } = useSettings();
  
  const initialTab = searchParams.get("homeTab") === "popular" ? "popular" : "trending";
  const rawCategory = searchParams.get("category");
  const category = rawCategory && isTrendCategory(rawCategory) ? rawCategory : "default";

  const popularQuery = useQuery({
    queryKey: queryKeys.popular,
    queryFn: ({ signal }) => getPopular(signal),
    enabled: initialTab === "popular",
    placeholderData: (previousData) => previousData,
  });

  const trendingQuery = useQuery({
    queryKey: queryKeys.trending(category, region),
    queryFn: ({ signal }) => getTrending(category, region, signal),
    enabled: initialTab !== "popular",
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    let timeoutId = 0;
    const prefetch = () => {
      if (initialTab === "popular") {
        if (!queryClient.getQueryState(queryKeys.trending(category, region))) {
          void queryClient.prefetchQuery({
            queryKey: queryKeys.trending(category, region),
            queryFn: ({ signal }) => getTrending(category, region, signal),
          });
        }
        return;
      }

      if (!queryClient.getQueryState(queryKeys.popular)) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.popular,
          queryFn: ({ signal }) => getPopular(signal),
        });
      }
    };

    if (typeof window === "undefined") return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    timeoutId = setTimeout(prefetch, 250);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [category, initialTab, queryClient, region]);

  useEffect(() => {
    if (sessionStorage.getItem("invidious-start-page-applied") === "1") return;
    sessionStorage.setItem("invidious-start-page-applied", "1");
    if (settings.startPage === "home") return;
    if (settings.startPage === "trending") navigate("/?homeTab=trending", { replace: true });
    if (settings.startPage === "popular") navigate("/?homeTab=popular", { replace: true });
    if (settings.startPage === "subscriptions") navigate("/subscriptions", { replace: true });
    if (settings.startPage === "search") navigate("/search", { replace: true });
  }, [settings.startPage, navigate]);

  const refreshCurrentTab = async (): Promise<void> => {
    if (initialTab === "popular") {
      await popularQuery.refetch();
    } else {
      await trendingQuery.refetch();
    }
  };

  const renderPopular = (): JSX.Element => {
    if (popularQuery.isLoading) return <LoadingGrid />;
    if (popularQuery.isError) {
      return <ErrorState title="人気動画を取得できません" message="インスタンスが応答していません。" onRetry={() => popularQuery.refetch()} />;
    }
    const items = popularQuery.data ?? [];
    if (!items.length) return <EmptyState title="人気動画がありません" description="別のインスタンスを試してください。" />;
    return <VideoGrid items={items} />;
  };

  const renderTrending = (): JSX.Element => {
    if (trendingQuery.isLoading) return <LoadingGrid />;
    if (trendingQuery.isError) {
      return <ErrorState title="トレンドを取得できません" message="トレンドの取得に失敗しました。" onRetry={() => trendingQuery.refetch()} />;
    }
    const items = trendingQuery.data ?? [];
    if (!items.length) return <EmptyState title="トレンドがありません" description="カテゴリを変更して再試行してください。" />;
    return <VideoGrid items={items} />;
  };

  const onTabSelect: TabListProps["onTabSelect"] = (_, data) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("homeTab", data.value as string);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className="mobile-search-wrap" style={{ display: "none" }}>
        <SearchBar />
      </div>

      <div className={styles.header}>
        <Text size={700} weight="bold">
          ホーム
        </Text>
        <Button
          icon={<ArrowClockwise24Regular />}
          title="更新"
          aria-label="更新"
          appearance="subtle"
          onClick={() => void refreshCurrentTab()}
        />
      </div>

      <TabList selectedValue={initialTab} onTabSelect={onTabSelect}>
        <Tab value="popular">人気動画</Tab>
        <Tab value="trending">トレンド</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {initialTab === "popular" ? (
          renderPopular()
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className={styles.trendCategoryList}>
              {trendCategories.map((cat) => (
                <Button
                  key={cat}
                  appearance={category === cat ? "primary" : "outline"}
                  className={styles.categoryButton}
                  onClick={() => {
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("category", cat);
                      next.set("homeTab", "trending");
                      return next;
                    });
                  }}
                >
                  {cat}
                </Button>
              ))}
            </div>
            {renderTrending()}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .mobile-search-wrap { display: block !important; }
        }
      `}</style>
    </div>
  );
};
