import {
  Text,
  makeStyles,
  tokens,
  Button,
  Card,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import { Delete24Regular, Play24Regular } from "@fluentui/react-icons";
import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Link as RouterLink } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Thumbnail } from "../components/Thumbnail";
import { formatDateJa, formatDuration } from "../lib/format";
import { clearWatchHistory, getWatchHistory, removeWatchHistoryItem } from "../lib/watchHistory";
import { useSettings } from "../hooks/useSettings";

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
  alert: {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: tokens.colorStatusWarningBackground1,
    border: `1px solid ${tokens.colorStatusWarningBorder1}`,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  historyCard: {
    display: "flex",
    gap: "12px",
    padding: "12px",
    alignItems: "start",
  },
  thumbnailWrap: {
    width: "160px",
    flexShrink: 0,
    "@media (max-width: 600px)": {
      width: "120px",
    },
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flexGrow: 1,
  },
  metadata: {
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
  },
});

export const HistoryPage = (): JSX.Element => {
  const styles = useStyles();
  const { settings } = useSettings();
  const [version, setVersion] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const history = useMemo(() => {
    void version;
    return getWatchHistory();
  }, [version]);
  const shouldVirtualize = history.length >= 40;
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? history.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 170,
    overscan: 3,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  if (!settings.saveWatchHistory) {
    return (
      <div className={styles.alert}>
        <Text weight="bold">視聴履歴は無効です</Text>
        <Text size={200}>設定で「視聴履歴を保存」をONにすると記録されます。</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={700} weight="bold">視聴履歴</Text>
        <Button appearance="outline" onClick={() => setIsConfirmOpen(true)}>
          履歴をすべて削除
        </Button>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={(_, data) => setIsConfirmOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>履歴をすべて削除</DialogTitle>
            <DialogContent>
              履歴をすべて削除しますか？この操作は取り消せません。
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={() => {
                  clearWatchHistory();
                  setVersion((v) => v + 1);
                  setIsConfirmOpen(false);
                }}
              >
                削除する
              </Button>
              <Button appearance="outline" onClick={() => setIsConfirmOpen(false)}>
                キャンセル
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {history.length === 0 ? (
        <EmptyState title="履歴はありません" description="動画を再生するとここに保存されます。" />
      ) : (
        shouldVirtualize ? (
          <div ref={parentRef} style={{ maxHeight: "70vh", overflowY: "auto", overscrollBehavior: "contain" }}>
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {virtualRows.map((virtualRow) => {
                const item = history[virtualRow.index];
                if (!item) return null;
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: 12,
                    }}
                  >
                    <Card appearance="outline" className={styles.historyCard}>
                      <div className={styles.thumbnailWrap}>
                        <RouterLink to={`/watch/${item.videoId}?autoplay=1`}>
                          <Thumbnail src={item.thumbnailUrl} alt={item.title} baseUrl={settings.instanceUrl} ratio={16 / 9} />
                        </RouterLink>
                      </div>
                      <div className={styles.info}>
                        <Text weight="semibold" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.title}
                        </Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{item.channelName}</Text>
                        <Text className={styles.metadata}>
                          視聴日時: {formatDateJa(Math.floor(item.watchedAt / 1000))} ・ 再生位置: {formatDuration(item.positionSeconds)}
                        </Text>
                        <div className={styles.actions}>
                          <RouterLink to={`/watch/${item.videoId}?autoplay=1`}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Play24Regular />}
                            >
                              続きから再生
                            </Button>
                          </RouterLink>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete24Regular />}
                            aria-label="履歴を削除"
                            onClick={() => {
                              removeWatchHistoryItem(item.videoId);
                              setVersion((v) => v + 1);
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.list}>
            {history.map((item) => (
              <Card key={item.videoId} appearance="outline" className={styles.historyCard}>
                <div className={styles.thumbnailWrap}>
                  <RouterLink to={`/watch/${item.videoId}?autoplay=1`}>
                    <Thumbnail src={item.thumbnailUrl} alt={item.title} baseUrl={settings.instanceUrl} ratio={16 / 9} />
                  </RouterLink>
                </div>
                <div className={styles.info}>
                  <Text weight="semibold" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.title}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{item.channelName}</Text>
                  <Text className={styles.metadata}>
                    視聴日時: {formatDateJa(Math.floor(item.watchedAt / 1000))} ・ 再生位置: {formatDuration(item.positionSeconds)}
                  </Text>
                  <div className={styles.actions}>
                    <RouterLink to={`/watch/${item.videoId}?autoplay=1`}>
                      <Button
                        size="small"
                        appearance="primary"
                        icon={<Play24Regular />}
                      >
                        続きから再生
                      </Button>
                    </RouterLink>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      aria-label="履歴を削除"
                      onClick={() => {
                        removeWatchHistoryItem(item.videoId);
                        setVersion((v) => v + 1);
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

