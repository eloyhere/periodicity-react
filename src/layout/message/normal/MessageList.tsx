import {
    useEffect,
    useMemo,
    useRef,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Button from "../../../component/button/Button";
import Checkbox from "../../../component/input/check/Checkbox";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import Spinner from "../../../component/progress/Spinner";
import VisuallyHidden from "../../../component/foundation/VisuallyHidden";
import cx from "../../../component/foundation/cx";
import useMergedRef from "../../../component/foundation/useMergedRef";
import type { ListEntry } from "../../list/adapter";
import type { MessageAction, MessageAdapter, MessageItem } from "../adapter";
import { createMessageAdapter } from "../adapter";
import MessageContextMenu from "../MessageContextMenu";
import type { MessageSlots } from "../slots";
import { useMessageSelection, type MessageSelection } from "../useMessageSelection";
import { useInternational, type InternationalContextValue } from "../../../international";
import "../Message.css";

/**
 * Props for the normal message list.
 * Type: interface.
 * Fields: messages, adapter, currentUser, autoScroll, onMessageAction, onQuote, onForward,
 * onDelete, onRecall, onFavourite, onCopyMessage, copyToClipboard, onRetry, onMessageClick,
 * onMessageMenuOpenChange, selectMode, defaultSelectMode, onSelectModeChange, selectedIds,
 * defaultSelectedIds, onSelectionChange, empty, loading, loadingLabel, disabled, slots, className,
 * ref, plus native div attributes and events.
 * @example
 * <MessageList messages={messages} currentUser="Mira" />
 */
export interface MessageListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    messages?: readonly MessageItem[];
    adapter?: MessageAdapter;
    currentUser?: string;
    autoScroll?: boolean;
    onMessageAction?: (action: MessageAction, message: MessageItem) => void;
    onQuote?: (message: MessageItem) => void;
    onForward?: (messages: readonly MessageItem[]) => void;
    onDelete?: (messages: readonly MessageItem[]) => void;
    onRecall?: (message: MessageItem) => void;
    onFavourite?: (message: MessageItem) => void;
    onCopyMessage?: (message: MessageItem, content: string) => void;
    copyToClipboard?: boolean;
    onRetry?: (message: MessageItem) => void;
    onMessageClick?: (message: MessageItem, event: ReactMouseEvent<HTMLDivElement>) => void;
    onMessageMenuOpenChange?: (open: boolean, message: MessageItem) => void;
    selectMode?: boolean;
    defaultSelectMode?: boolean;
    onSelectModeChange?: (selectMode: boolean) => void;
    selectedIds?: readonly string[];
    defaultSelectedIds?: readonly string[];
    onSelectionChange?: (ids: readonly string[], messages: readonly MessageItem[]) => void;
    /** Empty transcript content; defaults to the localised No messages yet label. */
    empty?: ReactNode;
    loading?: boolean;
    /** Accessible loading label; defaults to the localised Loading messages label. */
    loadingLabel?: string;
    disabled?: boolean;
    /** Per-message avatar, bubble, and context-menu render slots. */
    slots?: MessageSlots;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders an adapter-backed chat transcript with self and peer bubbles.
 * @param props - Messages or adapter, current user, selection, and native div attributes.
 * @example
 * <MessageList messages={messages} currentUser="Mira Chen" />
 * @returns A message log.
 */
const MessageList: (props: MessageListProps) => ReactNode = ({
    messages = [],
    adapter,
    currentUser = "",
    autoScroll = true,
    onMessageAction,
    onQuote,
    onForward,
    onDelete,
    onRecall,
    onFavourite,
    onCopyMessage,
    copyToClipboard = true,
    onRetry,
    onMessageClick,
    onMessageMenuOpenChange,
    selectMode: controlledSelectMode,
    defaultSelectMode = false,
    onSelectModeChange,
    selectedIds: controlledSelectedIds,
    defaultSelectedIds,
    onSelectionChange,
    empty,
    loading = false,
    loadingLabel,
    disabled = false,
    slots,
    className = "",
    "aria-label": ariaLabel,
    "aria-live": ariaLive,
    onKeyDown,
    ref,
    ...rest
}: MessageListProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedEmpty: ReactNode = empty ?? t("noMessages");
    const resolvedLoadingLabel: string = loadingLabel ?? t("loadingMessages");
    const source: MessageAdapter = useMemo(
        (): MessageAdapter => adapter ?? createMessageAdapter(messages),
        [adapter, messages],
    );
    const rows: readonly MessageItem[] = source
        .getRange(0, source.size)
        .map((entry: ListEntry<MessageItem>): MessageItem => entry.item);
    const listRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(listRef, ref);
    const selection: MessageSelection = useMessageSelection({
        rows,
        selectMode: controlledSelectMode,
        defaultSelectMode,
        onSelectModeChange,
        selectedIds: controlledSelectedIds,
        defaultSelectedIds,
        onSelectionChange,
    });

    useEffect((): void => {
        if (autoScroll && listRef.current !== null) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [autoScroll, rows.length]);

    const act: (action: MessageAction, message: MessageItem) => void = (
        action: MessageAction,
        message: MessageItem,
    ): void => {
        if (disabled || message.disabled === true) {
            return;
        }

        if (action === "copy") {
            const text: string = typeof message.content === "string" ? message.content : "";

            if (text.length > 0 && copyToClipboard) {
                void navigator.clipboard?.writeText(text);
            }

            onCopyMessage?.(message, text);
        } else if (action === "favourite") {
            onFavourite?.(message);
        } else if (action === "quote") {
            onQuote?.(message);
        } else if (action === "forward") {
            onForward?.([message]);
        } else if (action === "select") {
            selection.setSelectMode(true);
            selection.selectOnly(message.id);
        } else if (action === "delete") {
            onDelete?.([message]);
        } else if (action === "recall") {
            onRecall?.(message);
        }

        onMessageAction?.(action, message);
    };

    const forwardSelected: () => void = (): void => {
        const selected: readonly MessageItem[] = rows.filter((message: MessageItem): boolean =>
            selection.selectedIds.has(message.id),
        );

        if (selected.length > 0) {
            onForward?.(selected);
        }

        selection.clear();
    };

    const deleteSelected: () => void = (): void => {
        const selected: readonly MessageItem[] = rows.filter((message: MessageItem): boolean =>
            selection.selectedIds.has(message.id),
        );

        if (selected.length > 0) {
            onDelete?.(selected);
        }

        selection.clear();
    };

    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.key === "Escape" && selection.selectMode) {
            event.preventDefault();
            selection.clear();
        }

        onKeyDown?.(event);
    };

    return (
        <div
            {...rest}
            ref={mergedRef}
            className={cx("message-list", className)}
            role="log"
            aria-live={ariaLive ?? "polite"}
            aria-label={ariaLabel ?? t("messages")}
            aria-busy={loading ? "true" : (void 0)}
            aria-disabled={disabled ? "true" : (void 0)}
            onKeyDown={handleKeyDown}
        >
            {selection.selectMode && !loading ? (
                <div className="message-list__selection" role="toolbar" aria-label={t("selection")}>
                    <span className="message-list__selection-count">
                        {t("selectedCount", { count: selection.selectedIds.size })}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={(): void => selection.clear()}
                    >
                        {t("cancel")}
                    </Button>
                    {onDelete === (void 0) ? null : (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled || selection.selectedIds.size === 0}
                            onClick={deleteSelected}
                        >
                            {t("delete")}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        disabled={disabled || selection.selectedIds.size === 0}
                        onClick={forwardSelected}
                    >
                        {t("forward")}
                    </Button>
                </div>
            ) : null}
            {loading ? (
                <div className="message-list__state">
                    <Spinner size="sm" label={resolvedLoadingLabel} />
                </div>
            ) : rows.length === 0 ? (
                <div className="message-list__empty">{resolvedEmpty}</div>
            ) : (
                rows.map((message: MessageItem, index: number): ReactNode => {
                    const self: boolean = message.self === true || message.author === currentUser;
                    const messageDisabled: boolean = disabled || message.disabled === true;

                    return (
                        <div
                            key={message.id}
                            className={cx(
                                "message",
                                self && "message--self",
                                selection.selectMode && "message--selectable",
                                selection.selectedIds.has(message.id) && "message--selected",
                                messageDisabled && "message--disabled",
                            )}
                            data-message-id={message.id}
                            data-status={message.status ?? (void 0)}
                            aria-disabled={messageDisabled ? "true" : (void 0)}
                            onClick={(event: ReactMouseEvent<HTMLDivElement>): void => {
                                if (messageDisabled) {
                                    return;
                                }

                                if (selection.selectMode) {
                                    selection.toggle(message.id);
                                }

                                onMessageClick?.(message, event);
                            }}
                        >
                            {selection.selectMode ? (
                                <span
                                    className="message__check"
                                    onClick={(
                                        event: ReactMouseEvent<HTMLSpanElement>,
                                    ): void => event.stopPropagation()}
                                >
                                    <Checkbox
                                        size="sm"
                                        disabled={messageDisabled}
                                        checked={selection.selectedIds.has(message.id)}
                                        onCheckedChange={(): void =>
                                            selection.toggle(message.id)
                                        }
                                        label={
                                            <VisuallyHidden>
                                                {`Select message from ${message.author}`}
                                            </VisuallyHidden>
                                        }
                                    />
                                </span>
                            ) : null}
                            {slots?.avatar === (void 0) ? (
                                <Avatar name={message.author} src={message.avatar} size="sm" />
                            ) : (
                                slots.avatar(index, message)
                            )}
                            <div className="message__body">
                                {self ? null : (
                                    <span className="message__author">{message.author}</span>
                                )}
                                <MessageContextMenu
                                    message={message}
                                    self={self}
                                    onAction={act}
                                    disabled={messageDisabled}
                                    menu={slots?.messageContext?.(index, message)}
                                    onOpenChange={(open: boolean): void =>
                                        onMessageMenuOpenChange?.(open, message)
                                    }
                                >
                                    <Surface
                                        className="message__bubble"
                                        ripple={{
                                            layer: "foreground",
                                            trigger: ["hover", "click"],
                                        }}
                                    >
                                        {slots?.message === (void 0)
                                            ? message.content
                                            : slots.message(index, message)}
                                    </Surface>
                                </MessageContextMenu>
                                <div className="message__meta">
                                    {message.timestamp === (void 0) ? null : (
                                        <time className="message__time">{message.timestamp}</time>
                                    )}
                                    {self && message.status !== (void 0) ? (
                                        <span
                                            className={cx(
                                                "message__status",
                                                message.status === "read" &&
                                                    "message__status--read",
                                            )}
                                            data-status={message.status}
                                            aria-label={message.status}
                                        >
                                            {message.status === "read" ? (
                                                <>
                                                    <Icon name="Check" size={12} />
                                                    <Icon name="Check" size={12} />
                                                </>
                                            ) : (
                                                <Icon
                                                    name={
                                                        message.status === "failed"
                                                            ? "Error"
                                                            : message.status === "sending"
                                                              ? "Clock"
                                                              : "Check"
                                                    }
                                                    size={12}
                                                />
                                            )}
                                        </span>
                                    ) : null}
                                    {message.status === "failed" && onRetry !== (void 0) ? (
                                        <button
                                            type="button"
                                            className="message__retry"
                                            disabled={messageDisabled}
                                            onClick={(
                                                event: ReactMouseEvent<HTMLButtonElement>,
                                            ): void => {
                                                event.stopPropagation();
                                                onRetry(message);
                                            }}
                                        >
                                            {t("retry")}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MessageList;
