import type { FC, ReactNode } from "react";
import type { ListEntry } from "../../../layout/list/adapter";
import { useInternational, type InternationalContextValue } from "../../../international";
import Spinner from "../../progress/Spinner";
import cx from "../../foundation/cx";
import CommentRow from "../CommentRow";
import { useCommentThread } from "../useCommentThread";
import type { CommentData, CommentThreadModel, CommentThreadProps } from "../types";
import "../Comment.css";

/**
 * Renders a Material threaded comment tree with reference links and reply actions.
 * Type: function component.
 * @param props - Comment data or adapter, expansion, reply, resolve, and reference handlers.
 * @example
 * <CommentThread comments={comments} onReply={(parent, body) => addReply(parent, body)} />
 * @returns A threaded comment list.
 */
const CommentThread: FC<CommentThreadProps> = ({
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
    className = "",
    role,
    "aria-label": ariaLabel,
    ref,
    ...rest
}: CommentThreadProps) => {
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

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("comment-thread", className)}
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
            ) : null}

            {loading
                ? null
                : rows.map((entry: ListEntry<CommentData>, index: number) => {
                      const parentKey: string | null = tree.getParentKey(entry.key);
                      const parent: CommentData | null =
                          parentKey === null ? null : tree.getItem(parentKey);

                      return (
                          <CommentRow
                              key={entry.key}
                              model={model}
                              entry={entry}
                              index={index}
                              parent={parent}
                              hasChildren={tree.isExpandable(entry.key)}
                              isExpanded={model.expanded.has(entry.key)}
                              isReplying={model.replyingTo === entry.key}
                          />
                      );
                  })}

            {footer === (void 0) ? null : <div className="comment-thread__footer">{footer}</div>}
        </div>
    );
};

export type { CommentData, CommentSlots, CommentThreadProps } from "../types";
export default CommentThread;
