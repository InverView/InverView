import {
  Text,
  makeStyles,
  tokens,
  Card,
} from "@fluentui/react-components";

interface EmptyStateProps {
  title: string;
  description: string;
}

const useStyles = makeStyles({
  card: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "center",
    textAlign: "center",
  },
  description: {
    color: tokens.colorNeutralForeground3,
  },
});

export const EmptyState = ({ title, description }: EmptyStateProps): JSX.Element => {
  const styles = useStyles();
  return (
    <Card appearance="outline" className={styles.card}>
      <Text size={400} weight="bold">
        {title}
      </Text>
      <Text className={styles.description}>
        {description}
      </Text>
    </Card>
  );
};
