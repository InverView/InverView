import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Input,
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { Dismiss24Regular, Search24Regular } from "@fluentui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "../../lib/invidiousClient";
import { queryKeys } from "../../lib/queryKeys";
import { addRecentSearch, getRecentSearches } from "../../lib/recentSearch";
import { useSettingsStore } from "../../store/settingsStore";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const useStyles = makeStyles({
  surface: {
    height: "100%",
    width: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    ...shorthands.margin(0),
    ...shorthands.padding(0),
    borderRadius: 0,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  form: {
    flexGrow: 1,
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  input: {
    flexGrow: 1,
  },
  body: {
    flexGrow: 1,
    padding: "16px",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
    overflowY: "auto",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  listItem: {
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ":active": {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
    },
  },
  loading: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: tokens.colorNeutralForeground3,
    fontSize: "14px",
    marginBottom: "12px",
  },
});

export const MobileSearchOverlay = ({ isOpen, onClose }: MobileSearchOverlayProps): JSX.Element => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { search } = useLocation();
  const currentQ = useMemo(() => new URLSearchParams(search).get("q") ?? "", [search]);
  const [q, setQ] = useState(currentQ);
  const [debouncedQ, setDebouncedQ] = useState(currentQ);
  const [recent, setRecent] = useState<string[]>([]);
  const showSearchSuggestions = useSettingsStore((state) => state.showSearchSuggestions);

  const handleClose = (): void => {
    if (window.history.state?.mobileSearch) {
      window.history.back();
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setQ(currentQ);
      setDebouncedQ(currentQ);
      setRecent(getRecentSearches());
    }
  }, [isOpen, currentQ]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const state = { mobileSearch: true };
    window.history.pushState(state, "");
    const handlePopState = (): void => onClose();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const suggestionsQuery = useQuery({
    queryKey: queryKeys.suggestions(`mobile-${debouncedQ}`),
    queryFn: ({ signal }) => getSearchSuggestions(debouncedQ, signal),
    enabled: isOpen && showSearchSuggestions && debouncedQ.length > 1,
    staleTime: 1000 * 45,
    gcTime: 1000 * 60 * 5,
  });

  const suggestions = useMemo(() => {
    const data = suggestionsQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.suggestions ?? [];
  }, [suggestionsQuery.data]);

  const submit = (value?: string): void => {
    const text = (value ?? q).trim();
    if (!text) return;
    addRecentSearch(text);
    onClose();
    navigate(`/search?q=${encodeURIComponent(text)}`);
  };

  const listItems = showSearchSuggestions && suggestions.length > 0 ? suggestions : recent;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <div className={styles.header}>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={handleClose}
            aria-label="閉じる"
          />
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Input
              autoFocus
              className={styles.input}
              value={q}
              placeholder="検索キーワード"
              onChange={(e) => setQ(e.target.value)}
              appearance="outline"
            />
            <Button
              type="submit"
              appearance="primary"
              icon={<Search24Regular />}
              aria-label="検索"
            />
          </form>
        </div>
        <DialogBody className={styles.body}>
          <DialogContent>
            {suggestionsQuery.isFetching && (
              <div className={styles.loading}>
                <Spinner size="tiny" />
                <Text>候補を取得中...</Text>
              </div>
            )}
            <div className={styles.list}>
              {listItems.map((item) => (
                <div
                  key={item}
                  className={styles.listItem}
                  onClick={() => submit(item)}
                >
                  <Text>{item}</Text>
                </div>
              ))}
            </div>
            {!suggestionsQuery.isFetching && listItems.length === 0 && q.trim().length > 0 && (
              <div style={{ marginTop: "12px", color: tokens.colorNeutralForeground3, fontSize: "14px" }}>
                Enter で「{q.trim()}」を検索できます
              </div>
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
