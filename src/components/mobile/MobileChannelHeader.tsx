import {
  Text,
  makeStyles,
  tokens,
  Avatar,
  Button,
  Card,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { formatNumberJa } from "../../lib/format";

interface MobileChannelHeaderProps {
  authorId: string;
  author: string;
  avatarSrc: string;
  subCount?: number;
  secondaryActionLabel?: string;
  secondaryActionAppearance?: "primary" | "outline";
  onSecondaryActionClick?: () => void;
}

const useStyles = makeStyles({
  card: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  header: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  info: {
    display: "flex",
    flexDirection: "column",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  btn: {
    flexGrow: 1,
  },
});

export const MobileChannelHeader = ({
  authorId,
  author,
  avatarSrc,
  subCount,
  secondaryActionLabel = "動画一覧",
  secondaryActionAppearance = "primary",
  onSecondaryActionClick,
}: MobileChannelHeaderProps): JSX.Element => {
  const styles = useStyles();
  const navigate = useNavigate();
  return (
    <Card appearance="outline" className={styles.card}>
      <div className={styles.header}>
        <Avatar image={{ src: avatarSrc }} name={author} size={48} />
        <div className={styles.info}>
          <Text weight="bold" size={400}>{author}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            登録者 {formatNumberJa(subCount)} 人
          </Text>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          onClick={() => navigate(`/channel/${authorId}`)}
          size="small"
          appearance="outline"
          className={styles.btn}
        >
          チャンネル
        </Button>
        <Button
          onClick={() => {
            if (onSecondaryActionClick) {
              onSecondaryActionClick();
              return;
            }
            navigate(`/channel/${authorId}/videos`);
          }}
          size="small"
          appearance={secondaryActionAppearance}
          className={styles.btn}
        >
          {secondaryActionLabel}
        </Button>
      </div>
    </Card>
  );
};
