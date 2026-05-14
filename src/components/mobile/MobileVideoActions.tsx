import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  makeStyles,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  OverlayDrawer,
  useRestoreFocusSource,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import { Share24Regular, VideoClip24Regular, Add24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { canUsePictureInPictureApi, shareContent, togglePictureInPicture, vibrate } from "../../lib/webPlatform";
import { ChromecastButton } from "../ChromecastButton";
import type { VideoDetails } from "../../types/invidious";
import { addVideoToLocalPlaylist, createLocalPlaylist, getLocalPlaylists } from "../../lib/localPlaylists";

interface MobileVideoActionsProps {
  videoId: string;
  title: string;
  video: VideoDetails;
  baseUrl: string;
  startTimeSeconds?: number;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "nowrap",
    gap: "8px",
    overflowX: "auto",
    overflowY: "hidden",
    width: "100%",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorX: "contain",
    paddingBottom: "4px",
    "& > *": {
      flexShrink: 0,
      whiteSpace: "nowrap",
    },
    "::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const MobileVideoActions = ({
  videoId,
  title,
  video,
  baseUrl,
  startTimeSeconds,
}: MobileVideoActionsProps): JSX.Element => {
  const styles = useStyles();
  const [, setLocalPlaylistVersion] = useState(0);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("あとで見る");
  const [nameError, setNameError] = useState("");
  const restoreFocusTargetAttributes = useRestoreFocusTarget();
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const watchUrl = `${window.location.origin}/watch/${videoId}?autoplay=1`;
  const localPlaylists = getLocalPlaylists();

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(watchUrl);
      vibrate(20);
      // TODO: Implement Fluent v9 Toast
    } catch {
      // ignore
    }
  };

  const share = async (): Promise<void> => {
    const shared = await shareContent({ title, url: watchUrl });
    if (shared) {
      vibrate([12, 24, 12]);
      return;
    }
    await copyLink();
  };

  const openPictureInPicture = async (): Promise<void> => {
    const success = await togglePictureInPicture();
    if (success) vibrate(24);
  };

  const closeCreateDrawer = (): void => {
    setIsCreateDrawerOpen(false);
    setNameError("");
  };

  const submitCreateAndAdd = (): void => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) {
      setNameError("プレイリスト名を入力してください。");
      return;
    }
    const created = createLocalPlaylist(trimmed);
    addVideoToLocalPlaylist(created.playlistId, {
      videoId: video.videoId,
      title: video.title,
      author: video.author,
      authorId: video.authorId,
      authorUrl: video.authorUrl,
      lengthSeconds: video.lengthSeconds,
      thumbnails: video.videoThumbnails,
    });
    setLocalPlaylistVersion((v) => v + 1);
    setNewPlaylistName("あとで見る");
    closeCreateDrawer();
  };

  return (
    <div className={styles.container}>
      <Button
        icon={<Share24Regular />}
        appearance="outline"
        onClick={share}
        aria-label="共有"
      >
        共有
      </Button>
      <Menu positioning="below-start">
        <MenuTrigger disableButtonEnhancement>
          <Button {...restoreFocusTargetAttributes} icon={<Add24Regular />} appearance="outline">
            プレイリストに追加
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {localPlaylists.map((playlist) => (
              <MenuItem
                key={playlist.playlistId}
                onClick={() => {
                  addVideoToLocalPlaylist(playlist.playlistId, {
                    videoId: video.videoId,
                    title: video.title,
                    author: video.author,
                    authorId: video.authorId,
                    authorUrl: video.authorUrl,
                    lengthSeconds: video.lengthSeconds,
                    thumbnails: video.videoThumbnails,
                  });
                  setLocalPlaylistVersion((v) => v + 1);
                }}
              >
                {playlist.title}
              </MenuItem>
            ))}
            <MenuItem
              onClick={() => {
                setIsCreateDrawerOpen(true);
              }}
            >
              新規プレイリストを作成
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <OverlayDrawer
        {...restoreFocusSourceAttributes}
        position="end"
        size="small"
        open={isCreateDrawerOpen}
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
          <Button appearance="primary" onClick={submitCreateAndAdd}>作成して追加</Button>
        </DrawerFooter>
      </OverlayDrawer>
      {canUsePictureInPictureApi() && (
        <Button
          icon={<VideoClip24Regular />}
          appearance="outline"
          onClick={openPictureInPicture}
          aria-label="ピクチャーインピクチャー"
        >
          PiP
        </Button>
      )}
      <ChromecastButton video={video} baseUrl={baseUrl} startTimeSeconds={startTimeSeconds} />
    </div>
  );
};
