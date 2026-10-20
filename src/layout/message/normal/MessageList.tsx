import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Button from "../../../component/button/Button";
import Checkbox from "../../../component/input/check/Checkbox";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import cx from "../../../component/foundation/cx";
import type { ListEntry } from "../../list/adapter";
import type { MessageAction, MessageAdapter, MessageItem } from "../adapter";
import { createMessageAdapter } from "../adapter";
import MessageContextMenu from "../MessageContextMenu";
import "../Message.css";

/**
 * Props for the normal message list.
 * Type: interface.
 * Fields: messages, adapter, currentUser, autoScroll, onMessageAction, onQuote,
 * onForward, onDelete, onRecall, empty, className.
 * @example
 * <MessageList messages={messages} currentUser="Mira" />
 */
export interface MessageListProps {
    messages?: readonly MessageItem[];
    adapter?: MessageAdapter;
    currentUser?: string;
    autoScroll?: boolean;
    onMessageAction?: (action: MessageAction, message: MessageItem) => void;
    onQuote?: (message: MessageItem) => void;
    onForward?: (messages: readonly MessageItem[]) => void;
    onDelete?: (messages: readonly MessageItem[]) => void;
    onRecall?: (message: MessageItem) => void;
    empty?: ReactNode;
    className?: string;
}

/**
 * Renders an adapter-backed chat transcript with self and peer bubbles.
 * @param props - Messages or adapter and the current user name.
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
    empty = "No messages yet",
    className = "",
}: MessageListProps): ReactNode => {
    const source: MessageAdapter = useMemo(
        (): MessageAdapter => adapter ?? createMessageAdapter(messages),
        [adapter, messages],
    );
    const [selectMode, setSelectMode]: [boolean, (next: boolean) => void] =
        useState<boolean>(false);
    const [selectedIds, setSelectedIds]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const listRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const rows: readonly MessageItem[] = source
        .getRange(0, source.size)
        .map((entry: ListEntry<MessageItem>): MessageItem => entry.item);

    useEffect((): void => {
        if (autoScroll && listRef.current !== null) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [autoScroll, rows.length]);

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
            ref={listRef}
            className={cx("message-list", className)}
            role="log"
            aria-live="polite"
            aria-label="Messages"
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
                rows.map((message: MessageItem): ReactNode => {
                    const self: boolean = message.self === true || message.author === currentUser;

                    return (
                        <div
                            key={message.id}
                            className={cx(
                                "message",
                                self && "message--self",
                                selectMode && "message--selectable",
                                selectedIds.has(message.id) && "message--selected",
                            )}
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
                                <MessageContextMenu message={message} self={self} onAction={act}>
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
                })
            )}
        </div>
    );
};

export default MessageList;
