import {
  Text,
  makeStyles,
  tokens,
  Button,
  Card,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
} from "@fluentui/react-components";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const useStyles = makeStyles({
  card: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  message: {
    color: tokens.colorPaletteRedForeground1,
  },
  retryBtn: {
    width: "fit-content",
  },
});

export const ErrorState = ({ title = "エラー", message, onRetry }: ErrorStateProps): JSX.Element => {
  const styles = useStyles();
  return (
    <Card appearance="outline" className={styles.card}>
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>{title}</MessageBarTitle>
          {message}
        </MessageBarBody>
      </MessageBar>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {onRetry && (
          <Button
            appearance="primary"
            onClick={onRetry}
            className={styles.retryBtn}
          >
            再試行
          </Button>
        )}
      </div>
    </Card>
  );
};
