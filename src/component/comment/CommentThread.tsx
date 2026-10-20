import {
    useMemo,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type ReactNode,
    type SetStateAction,
} from "react";
import type { ListAdapter, ListEntry } from "../../layout/list/adapter";
import type { TreeAdapter } from "../../layout/tree/adapter";
import { createTreeAdapter } from "../../layout/tree/adapter";
import Avatar from "../thumb/Avatar";
import Button from "../button/Button";
import Icon from "../icon/Icon";
import Mention, { type MentionItem, type MentionSearch } from "../mention/Mention";
import cx from "../foundation/cx";
import Surface from "../surface/Surface";
import "./Comment.css";

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
 * Fields: avatar, header, content, actions, composer, empty.
 * @example
 * <CommentThread slots={{ actions: (comment) => <Badge>Edited</Badge> }} />
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
    empty?: ReactNode;
}

/**
 * Props for the threaded comment component.
 * Type: interface.
 * Fields: comments, adapter, expandedKeys, defaultExpandedKeys, onExpandedChange,
 * onReply, onReference, mentionSearch, mentionSuggestions, onMention, currentUser,
 * maxDepth, empty, header, footer, slots, className.
 * @example
 * <CommentThread comments={comments} onReply={(parent, body) => reply(parent, body)} />
 */
