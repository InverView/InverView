import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Checkbox,
  Combobox,
  Option,
} from "@fluentui/react-components";
import { Filter24Regular } from "@fluentui/react-icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { MobileFilterSheet, type SearchFilterValues } from "../components/mobile/MobileFilterSheet";
import { VideoGrid } from "../components/VideoGrid";
import { searchVideos, type SearchVideosParams } from "../lib/invidiousClient";
import { queryKeys } from "../lib/queryKeys";
import { addRecentSearch } from "../lib/recentSearch";
import { useSettingsStore } from "../store/settingsStore";
import { useEffect, useMemo, useState } from "react";

const featureOptions = ["hd", "subtitles", "4k", "live", "360", "hdr", "vr180"] as const;

const buildFiltersFromQuery = (query: URLSearchParams, fallbackRegion: string): SearchFilterValues => ({
  type: (query.get("type") as SearchFilterValues["type"]) || "all",
  sortBy: (query.get("sort") as SearchFilterValues["sortBy"]) || "relevance",
  duration: (query.get("duration") as SearchFilterValues["duration"]) || "",
  features: (query.get("features") || "").split(",").filter(Boolean),
  region: query.get("region") || fallbackRegion,
});

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  searchForm: {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    "@media (min-width: 900px)": {
      gridTemplateColumns: "repeat(5, 1fr)",
    },
  },
  filterField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  filterSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  featuresRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    padding: "8px 0",
  },
  mobileFilterBtn: {
    "@media (min-width: 1024px)": {
      display: "none",
    },
  },
  desktopFilterWrap: {
    display: "none",
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "16px",
    borderRadius: tokens.borderRadiusMedium,
    "@media (min-width: 1024px)": {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
  },
});

export const SearchPage = (): JSX.Element => {
  const styles = useStyles();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const defaultRegion = useSettingsStore((state) => state.region);
  const [inputValue, setInputValue] = useState(q);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filters = useMemo(() => buildFiltersFromQuery(searchParams, defaultRegion), [searchParams, defaultRegion]);

  useEffect(() => {
    setInputValue(q);
  }, [q]);

  const applyFilters = (next: SearchFilterValues): void => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.set("type", next.type);
      updated.set("sort", next.sortBy);
      if (next.duration) updated.set("duration", next.duration);
      else updated.delete("duration");
      if (next.features.length) updated.set("features", next.features.join(","));
      else updated.delete("features");
      if (next.region) updated.set("region", next.region);
      else updated.delete("region");
      return updated;
    });
  };

  const resetFilters = (): void => {
    applyFilters({
      type: "all",
      sortBy: "relevance",
      duration: "",
      features: [],
      region: defaultRegion || "JP",
    });
  };

  const params: SearchVideosParams | null = useMemo(() => {
    if (!q.trim()) return null;
    return {
      q,
      type: filters.type,
      sort_by: filters.sortBy,
      duration: filters.duration || undefined,
      features: filters.features as SearchVideosParams["features"],
      region: filters.region,
    };
  }, [q, filters]);

  const searchQuery = useQuery({
    queryKey: queryKeys.search(
      [
        params?.q ?? "",
        params?.type ?? "all",
        params?.sort_by ?? "relevance",
        params?.duration ?? "",
        params?.features?.join(",") ?? "",
        params?.region ?? "",
      ].join("|"),
    ),
    queryFn: ({ signal }) => searchVideos(params!, signal),
    enabled: !!params,
    placeholderData: keepPreviousData,
  });

  const onFeatureChange = (feature: string, checked: boolean) => {
    const nextFeatures = checked
      ? [...filters.features, feature]
      : filters.features.filter((f) => f !== feature);
    applyFilters({ ...filters, features: nextFeatures });
  };

  return (
    <div className={styles.container}>
      <Text size={700} weight="bold">検索</Text>

      <form
        className={styles.searchForm}
        onSubmit={(event) => {
          event.preventDefault();
          addRecentSearch(inputValue);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("q", inputValue);
            return next;
          });
        }}
      >
        <Input
          style={{ flexGrow: 1 }}
          value={inputValue}
          onChange={(e, data) => setInputValue(data.value)}
          placeholder="検索キーワード"
          appearance="outline"
        />
        <Button type="submit" appearance="primary">
          検索
        </Button>
        <Button
          className={styles.mobileFilterBtn}
          icon={<Filter24Regular />}
          onClick={() => setIsFilterOpen(true)}
          aria-label="フィルター"
        />
      </form>

      <div className={styles.desktopFilterWrap}>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Type</Text>
            <Combobox
              selectedOptions={[filters.type]}
              value={filters.type}
              onOptionSelect={(_, data) => applyFilters({ ...filters, type: data.optionValue as any })}
            >
              <Option value="all">all</Option>
              <Option value="video">video</Option>
              <Option value="playlist">playlist</Option>
              <Option value="channel">channel</Option>
            </Combobox>
          </div>

          <div className={styles.filterField}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Sort By</Text>
            <Combobox
              selectedOptions={[filters.sortBy]}
              value={filters.sortBy}
              onOptionSelect={(_, data) => applyFilters({ ...filters, sortBy: data.optionValue as any })}
            >
              <Option value="relevance">relevance</Option>
              <Option value="views">views</Option>
            </Combobox>
          </div>

          <div className={styles.filterField}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Duration</Text>
            <Combobox
              selectedOptions={[filters.duration]}
              value={filters.duration || "all"}
              onOptionSelect={(_, data) => applyFilters({ ...filters, duration: data.optionValue as any })}
            >
              <Option value="">all</Option>
              <Option value="short">short</Option>
              <Option value="medium">medium</Option>
              <Option value="long">long</Option>
            </Combobox>
          </div>

          <div className={styles.filterField}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Region</Text>
            <Combobox
              selectedOptions={[filters.region]}
              value={filters.region}
              onOptionSelect={(_, data) => applyFilters({ ...filters, region: data.optionValue as any })}
            >
              {["JP", "US", "KR", "TW", "DE"].map((r) => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Combobox>
          </div>

          <div style={{ alignSelf: "end" }}>
            <Button appearance="outline" onClick={resetFilters} style={{ width: "100%" }}>リセット</Button>
          </div>
        </div>

        <div className={styles.filterSection}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Features</Text>
          <div className={styles.featuresRow}>
            {featureOptions.map((feature) => (
              <Checkbox
                key={feature}
                label={feature}
                checked={filters.features.includes(feature)}
                onChange={(e, data) => onFeatureChange(feature, !!data.checked)}
              />
            ))}
          </div>
        </div>
      </div>

      <MobileFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        value={filters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {!q ? <EmptyState title="キーワードを入力してください" description="検索バーからクエリを入力すると結果を表示します。" /> : null}
      {q && searchQuery.isLoading ? <LoadingGrid /> : null}
      {q && searchQuery.isError ? (
        <ErrorState title="検索失敗" message="検索結果を取得できませんでした。" onRetry={() => searchQuery.refetch()} />
      ) : null}
      {q && !searchQuery.isLoading && !searchQuery.isError && (searchQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="結果が見つかりません" description="フィルタを変更して再試行してください。" />
      ) : null}
      {q && (searchQuery.data?.length ?? 0) > 0 ? <VideoGrid items={searchQuery.data ?? []} /> : null}
    </div>
  );
};
