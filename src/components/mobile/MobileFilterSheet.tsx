import {
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Select,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";

export interface SearchFilterValues {
  type: "all" | "video" | "playlist" | "channel";
  sortBy: "relevance" | "views";
  duration: "" | "short" | "medium" | "long";
  features: string[];
  region: string;
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: SearchFilterValues;
  onApply: (value: SearchFilterValues) => void;
  onReset: () => void;
}

const featureOptions = ["hd", "subtitles", "4k", "live", "360", "hdr", "vr180"];

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  featureLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: "14px",
    marginBottom: "4px",
  },
  featureRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  footer: {
    display: "flex",
    gap: "12px",
    width: "100%",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
  },
  footerBtn: {
    flexGrow: 1,
  },
});

export const MobileFilterSheet = ({ isOpen, onClose, value, onApply, onReset }: MobileFilterSheetProps): JSX.Element => {
  const styles = useStyles();
  const [draft, setDraft] = useState<SearchFilterValues>(value);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
    }
  }, [isOpen, value]);

  const handleFeatureChange = (feature: string, checked: boolean): void => {
    setDraft((prev) => {
      const next = checked
        ? [...prev.features, feature]
        : prev.features.filter((f) => f !== feature);
      return { ...prev, features: next };
    });
  };

  return (
    <Drawer position="bottom" open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }
        >
          検索フィルター
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div className={styles.container}>
          <div className={styles.grid}>
            <Select
              value={draft.type}
              onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as SearchFilterValues["type"] }))}
            >
              <option value="all">all</option>
              <option value="video">video</option>
              <option value="playlist">playlist</option>
              <option value="channel">channel</option>
            </Select>
            <Select
              value={draft.sortBy}
              onChange={(e) => setDraft((prev) => ({ ...prev, sortBy: e.target.value as SearchFilterValues["sortBy"] }))}
            >
              <option value="relevance">relevance</option>
              <option value="views">views</option>
            </Select>
            <Select
              value={draft.duration}
              onChange={(e) => setDraft((prev) => ({ ...prev, duration: e.target.value as SearchFilterValues["duration"] }))}
            >
              <option value="">duration: all</option>
              <option value="short">short</option>
              <option value="medium">medium</option>
              <option value="long">long</option>
            </Select>
            <Select
              value={draft.region}
              onChange={(e) => setDraft((prev) => ({ ...prev, region: e.target.value }))}
            >
              <option value="JP">JP</option>
              <option value="US">US</option>
              <option value="KR">KR</option>
              <option value="TW">TW</option>
              <option value="DE">DE</option>
            </Select>
          </div>
          <div>
            <div className={styles.featureLabel}>Features</div>
            <div className={styles.featureRow}>
              {featureOptions.map((feature) => (
                <Checkbox
                  key={feature}
                  label={feature}
                  checked={draft.features.includes(feature)}
                  onChange={(_, data) => handleFeatureChange(feature, !!data.checked)}
                />
              ))}
            </div>
          </div>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <div className={styles.footer}>
          <Button
            appearance="outline"
            className={styles.footerBtn}
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            リセット
          </Button>
          <Button
            appearance="primary"
            className={styles.footerBtn}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            適用
          </Button>
        </div>
      </DrawerFooter>
    </Drawer>
  );
};
