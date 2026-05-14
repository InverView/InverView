import {
  Text,
  makeStyles,
  tokens,
  Button,
  Card,
} from "@fluentui/react-components";
import { Dismiss16Regular } from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { Thumbnail } from "./Thumbnail";

interface MiniPlayerProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  baseUrl: string;
  onClose: () => void;
}

const useStyles = makeStyles({
  container: {
    position: "fixed",
    right: "12px",
    bottom: "calc(82px + env(safe-area-inset-bottom))",
    zIndex: 45,
    width: "220px",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: tokens.shadow16,
    "@media (min-width: 600px)": {
      width: "260px",
    },
    "@media (min-width: 1024px)": {
      right: "24px",
      bottom: "24px",
    },
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    fontSize: "14px",
    fontWeight: tokens.fontWeightSemibold,
    textDecorationLine: "none",
    color: tokens.colorNeutralForeground1,
    ":hover": {
      textDecorationLine: "underline",
    },
  },
});

export const MiniPlayer = ({ videoId, title, thumbnailUrl, baseUrl, onClose }: MiniPlayerProps): JSX.Element => {
  const styles = useStyles();
  return (
    <Card appearance="outline" className={styles.container}>
      <div className={styles.header}>
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Mini Player</Text>
        <Button
          size="small"
          appearance="subtle"
          icon={<Dismiss16Regular />}
          onClick={onClose}
          aria-label="ミニプレイヤーを閉じる"
        />
      </div>
      <Link to={`/watch/${videoId}?autoplay=1`} style={{ textDecoration: "none" }}>
        <Thumbnail src={thumbnailUrl} alt={title} baseUrl={baseUrl} ratio={16 / 9} />
        <div style={{ marginTop: "8px" }}>
          <Text className={styles.title}>{title}</Text>
        </div>
      </Link>
    </Card>
  );
};

