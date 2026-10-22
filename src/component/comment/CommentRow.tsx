import type { CSSProperties, FC, ReactNode } from "react";
import type { ListEntry } from "../../layout/list/adapter";
import { useInternational, type InternationalContextValue } from "../../international";
import Avatar from "../thumb/Avatar";
import Button from "../button/Button";
import Icon from "../icon/Icon";
import Mention, { type MentionItem } from "../mention/Mention";
import cx from "../foundation/cx";
import Surface from "../surface/Surface";
import type { CommentData, CommentThreadModel } from "./types";

/**
 * Props for one rendered comment row.
 * Type: interface.
 * Fields: model, entry, index, parent, hasChildren, isExpanded, isReplying, virtual, style,
 * className.
 * @example
 * <CommentRow model={model} entry={entry} index={0} parent={null} hasChildren={false}
 *     isExpanded={false} isReplying={false} />
 */
export interface CommentRowProps {
    model: CommentThreadModel;
    entry: ListEntry<CommentData>;
    index: number;
    parent: CommentData | null;
    hasChildren: boolean;
    isExpanded: boolean;
    isReplying: boolean;
    /** Marks the row as absolutely positioned inside a virtual spacer. */
    virtual?: boolean;
    style?: CSSProperties;
    className?: string;
}

/**
 * Renders one comment with its avatar rail, body, actions, and reply composer.
 * @param props - Shared thread model, tree entry, row flags, and virtual positioning.
 * @example
 * <CommentRow model={model} entry={entry} index={0} parent={null} hasChildren={false}
 *     isExpanded={false} isReplying={false} />
 * @returns A comment article.
 */
export const CommentRow: FC<CommentRowProps> = ({
    model,
    entry,
    index,
    parent,
    hasChildren,
    isExpanded,
    isReplying,
    virtual = false,
    style,
    className = "",
}: CommentRowProps) => {
    const { t }: InternationalContextValue = useInternational();
    const { slots }: Pick<CommentThreadModel, "slots"> = model;
    const references: readonly string[] = entry.item.references ?? [];

    return (
        <article
            id={`comment-${entry.key}`}
            data-comment-id={entry.key}
            className={cx(
                "comment",
                entry.level > 0 && "comment--reply",
                entry.item.resolved && "comment--resolved",
                virtual && "comment--virtual",
                className,
            )}
            style={{ "--comment-depth": entry.level, ...style } as CSSProperties}
            tabIndex={-1}
            aria-label={t("commentBy", { author: entry.item.author })}
        >
            {slots?.comment === (void 0) ? (
                <>
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
                                {entry.item.author === model.currentUser ? (
                                    <span className="comment__you">{t("you")}</span>
                                ) : null}
                                {entry.item.timestamp === (void 0) ? null : (
                                    <time className="comment__time">{entry.item.timestamp}</time>
                                )}
                                {entry.item.resolved ? (
                                    <span className="comment__resolved">
                                        <Icon name="Check" size={13} />
                                        {t("resolved")}
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
                                    const target: HTMLElement | null =
                                        document.getElementById(`comment-${parent.id}`);
                                    target?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                    });
                                    target?.focus({ preventScroll: true });
                                }}
                            >
                                {t("replyingTo", { author: parent.author })}
                            </button>
                        )}

                        {slots?.content === (void 0) ? (
                            <div className="comment__content text">{entry.item.content}</div>
                        ) : (
                            slots.content(entry.item)
                        )}

                        {references.length === 0 ? null : (
                            <div className="comment__references">
                                <span className="comment__references-label">
                                    {t("inReferenceTo")}
                                </span>
                                {references.map((reference: string): ReactNode => {
                                    const target: CommentData | null =
                                        model.tree.indexOf(reference) === -1
                                            ? null
                                            : model.tree.getItem(reference);

                                    if (target === null) {
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={reference}
                                            type="button"
                                            className="comment__reference"
                                            onClick={(): void => {
                                                model.onReference?.(entry.item, target);
                                                const node: HTMLElement | null =
                                                    document.getElementById(`comment-${reference}`);
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
                                    onClick={(): void => model.toggle(entry.key)}
                                >
                                    <Icon
                                        name={isExpanded ? "ChevronUp" : "ChevronDown"}
                                        size={14}
                                    />
                                    {t(isExpanded ? "hideReplies" : "showReplies", {
                                        count: model.tree.getChildren(entry.key).length,
                                    })}
                                </button>
                            ) : null}
                            {model.canReply ? (
                                <button
                                    type="button"
                                    className="comment__action"
                                    disabled={model.disabled}
                                    onClick={(): void =>
                                        model.toggleReply(entry.item, isReplying)
                                    }
                                >
                                    {t("reply")}
                                </button>
                            ) : null}
                            {model.onResolve === (void 0) ? null : (
                                <button
                                    type="button"
                                    className="comment__action"
                                    aria-pressed={entry.item.resolved === true}
                                    disabled={model.disabled}
                                    onClick={(): void =>
                                        model.onResolve?.(
                                            entry.item,
                                            entry.item.resolved !== true,
                                        )
                                    }
                                >
                                    <Icon
                                        name={
                                            entry.item.resolved === true ? "Refresh" : "Check"
                                        }
                                        size={14}
                                    />
                                    {t(entry.item.resolved === true ? "reopen" : "resolve")}
                                </button>
                            )}
                            {model.onDelete === (void 0) ? null : (
                                <button
                                    type="button"
                                    className="comment__action comment__action--danger"
                                    disabled={model.disabled}
                                    onClick={(): void => model.onDelete?.(entry.item)}
                                >
                                    {t("delete")}
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
                                            label={t("replyTo", {
                                                author: entry.item.author,
                                            })}
                                            value={model.draft}
                                            placeholder={t("replyTo", {
                                                author: entry.item.author,
                                            })}
                                            disabled={model.disabled}
                                            onChange={model.setDraft}
                                            onSearch={model.mentionSearch}
                                            suggestions={model.mentionSuggestions}
                                            onMention={(item: MentionItem): void =>
                                                model.onMention?.(entry.item, item)
                                            }
                                        />
                                        <div className="comment__composer-actions">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(): void =>
                                                    model.cancelReply(entry.item)
                                                }
                                            >
                                                {t("cancel")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={
                                                    model.disabled ||
                                                    model.draft.trim().length === 0
                                                }
                                                onClick={(): void =>
                                                    model.applyReply(
                                                        entry.item,
                                                        model.draft,
                                                    )
                                                }
                                            >
                                                {t("reply")}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    slots.composer(
                                        entry.item,
                                        (body: string): void =>
                                            model.applyReply(entry.item, body),
                                        (): void => model.cancelReply(entry.item),
                                    )
                                )}
                            </div>
                        ) : null}
                    </Surface>

                    {entry.level >= model.maxDepth && hasChildren ? (
                        <span className="comment__limit">{t("maxDepth")}</span>
                    ) : null}
                </>
            ) : (
                slots.comment(index, entry.item)
            )}
        </article>
    );
};

export default CommentRow;
