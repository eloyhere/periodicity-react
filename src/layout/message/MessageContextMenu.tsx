import type { FC, ReactNode } from "react";
import ContextMenu, { ContextMenuItem } from "../../component/context/ContextMenu";
import type { MessageAction, MessageItem } from "./adapter";
import "./Message.css";

/**
 * Props for the message context-menu wrapper.
 * Type: interface.
 * Fields: message, self, onAction, children.
 * @example
 * <MessageContextMenu message={message} self={false} onAction={act}>...</MessageContextMenu>
 */
export interface MessageContextMenuProps {
    message: MessageItem;
    self: boolean;
    onAction: (action: MessageAction, message: MessageItem) => void;
    children: ReactNode;
}

/**
 * Wraps a message row in the shared ContextMenu and supplies its menu slot.
 * @param props - Message, ownership, action handler, and row content.
 * @example
 * <MessageContextMenu message={message} self onAction={act}>...</MessageContextMenu>
 * @returns A right-click and long-press message zone.
 */
const MessageContextMenu: FC<MessageContextMenuProps> = ({
    message,
    self,
    onAction,
    children,
}: MessageContextMenuProps) => (
    <ContextMenu
        className="message-menu-zone"
        menuClassName="message-menu"
        longPress
        header={self ? "Your message" : "Message"}
        menu={
            <>
                {self ? (
                    <ContextMenuItem
                        icon="Refresh"
                        onSelect={(): void => onAction("recall", message)}
                    >
                        Recall
                    </ContextMenuItem>
                ) : null}
                <ContextMenuItem
                    icon="Clipboard"
                    onSelect={(): void => onAction("copy", message)}
                >
                    Copy
                </ContextMenuItem>
                <ContextMenuItem
                    icon="Forward"
                    onSelect={(): void => onAction("forward", message)}
                >
                    Forward
                </ContextMenuItem>
                <ContextMenuItem
                    icon="Star"
                    onSelect={(): void => onAction("favourite", message)}
                >
                    Favourite
                </ContextMenuItem>
                <ContextMenuItem
                    icon="Select"
                    onSelect={(): void => onAction("select", message)}
                >
                    Multi-select
                </ContextMenuItem>
                <ContextMenuItem icon="Reply" onSelect={(): void => onAction("quote", message)}>
                    Quote
                </ContextMenuItem>
                <ContextMenuItem
                    icon="Close"
                    danger
                    onSelect={(): void => onAction("delete", message)}
                >
                    Delete
                </ContextMenuItem>
            </>
        }
    >
        {children}
    </ContextMenu>
);

export default MessageContextMenu;
