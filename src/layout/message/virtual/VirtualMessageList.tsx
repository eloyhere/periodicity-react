import {
    useLayoutEffect,
    useMemo,
    useState,
    type CSSProperties,
    type Dispatch,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type SetStateAction,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Button from "../../../component/button/Button";
import Checkbox from "../../../component/input/check/Checkbox";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import cx from "../../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../../component/foundation/useVirtualWindow";
import type { ListEntry } from "../../list/adapter";
import type { MessageAction, MessageAdapter, MessageItem } from "../adapter";
import { createMessageAdapter } from "../adapter";
import MessageContextMenu from "../MessageContextMenu";
import "../Message.css";

/**
 * Props for the virtual message list.
 * Type: interface.
 * Fields: messages, adapter, currentUser, autoScroll, onMessageAction, onQuote,
 * onForward, onDelete, onRecall, height, itemHeight, empty, className.
 * @example
 * <VirtualMessageList messages={messages} height={360} itemHeight={84} />
 */
export interface VirtualMessageListProps {
    messages?: readonly MessageItem[];
    adapter?: MessageAdapter;
    currentUser?: string;
    autoScroll?: boolean;
    onMessageAction?: (action: MessageAction, message: MessageItem) => void;
    onQuote?: (message: MessageItem) => void;
    onForward?: (messages: readonly MessageItem[]) => void;
    onDelete?: (messages: readonly MessageItem[]) => void;
    onRecall?: (message: MessageItem) => void;
    height?: number;
    itemHeight?: number;
    empty?: ReactNode;
    className?: string;
}

/**
 * Renders a fixed-row virtual chat transcript.
 * @param props - Messages or adapter, current user, and window sizing.
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
    height = 360,
    itemHeight = 84,
    empty = "No messages yet",
    className = "",
}: VirtualMessageListProps): ReactNode => {
    const [selectMode, setSelectMode]: [boolean, (next: boolean) => void] =
        useState<boolean>(false);
    const [selectedIds, setSelectedIds]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
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
        onScroll,
        scrollToBottom,
    }: VirtualWindow = useVirtualWindow({
        count: rows.length,
        itemHeight,
        fallbackHeight: height,
        overscan: 2,
    });
    const visible: readonly MessageItem[] = rows.slice(start, end);
    const spacerStyle: CSSProperties = { height: rows.length * itemHeight };

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
        if (action === "copy" && typeof message.content === "string") {
            void navigator.clipboard?.writeText(message.content);
        } else if (action === "quote") {
            onQuote?.(message);
        } else if (action === "forward") {
            onForward?.([message]);
        } else if (action === "select") {
            setSelectMode(true);
            setSelectedIds(new Set<string>([message.id]));
        } else if (action === "delete") {
            onDelete?.([message]);
        } else if (action === "recall") {
            onRecall?.(message);
        }

        onMessageAction?.(action, message);
    };

    const toggle: (id: string) => void = (id: string): void => {
        setSelectedIds((previous: ReadonlySet<string>): ReadonlySet<string> => {
            const next: Set<string> = new Set<string>(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const forwardSelected: () => void = (): void => {
        const selected: readonly MessageItem[] = rows.filter((message: MessageItem): boolean =>
            selectedIds.has(message.id),
        );

        if (selected.length > 0) {
            onForward?.(selected);
        }

        setSelectMode(false);
        setSelectedIds(new Set<string>());
    };

    return (
        <div
            ref={attachViewport}
            className={cx("message-list", "message-list--virtual", className)}
            role="log"
            aria-live="polite"
            aria-label="Messages"
            style={{ height }}
            onScroll={onScroll}
        >
            {selectMode ? (
                <div className="message-list__selection" role="toolbar" aria-label="Selection">
                    <span className="message-list__selection-count">
                        {selectedIds.size} selected
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(): void => {
                            setSelectMode(false);
                            setSelectedIds(new Set<string>());
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        disabled={selectedIds.size === 0}
                        onClick={forwardSelected}
                    >
                        Forward
                    </Button>
                </div>
            ) : null}
            {rows.length === 0 ? (
                <div className="message-list__empty">{empty}</div>
            ) : (
                <div className="message-list__spacer" style={spacerStyle}>
                    {visible.map((message: MessageItem, index: number): ReactNode => {
                        const self: boolean =
                            message.self === true || message.author === currentUser;
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
                                    selectMode && "message--selectable",
                                    selectedIds.has(message.id) && "message--selected",
                                )}
                                style={rowStyle}
                                data-status={message.status ?? (void 0)}
                                onClick={(): void => {
                                    if (selectMode) {
                                        toggle(message.id);
                                    }
                                }}
                            >
                                {selectMode ? (
                                    <span
                                        className="message__check"
                                        onClick={(event: ReactMouseEvent<HTMLSpanElement>): void => event.stopPropagation()}
                                    >
                                        <Checkbox
                                            label=""
                                            size="sm"
                                            checked={selectedIds.has(message.id)}
                                            onCheckedChange={(): void => toggle(message.id)}
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
