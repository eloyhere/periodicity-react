import type { CSSProperties, FC, ReactNode } from "react";
import type { ListEntry } from "../../../layout/list/adapter";
import { useInternational, type InternationalContextValue } from "../../../international";
import Spinner from "../../progress/Spinner";
import cx from "../../foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../foundation/useVirtualWindow";
import CommentRow from "../CommentRow";
import { useCommentThread } from "../useCommentThread";
import type { CommentData, CommentThreadModel, CommentThreadProps } from "../types";
import "../Comment.css";

/**
 * Props for the virtual comment thread.
 * Type: interface.
 * Fields: every `CommentThreadProps` field, plus height and itemHeight.
 * Comments are flattened into fixed-height rows, so a thread with many replies only mounts the
 * rows inside the viewport.
 * @example
 * <VirtualCommentThread comments={comments} height={420} itemHeight={150} />
 */
export interface VirtualCommentThreadProps extends CommentThreadProps {
    /** Height of the scroll viewport in pixels; defaults to 360. */
    height?: number;
    /** Fixed height of one comment row in pixels; defaults to 160. */
    itemHeight?: number;
}

/**
 * Renders the threaded comment tree with fixed-row virtualisation.
 * Type: function component.
 * @param props - Comment data or adapter, expansion, reply handlers, and window sizing.
 * @example
 * <VirtualCommentThread comments={comments} height={420} onReply={addReply} />
 * @returns A virtualised threaded comment list.
 */
const VirtualCommentThread: FC<VirtualCommentThreadProps> = ({
    comments = [],
    adapter,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    replyingTo,
    onReplyingToChange,
    onReply,
    onReplyStart,
    onReplyCancel,
    onReference,
    onResolve,
    onDelete,
    mentionSearch,
    mentionSuggestions,
    onMention,
    currentUser,
    maxDepth,
    empty,
    loading = false,
    loadingLabel,
    disabled,
    header,
    footer,
    slots,
    height = 360,
    itemHeight = 160,
    className = "",
    role,
    "aria-label": ariaLabel,
    ref,
    ...rest
}: VirtualCommentThreadProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedEmpty: ReactNode = empty ?? t("empty");
    const resolvedLoadingLabel: string = loadingLabel ?? t("loadingComments");
    const model: CommentThreadModel = useCommentThread({
        comments,
        adapter,
        expandedKeys,
        defaultExpandedKeys,
        onExpandedChange,
        replyingTo,
        onReplyingToChange,
        onReply,
        onReplyStart,
        onReplyCancel,
        onReference,
        onResolve,
        onDelete,
        mentionSearch,
        mentionSuggestions,
        onMention,
        currentUser,
        maxDepth,
        disabled,
        slots,
    });
    const { rows, tree }: Pick<CommentThreadModel, "rows" | "tree"> = model;
    const {
        attachViewport,
        start,
        end,
        onScroll,
    }: VirtualWindow = useVirtualWindow({
        count: rows.length,
        itemHeight,
        fallbackHeight: height,
        overscan: 2,
        resetKey: loading,
    });
    const windowRows: readonly ListEntry<CommentData>[] = rows.slice(start, end);
    const spacerStyle: CSSProperties = { height: rows.length * itemHeight };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("comment-thread", "comment-thread--virtual", className)}
            role={role ?? "feed"}
            aria-label={ariaLabel ?? t("comments")}
            aria-busy={loading ? "true" : (void 0)}
            aria-disabled={disabled ? "true" : (void 0)}
        >
            {header === (void 0) ? null : <div className="comment-thread__header">{header}</div>}

            {loading ? (
                <div className="comment-thread__state">
                    {slots?.loading ?? <Spinner size="sm" label={resolvedLoadingLabel} />}
                </div>
            ) : rows.length === 0 ? (
                <div className="comment-thread__empty">{slots?.empty ?? resolvedEmpty}</div>
            ) : (
                <div
                    ref={attachViewport}
                    className="comment-thread__viewport"
                    style={{ height }}
                    onScroll={onScroll}
                >
                    <div className="comment-thread__spacer" style={spacerStyle}>
                        {windowRows.map((entry: ListEntry<CommentData>, index: number) => {
                            const absoluteIndex: number = start + index;
                            const parentKey: string | null = tree.getParentKey(entry.key);
                            const parent: CommentData | null =
                                parentKey === null ? null : tree.getItem(parentKey);
                            const rowStyle: CSSProperties = {
                                position: "absolute",
                                top: absoluteIndex * itemHeight,
                                right: 0,
                                left: 0,
                                height: itemHeight,
                            };

                            return (
                                <CommentRow
                                    key={entry.key}
                                    model={model}
                                    entry={entry}
                                    index={absoluteIndex}
                                    parent={parent}
                                    hasChildren={tree.isExpandable(entry.key)}
                                    isExpanded={model.expanded.has(entry.key)}
                                    isReplying={model.replyingTo === entry.key}
                                    virtual
                                    style={rowStyle}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {footer === (void 0) ? null : <div className="comment-thread__footer">{footer}</div>}
        </div>
    );
};

export default VirtualCommentThread;
