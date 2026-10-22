import type { HTMLAttributes, ReactNode, Ref } from "react";
import type { ListEntry } from "../../layout/list/adapter";
import type { TreeAdapter } from "../../layout/tree/adapter";
import type { MentionItem, MentionSearch } from "../mention/Mention";

/**
 * One node in a comment thread.
 * Type: interface.
 * Fields: id, author, avatar, content, timestamp, replies, references, resolved.
 * @example
 * const comment: CommentData = { id: "c1", author: "Mira", content: "Hello" };
 */
export interface CommentData {
    id: string;
    author: string;
    avatar?: string;
    content: ReactNode;
    timestamp?: string;
    replies?: readonly CommentData[];
    references?: readonly string[];
    resolved?: boolean;
}

/**
 * Render slots for individual comments and the thread shell.
 * Type: interface.
 * Fields: avatar, header, content, actions, composer, comment, empty, loading.
 * The `comment` slot receives the row index and the comment and replaces the whole item.
 * @example
 * <CommentThread slots={{ comment: (index, comment) => <Badge>#{index}</Badge> }} />
 */
export interface CommentSlots {
    avatar?: (comment: CommentData) => ReactNode;
    header?: (comment: CommentData) => ReactNode;
    content?: (comment: CommentData) => ReactNode;
    actions?: (comment: CommentData) => ReactNode;
    composer?: (
        parent: CommentData,
        submit: (body: string) => void,
        cancel: () => void,
    ) => ReactNode;
    /** Replaces one whole comment item; receives its row index and the comment. */
    comment?: (index: number, comment: CommentData) => ReactNode;
    empty?: ReactNode;
    loading?: ReactNode;
}

/**
 * Props for the threaded comment component.
 * Type: interface.
 * Fields: comments, adapter, expandedKeys, defaultExpandedKeys, onExpandedChange, replyingTo,
 * onReplyingToChange, onReply, onReplyStart, onReplyCancel, onReference, onResolve, onDelete,
 * mentionSearch, mentionSuggestions, onMention, currentUser, maxDepth, empty, loading,
 * loadingLabel, disabled, header, footer, slots, className, ref, plus native div attributes
 * and events.
 * @example
 * <CommentThread comments={comments} onReply={(parent, body) => reply(parent, body)} />
 */
export interface CommentThreadProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    comments?: readonly CommentData[];
    adapter?: TreeAdapter<CommentData>;
    expandedKeys?: ReadonlySet<string>;
    defaultExpandedKeys?: ReadonlySet<string>;
    onExpandedChange?: (keys: ReadonlySet<string>) => void;
    replyingTo?: string | null;
    onReplyingToChange?: (key: string | null) => void;
    onReply?: (parent: CommentData, body: string) => void;
    onReplyStart?: (comment: CommentData) => void;
    onReplyCancel?: (comment: CommentData | null) => void;
    onReference?: (from: CommentData, target: CommentData) => void;
    onResolve?: (comment: CommentData, resolved: boolean) => void;
    onDelete?: (comment: CommentData) => void;
    mentionSearch?: MentionSearch;
    mentionSuggestions?: readonly MentionItem[];
    onMention?: (parent: CommentData, item: MentionItem) => void;
    currentUser?: string;
    maxDepth?: number;
    empty?: ReactNode;
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    header?: ReactNode;
    footer?: ReactNode;
    slots?: CommentSlots;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * State and handlers shared by the normal and virtual comment threads.
 * Type: interface.
 * Fields: tree, rows, expanded, replyingTo, draft, slots, currentUser, maxDepth, disabled,
 * mentionSearch, mentionSuggestions, onMention, onReference, onResolve, onDelete,
 * setDraft, toggle, toggleReply, cancelReply, applyReply.
 * @example
 * const model = useCommentThread(props);
 * model.rows.map((entry) => entry.item);
 */
export interface CommentThreadModel {
    tree: TreeAdapter<CommentData>;
    rows: readonly ListEntry<CommentData>[];
    expanded: ReadonlySet<string>;
    replyingTo: string | null;
    draft: string;
    slots?: CommentSlots;
    currentUser: string;
    maxDepth: number;
    disabled: boolean;
    canReply: boolean;
    mentionSearch?: MentionSearch;
    mentionSuggestions?: readonly MentionItem[];
    onMention?: (parent: CommentData, item: MentionItem) => void;
    onReference?: (from: CommentData, target: CommentData) => void;
    onResolve?: (comment: CommentData, resolved: boolean) => void;
    onDelete?: (comment: CommentData) => void;
    setDraft: (value: string) => void;
    toggle: (key: string) => void;
    toggleReply: (comment: CommentData, isReplying: boolean) => void;
    cancelReply: (comment: CommentData | null) => void;
    applyReply: (parent: CommentData, body: string) => void;
}
