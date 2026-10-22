import type { ReactNode } from "react";
import type { MessageItem } from "./adapter";

/**
 * Render slots for a message list.
 * Type: interface.
 * Fields: avatar, message, messageContext.
 * Every slot receives the index in the rendered list and the message itself.
 * @example
 * <MessageList
 *     slots={{
 *         avatar: (index, message) => <Avatar name={message.author} />,
 *         message: (index, message) => <strong>{message.content}</strong>,
 *     }}
 * />
 */
export interface MessageSlots {
    /** Replaces the avatar of one message. */
    avatar?: (index: number, message: MessageItem) => ReactNode;
    /** Replaces the bubble contents of one message; author, timestamp, and status stay in place. */
    message?: (index: number, message: MessageItem) => ReactNode;
    /** Replaces the context-menu contents for one message; the right-click zone stays in place. */
    messageContext?: (index: number, message: MessageItem) => ReactNode;
}
