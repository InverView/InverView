import {
  Text,
  makeStyles,
  tokens,
  Avatar,
  Card,
  Button,
} from "@fluentui/react-components";
import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { formatNumberJa, formatRelativeDateJa } from "../lib/format";
import { pickBestThumbnail, resolveMediaUrl } from "../lib/media";
import { useSettingsStore } from "../store/settingsStore";
import type { CommentObject } from "../types/invidious";

interface CommentCardProps {
  comment: CommentObject;
}

const useStyles = makeStyles({
  card: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexGrow: 1,
    minWidth: 0,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  authorRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  avatar: {
    flexShrink: 0,
  },
  subRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  author: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metadata: {
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
  },
  pinned: {
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: "999px",
    padding: "1px 8px",
    fontSize: "12px",
    lineHeight: "18px",
  },
  commentText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: tokens.colorNeutralForeground1,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecorationLine: "none",
      ":hover": {
        textDecorationLine: "underline",
      },
    },
  },
  commentTextTruncated: {
    maxHeight: "120px",
    display: "-webkit-box",
    "-webkit-line-clamp": "5",
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
  },
  expandButton: {
    alignSelf: "flex-start",
    padding: "0",
    minWidth: "auto",
    height: "auto",
    marginTop: "4px",
    fontSize: "13px",
  },
  footer: {
    marginTop: "4px",
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
  },
});

export const CommentCard = ({ comment }: CommentCardProps): JSX.Element => {
  const styles = useStyles();
  const baseUrl = useSettingsStore((state) => state.apiBaseUrl);
  const image = pickBestThumbnail(comment.authorThumbnails?.map((item) => ({ ...item, quality: "author" })));
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpand, setShowExpand] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const isLong = textRef.current.scrollHeight > 125; // roughly 5 lines
      setShowExpand(isLong);
    }
  }, [comment.content, comment.contentHtml]);

  return (
    <Card appearance="outline" className={styles.card}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.authorRow}>
            <Avatar
              className={styles.avatar}
              image={{ src: resolveMediaUrl(image?.url, baseUrl) }}
              name={comment.author}
              size={28}
            />
            <Text className={styles.author}>{comment.author}</Text>
            {comment.isPinned && (
              <Text className={styles.pinned}>固定</Text>
            )}
          </div>
          <div className={styles.subRow}>
            <Text className={styles.metadata}>
              {formatRelativeDateJa(comment.published, comment.publishedText)}
            </Text>
          </div>
        </div>
        <div
          ref={textRef}
          className={`${styles.commentText} ${!isExpanded && showExpand ? styles.commentTextTruncated : ""}`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.contentHtml || comment.content) }}
        />
        {showExpand && (
          <Button
            appearance="subtle"
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "一部を表示" : "もっと見る"}
          </Button>
        )}
        <div className={styles.footer}>
          {formatNumberJa(comment.likeCount)} いいね
        </div>
      </div>
    </Card>
  );
};