export interface CommentThreadProps {
    comments?: readonly CommentData[];
    adapter?: TreeAdapter<CommentData>;
    expandedKeys?: ReadonlySet<string>;
    defaultExpandedKeys?: ReadonlySet<string>;
    onExpandedChange?: (keys: ReadonlySet<string>) => void;
    onReply?: (parent: CommentData, body: string) => void;
    onReference?: (from: CommentData, target: CommentData) => void;
    mentionSearch?: MentionSearch;
    mentionSuggestions?: readonly MentionItem[];
    onMention?: (parent: CommentData, item: MentionItem) => void;
    currentUser?: string;
    maxDepth?: number;
    empty?: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    slots?: CommentSlots;
    className?: string;
}

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
 * Renders a Material threaded comment tree with reference links.
 * Type: function component.
 * @param props - Comment data or adapter, expansion, reply, and reference handlers.
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
    onReply,
    onReference,
    mentionSearch,
    mentionSuggestions,
    onMention,
    currentUser = "",
    maxDepth = 6,
    empty = "No comments yet",
    header,
    footer,
    slots,
    className = "",
}: CommentThreadProps) => {
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
    const [replyingTo, setReplyingTo]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(null);
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

    const applyReply: (parent: CommentData, body: string) => void = (
        parent: CommentData,
        body: string,
    ): void => {
        const text: string = body.trim();

        if (text.length === 0) {
            return;
        }

        onReply?.(parent, text);
        setDraft("");
        setReplyingTo(null);
        setExpanded(new Set<string>([...expanded, parent.id]));
    };

    const submitReply: (parent: CommentData) => void = (parent: CommentData): void => {
        applyReply(parent, draft);
    };

    const cancelReply: () => void = (): void => {
        setReplyingTo(null);
        setDraft("");
    };

    const rows: readonly ListEntry<CommentData>[] = visible
        .getRange(0, visible.size)
        .filter((entry: ListEntry<CommentData>): boolean => entry.level <= maxDepth);

    return (
        <div className={cx("comment-thread", className)}>
            {header === (void 0) ? null : <div className="comment-thread__header">{header}</div>}

            {rows.length === 0 ? (
                <div className="comment-thread__empty">{slots?.empty ?? empty}</div>
            ) : null}

            {rows.map((entry: ListEntry<CommentData>): ReactNode => {
                const parentKey: string | null = tree.getParentKey(entry.key);
                const parent: CommentData | null =
                    parentKey === null ? null : tree.getItem(parentKey);
                const hasChildren: boolean = tree.isExpandable(entry.key);
                const isExpanded: boolean = expanded.has(entry.key);
                const isReplying: boolean = replyingTo === entry.key;
                const references: readonly string[] = entry.item.references ?? [];

                return (
                    <article
                        key={entry.key}
                        id={`comment-${entry.key}`}
                        className={cx(
                            "comment",
                            entry.level > 0 && "comment--reply",
                            entry.item.resolved && "comment--resolved",
                        )}
                        style={{ "--comment-depth": entry.level } as CSSProperties}
                        tabIndex={-1}
                        aria-label={`Comment by ${entry.item.author}`}
                    >
                        <div className="comment__rail" aria-hidden="true">
                            {slots?.avatar === (void 0) ? (
                                <Avatar name={entry.item.author} src={entry.item.avatar} size="sm" />
                            ) : (
                                slots.avatar(entry.item)
                            )}
                        </div>

                        <Surface className="comment__body" elevation={0} shape="sm">
                            {slots?.header === (void 0) ? (
                                <header className="comment__header">
                                    <span className="comment__author">{entry.item.author}</span>
                                    {entry.item.author === currentUser ? (
                                        <span className="comment__you">You</span>
                                    ) : null}
                                    {entry.item.timestamp === (void 0) ? null : (
                                        <time className="comment__time">{entry.item.timestamp}</time>
                                    )}
                                    {entry.item.resolved ? (
                                        <span className="comment__resolved">
                                            <Icon name="Check" size={13} />
                                            Resolved
                                        </span>
                                    ) : null}
                                </header>
                            ) : (
                                slots.header(entry.item)
                            )}

                            {parent === null ? null : (
                                <button
                                    type="button"
                                    className="comment__parent"
                                    onClick={(): void => {
                                        const target: HTMLElement | null = document.getElementById(
                                            `comment-${parent.id}`,
                                        );
                                        target?.scrollIntoView({ behavior: "smooth", block: "center" });
                                        target?.focus({ preventScroll: true });
                                    }}
                                >
                                    Replying to {parent.author}
                                </button>
                            )}

                            {slots?.content === (void 0) ? (
                                <div className="comment__content text">{entry.item.content}</div>
                            ) : (
                                slots.content(entry.item)
                            )}

                            {references.length === 0 ? null : (
                                <div className="comment__references">
                                    <span className="comment__references-label">In reference to</span>
                                    {references.map((reference: string): ReactNode => {
                                        const target: CommentData | null =
                                            tree.indexOf(reference) === -1
                                                ? null
                                                : tree.getItem(reference);

                                        if (target === null) {
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={reference}
                                                type="button"
                                                className="comment__reference"
                                                onClick={(): void => {
                                                    onReference?.(entry.item, target);
                                                    const node: HTMLElement | null =
                                                        document.getElementById(
                                                            `comment-${reference}`,
                                                        );
                                                    node?.scrollIntoView({
                                                        behavior: "smooth",
                                                        block: "center",
                                                    });
                                                    node?.focus({ preventScroll: true });
                                                }}
                                            >
                                                {target.author}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <footer className="comment__actions">
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        className="comment__action"
                                        aria-expanded={isExpanded}
                                        onClick={(): void => toggle(entry.key)}
                                    >
                                        <Icon
                                            name={isExpanded ? "ChevronUp" : "ChevronDown"}
                                            size={14}
                                        />
                                        {isExpanded ? "Hide" : "Show"} {tree.getChildren(entry.key).length}
                                    </button>
                                ) : null}
                                {onReply === (void 0) ? null : (
                                    <button
                                        type="button"
                                        className="comment__action"
                                        onClick={(): void => {
                                            setReplyingTo(isReplying ? null : entry.key);
                                            setDraft("");
                                        }}
                                    >
                                        Reply
                                    </button>
                                )}
                                {slots?.actions?.(entry.item)}
                            </footer>

                            {isReplying ? (
                                <div className="comment__composer">
                                    {slots?.composer === (void 0) ? (
                                        <>
                                            <Mention
                                                multiline
                                                rows={2}
                                                label={`Reply to ${entry.item.author}`}
                                                value={draft}
                                                placeholder={`Reply to ${entry.item.author}`}
                                                onChange={setDraft}
                                                onSearch={mentionSearch}
                                                suggestions={mentionSuggestions}
                                                onMention={(item: MentionItem): void =>
                                                    onMention?.(entry.item, item)
                                                }
                                            />
                                            <div className="comment__composer-actions">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={cancelReply}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={(): void => submitReply(entry.item)}
                                                >
                                                    Reply
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        slots.composer(
                                            entry.item,
                                            (body: string): void => applyReply(entry.item, body),
                                            cancelReply,
                                        )
                                    )}
                                </div>
                            ) : null}
                        </Surface>

                        {entry.level >= maxDepth && hasChildren ? (
                            <span className="comment__limit">Maximum depth reached</span>
                        ) : null}
                    </article>
                );
            })}

            {footer === (void 0) ? null : <div className="comment-thread__footer">{footer}</div>}
        </div>
    );
};

export default CommentThread;
