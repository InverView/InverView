import {
  makeStyles,
  tokens,
  Skeleton,
  SkeletonItem,
  Card,
} from "@fluentui/react-components";
import { VideoCardSkeleton } from "./VideoCardSkeleton";

interface WatchLoadingSkeletonProps {
  theaterMode?: boolean;
}

const useStyles = makeStyles({
  container: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    alignItems: "start",
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "minmax(0, 1fr) 380px",
    },
  },
  mainCol: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: 0,
  },
  playerSkeleton: {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "inherit",
  },
  playerFrame: {
    width: "100%",
    borderRadius: "12px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    overflow: "hidden",
  },
  titleSkeleton: {
    height: "28px",
    width: "70%",
    marginTop: "8px",
  },
  metaSkeleton: {
    height: "16px",
    width: "40%",
  },
  descriptionSkeleton: {
    height: "100px",
    width: "100%",
  },
  sideCol: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: 0,
  },
  channelSkeleton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "8px",
  },
  avatarSkeleton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  },
  sideTitleSkeleton: {
    height: "14px",
    width: "90%",
  },
  sideMetaSkeleton: {
    height: "12px",
    width: "60%",
  },
});

export const WatchLoadingSkeleton = ({ theaterMode = false }: WatchLoadingSkeletonProps): JSX.Element => {
  const styles = useStyles();
  const cols = theaterMode ? 4 : 3;
  const span = theaterMode ? 3 : 2;

  return (
    <div
      className={styles.container}
      style={{ "--skeleton-cols": cols, "--skeleton-span": span } as any}
    >
      <div className={styles.mainCol}>
        <Skeleton aria-label="Loading video player">
          <div className={styles.playerFrame}>
            <SkeletonItem className={styles.playerSkeleton} />
          </div>
          <SkeletonItem className={styles.titleSkeleton} />
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <SkeletonItem className={styles.metaSkeleton} />
            <SkeletonItem className={styles.metaSkeleton} />
          </div>
          <div className={styles.channelSkeleton}>
            <SkeletonItem shape="circle" className={styles.avatarSkeleton} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1 }}>
              <SkeletonItem className={styles.sideTitleSkeleton} />
              <SkeletonItem className={styles.sideMetaSkeleton} />
            </div>
          </div>
        </Skeleton>

        <Card appearance="outline">
          <Skeleton>
            <SkeletonItem className={styles.descriptionSkeleton} />
          </Skeleton>
        </Card>

        <Card appearance="outline">
          <Skeleton>
            <SkeletonItem className={styles.descriptionSkeleton} />
          </Skeleton>
        </Card>
      </div>

      <div className={styles.sideCol}>
        <SkeletonItem className={styles.sideTitleSkeleton} style={{ marginBottom: "8px", height: "20px", width: "100px" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <VideoCardSkeleton key={i} horizontal />
        ))}
      </div>
    </div>
  );
};
