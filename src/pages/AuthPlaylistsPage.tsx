import {
  Text,
  makeStyles,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  OverlayDrawer,
  useRestoreFocusSource,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingGrid } from "../components/LoadingGrid";
import { PlaylistCard } from "../components/PlaylistCard";
import { getAuthPlaylists } from "../lib/invidiousClient";
import { createLocalPlaylist, getLocalPlaylists } from "../lib/localPlaylists";
import { queryKeys } from "../lib/queryKeys";
import { useSettingsStore } from "../store/settingsStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (min-width: 1200px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  },
});

export const AuthPlaylistsPage = (): JSX.Element => {
  const styles = useStyles();
  const token = useSettingsStore((state) => state.token);
  const [, setLocalVersion] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("あとで見る");
  const [nameError, setNameError] = useState("");
  const restoreFocusTargetAttributes = useRestoreFocusTarget();
  const restoreFocusSourceAttributes = useRestoreFocusSource();

  const playlistsQuery = useQuery({
    queryKey: queryKeys.authPlaylists,
    queryFn: ({ signal }) => getAuthPlaylists(signal),
    enabled: !!token,
  });

  const localPlaylists = getLocalPlaylists();

  const playlists = playlistsQuery.data ?? [];
  const shownPlaylists = token ? playlists : localPlaylists;

  const closeCreateDrawer = (): void => {
    setIsCreateOpen(false);
    setNameError("");
  };

  const submitCreatePlaylist = (): void => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) {
      setNameError("プレイリスト名を入力してください。");
      return;
    }
    createLocalPlaylist(trimmed);
    setLocalVersion((v) => v + 1);
    setNewPlaylistName("あとで見る");
    closeCreateDrawer();
  };

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <Text size={700} weight="bold">{token ? "自分のプレイリスト" : "ローカルプレイリスト"}</Text>
        <Button
          {...restoreFocusTargetAttributes}
          appearance="primary"
          onClick={() => setIsCreateOpen(true)}
        >
          新規作成
        </Button>
      </div>
      <OverlayDrawer
        {...restoreFocusSourceAttributes}
        position="end"
        size="small"
        open={isCreateOpen}
        onOpenChange={(_, data) => !data.open && closeCreateDrawer()}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={closeCreateDrawer}
              />
            }
          >
            新規プレイリスト
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <Field label="プレイリスト名" validationMessage={nameError || undefined} validationState={nameError ? "error" : "none"}>
            <Input
              value={newPlaylistName}
              onChange={(_, data) => {
                setNewPlaylistName(data.value);
                if (nameError) setNameError("");
              }}
              placeholder="プレイリスト名を入力"
            />
          </Field>
        </DrawerBody>
        <DrawerFooter>
          <Button appearance="secondary" onClick={closeCreateDrawer}>キャンセル</Button>
          <Button appearance="primary" onClick={submitCreatePlaylist}>作成</Button>
        </DrawerFooter>
      </OverlayDrawer>
      {token && playlistsQuery.isLoading ? <LoadingGrid /> : null}
      {token && playlistsQuery.isError ? (
        <ErrorState title="取得失敗" message="/auth/playlists を取得できませんでした。" onRetry={() => playlistsQuery.refetch()} />
      ) : null}
      {(!token || (!playlistsQuery.isLoading && !playlistsQuery.isError)) && shownPlaylists.length === 0 ? (
        <EmptyState title="プレイリストなし" description={token ? "保存済みプレイリストがありません。" : "まずは新規作成して動画を追加してください。"} />
      ) : null}
      {shownPlaylists.length > 0 ? (
        <div className={styles.grid}>
          {shownPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.playlistId} playlist={playlist} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
