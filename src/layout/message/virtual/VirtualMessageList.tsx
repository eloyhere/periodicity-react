import {
    useCallback,
    useLayoutEffect,
    useMemo,
    type CSSProperties,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type UIEvent,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Button from "../../../component/button/Button";
import Checkbox from "../../../component/input/check/Checkbox";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import Spinner from "../../../component/progress/Spinner";
import VisuallyHidden from "../../../component/foundation/VisuallyHidden";
import cx from "../../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../../component/foundation/useVirtualWindow";
import type { ListEntry } from "../../list/adapter";
import type { MessageAction, MessageAdapter, MessageItem } from "../adapter";
import { createMessageAdapter } from "../adapter";
import MessageContextMenu from "../MessageContextMenu";
import { useMessageSelection, type MessageSelection } from "../useMessageSelection";
import "../Message.css";

/**
 * Props for the virtual message list.
 * Type: interface.
 * Fields: messages, adapter, currentUser, autoScroll, onMessageAction, onQuote, onForward,
 * onDelete, onRecall, onFavourite, onCopyMessage, copyToClipboard, onRetry, onMessageClick,
 * onMessageMenuOpenChange, selectMode, defaultSelectMode, onSelectModeChange, selectedIds,
 * defaultSelectedIds, onSelectionChange, height, itemHeight, empty, loading, loadingLabel,
 * disabled, className, ref, plus native div attributes and events.
 * @example
 * <VirtualMessageList messages={messages} height={360} itemHeight={84} />
 */
export interface VirtualMessageListProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
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
    height?: number;
    itemHeight?: number;
    empty?: ReactNode;
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a fixed-row virtual chat transcript with selection and loading states.
 * @param props - Messages or adapter, current user, selection, and window sizing.
 * @example
 * <VirtualMessageList messages={messages} height={360} />
 * @returns A virtualised message log.
 */
const VirtualMessageList: (props: VirtualMessageListProps) => ReactNode = ({
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
    height = 360,
    itemHeight = 84,
    empty = "No messages yet",
    loading = false,
    loadingLabel = "Loading messages",
    disabled = false,
    className = "",
    style,
    "aria-label": ariaLabel,
    "aria-live": ariaLive,
    onKeyDown,
    onScroll,
    ref,
    ...rest
}: VirtualMessageListProps): ReactNode => {
    const source: MessageAdapter = useMemo(
        (): MessageAdapter => adapter ?? createMessageAdapter(messages),
        [adapter, messages],
    );
    const rows: readonly MessageItem[] = source
        .getRange(0, source.size)
        .map((entry: ListEntry<MessageItem>): MessageItem => entry.item);
    const firstKey: string = source.size > 0 ? source.getKey(0) : "";
    const lastKey: string = source.size > 0 ? source.getKey(source.size - 1) : "";
    const {
        attachViewport,
        start,
        end,
        onScroll: onWindowScroll,
        scrollToBottom,
    }: VirtualWindow = useVirtualWindow({
        count: rows.length,
        itemHeight,
        fallbackHeight: height,
        overscan: 2,
        resetKey: loading,
    });
    const selection: MessageSelection = useMessageSelection({
        rows,
        selectMode: controlledSelectMode,
        defaultSelectMode,
        onSelectModeChange,
        selectedIds: controlledSelectedIds,
        defaultSelectedIds,
        onSelectionChange,
    });
    const visible: readonly MessageItem[] = rows.slice(start, end);
    const spacerStyle: CSSProperties = { height: rows.length * itemHeight };

    /**
     * Attaches the virtual viewport while forwarding the caller ref.
     */
    const mergedViewportRef: RefCallback<HTMLDivElement> = useCallback(
        (node: HTMLDivElement | null): (() => void) | void => {
            const releaseViewport: (() => void) | void = attachViewport(node);

            if (node === null) {
                if (typeof ref === "function") {
                    ref(null);
                } else if (ref !== null && ref !== (void 0)) {
                    ref.current = null;
                }

                return releaseViewport;
            }

            let releaseCaller: (() => void) | void = (void 0);

            if (typeof ref === "function") {
                const callerRelease: (() => void) | void = ref(node);
                releaseCaller =
                    typeof callerRelease === "function"
                        ? callerRelease
                        : (): void => {
                              ref(null);
                          };
            } else if (ref !== null && ref !== (void 0)) {
                ref.current = node;
                releaseCaller = (): void => {
                    ref.current = null;
                };
            }

            return (): void => {
                if (typeof releaseCaller === "function") {
                    releaseCaller();
                }

                if (typeof releaseViewport === "function") {
                    releaseViewport();
                }
            };
        },
        [attachViewport, ref],
    );

    useLayoutEffect((): void => {
        if (!autoScroll) {
            return;
        }

        scrollToBottom();
    }, [autoScroll, firstKey, lastKey, rows.length, scrollToBottom]);

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

    const handleScroll: (event: UIEvent<HTMLDivElement>) => void = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        onWindowScroll(event);
        onScroll?.(event);
    };

    return (
        <div
            {...rest}
            ref={mergedViewportRef}
            className={cx("message-list", "message-list--virtual", className)}
            role="log"
            aria-live={ariaLive ?? "polite"}
            aria-label={ariaLabel ?? "Messages"}
            aria-busy={loading ? "true" : (void 0)}
            aria-disabled={disabled ? "true" : (void 0)}
            style={{ height, ...style }}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
        >
            {selection.selectMode && !loading ? (
                <div className="message-list__selection" role="toolbar" aria-label="Selection">
                    <span className="message-list__selection-count">
                        {selection.selectedIds.size} selected
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={(): void => selection.clear()}
                    >
                        Cancel
                    </Button>
                    {onDelete === (void 0) ? null : (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled || selection.selectedIds.size === 0}
                            onClick={deleteSelected}
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        size="sm"
                        disabled={disabled || selection.selectedIds.size === 0}
                        onClick={forwardSelected}
                    >
                        Forward
                    </Button>
                </div>
            ) : null}
            {loading ? (
                <div className="message-list__state">
                    <Spinner size="sm" label={loadingLabel} />
                </div>
            ) : rows.length === 0 ? (
                <div className="message-list__empty">{empty}</div>
            ) : (
                <div className="message-list__spacer" style={spacerStyle}>
                    {visible.map((message: MessageItem, index: number): ReactNode => {
                        const self: boolean =
                            message.self === true || message.author === currentUser;
                        const messageDisabled: boolean = disabled || message.disabled === true;
                        const rowStyle: CSSProperties = {
                            top: (start + index) * itemHeight,
                            height: itemHeight,
                        };

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
                                style={rowStyle}
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
                                <Avatar
                                    name={message.author}
                                    src={message.avatar}
                                    size="sm"
                                />
                                <div className="message__body">
                                    {self ? null : (
                                        <span className="message__author">{message.author}</span>
                                    )}
                                    <MessageContextMenu
                                        message={message}
                                        self={self}
                                        onAction={act}
                                        disabled={messageDisabled}
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
                                            {message.content}
                                        </Surface>
                                    </MessageContextMenu>
                                    <div className="message__meta">
                                        {message.timestamp === (void 0) ? null : (
                                            <time className="message__time">
                                                {message.timestamp}
                                            </time>
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
                                                Retry
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VirtualMessageList;
