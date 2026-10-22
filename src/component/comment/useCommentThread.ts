import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ListAdapter, ListEntry } from "../../layout/list/adapter";
import type { TreeAdapter } from "../../layout/tree/adapter";
import { createTreeAdapter } from "../../layout/tree/adapter";
import type { CommentData, CommentThreadModel, CommentThreadProps } from "./types";

/**
 * Collects every key that has children, so a fresh thread starts fully open.
 * @param tree - Comment tree adapter.
 * @example
 * const keys = expandableKeys(tree);
 * @returns Keys of all expandable comments.
 */
const expandableKeys: (tree: TreeAdapter<CommentData>) => ReadonlySet<string> = (
    tree: TreeAdapter<CommentData>,
): ReadonlySet<string> => {
    const keys: Set<string> = new Set<string>();
    const stack: string[] = [...tree.roots];

    while (stack.length > 0) {
        const key: string | undefined = stack.pop();

        if (key === (void 0)) {
            continue;
        }

        if (tree.isExpandable(key)) {
            keys.add(key);
        }

        for (const child of tree.getChildren(key)) {
            stack.push(child);
        }
    }

    return keys;
};

/**
 * Owns the comment tree, expansion, reply, and draft state shared by both
 * the normal and the virtual comment thread.
 * @param props - Comment data or adapter, expansion, reply, and resolve handlers.
 * @example
 * const model = useCommentThread(props);
 * @returns The flattened visible rows plus their state and handlers.
 */
export const useCommentThread: (props: CommentThreadProps) => CommentThreadModel = (
    props: CommentThreadProps,
): CommentThreadModel => {
    const {
        comments = [],
        adapter,
        expandedKeys,
        defaultExpandedKeys,
        onExpandedChange,
        replyingTo: controlledReplyingTo,
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
        currentUser = "",
        maxDepth = 6,
        disabled = false,
        slots,
    }: CommentThreadProps = props;
    const tree: TreeAdapter<CommentData> = useMemo((): TreeAdapter<CommentData> => {
        if (adapter !== (void 0)) {
            return adapter;
        }

        return createTreeAdapter<CommentData>(comments, {
            getKey: (item: CommentData): string => item.id,
            getChildren: (item: CommentData): readonly CommentData[] => item.replies ?? [],
        });
    }, [adapter, comments]);
    const [internalExpanded, setInternalExpanded]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(
        (): ReadonlySet<string> => defaultExpandedKeys ?? expandableKeys(tree),
    );
    const expanded: ReadonlySet<string> = expandedKeys ?? internalExpanded;
    const [internalReplyingTo, setInternalReplyingTo]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);
    const replyingTo: string | null =
        controlledReplyingTo === (void 0) ? internalReplyingTo : controlledReplyingTo;
    const [draft, setDraft]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");

    const visible: ListAdapter<CommentData> = useMemo(
        (): ListAdapter<CommentData> => tree.flatten(expanded),
        [tree, expanded],
    );

    const setExpanded: (next: ReadonlySet<string>) => void = (next: ReadonlySet<string>): void => {
        if (expandedKeys === (void 0)) {
            setInternalExpanded(next);
        }

        onExpandedChange?.(next);
    };

    const toggle: (key: string) => void = (key: string): void => {
        const next: Set<string> = new Set<string>(expanded);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        setExpanded(next);
    };

    const changeReplyingTo: (next: string | null) => void = (next: string | null): void => {
        if (controlledReplyingTo === (void 0)) {
            setInternalReplyingTo(next);
        }

        onReplyingToChange?.(next);
    };

    const cancelReply: (comment: CommentData | null) => void = (
        comment: CommentData | null,
    ): void => {
        changeReplyingTo(null);
        setDraft("");
        onReplyCancel?.(comment);
    };

    const toggleReply: (comment: CommentData, isReplying: boolean) => void = (
        comment: CommentData,
        isReplying: boolean,
    ): void => {
        if (disabled) {
            return;
        }

        if (isReplying) {
            cancelReply(comment);
            return;
        }

        changeReplyingTo(comment.id);
        setDraft("");
        onReplyStart?.(comment);
    };

    const applyReply: (parent: CommentData, body: string) => void = (
        parent: CommentData,
        body: string,
    ): void => {
        if (disabled) {
            return;
        }

        const text: string = body.trim();

        if (text.length === 0) {
            return;
        }

        onReply?.(parent, text);
        setDraft("");
        changeReplyingTo(null);
        setExpanded(new Set<string>([...expanded, parent.id]));
    };

    const rows: readonly ListEntry<CommentData>[] = visible
        .getRange(0, visible.size)
        .filter((entry: ListEntry<CommentData>): boolean => entry.level <= maxDepth);

    return {
        tree,
        rows,
        expanded,
        replyingTo,
        draft,
        slots,
        currentUser,
        maxDepth,
        disabled,
        canReply: onReply !== (void 0),
        mentionSearch,
        mentionSuggestions,
        onMention,
        onReference,
        onResolve,
        onDelete,
        setDraft,
        toggle,
        toggleReply,
        cancelReply,
        applyReply,
    };
};
