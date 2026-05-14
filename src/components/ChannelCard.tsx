import {
  Avatar,
  Card,
  CardHeader,
  Text,
  Caption1,
  Body1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { formatNumberJa } from "../lib/format";
import { pickBestThumbnail, resolveMediaUrl } from "../lib/media";
import { useSettingsStore } from "../store/settingsStore";
import type { ChannelObject } from "../types/invidious";

interface ChannelCardProps {
  channel: ChannelObject;
}

const useStyles = makeStyles({
  card: {
    width: "100%",
    cursor: "pointer",
    ":hover": {
      boxShadow: tokens.shadow8,
    },
  },
  author: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  description: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    color: tokens.colorNeutralForeground3,
  },
});

export const ChannelCard = ({ channel }: ChannelCardProps): JSX.Element => {
  const styles = useStyles();
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const image = pickBestThumbnail(channel.authorThumbnails);

  return (
    <Card
      className={styles.card}
      orientation="horizontal"
      onClick={() => navigate(`/channel/${channel.authorId}`)}
      appearance="outline"
    >
      <Avatar
        image={{ src: resolveMediaUrl(image?.url, baseUrl) }}
        name={channel.author}
        size={48}
        aria-label={channel.author}
      />
      <CardHeader
        header={
          <Text className={styles.author} block>
            {channel.author}
          </Text>
        }
        description={
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              登録者 {formatNumberJa(channel.subCount)} 人
            </Caption1>
            <Body1 className={styles.description}>
              {channel.description || "説明はありません。"}
            </Body1>
          </div>
        }
      />
    </Card>
  );
};
