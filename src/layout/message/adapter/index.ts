import type { ListAdapter } from "../../list/adapter";
import { createListAdapter } from "../../list/adapter";
import type { ReactNode } from "react";

/**
 * Delivery status of a message.
 * Type: type alias.
 * Fields: none.
 * @example
 * const status: MessageStatus = "read";
 */
export type MessageStatus = "sending" | "sent" | "read" | "failed";

/**
 * Actions available from a message context menu.
 * Type: type alias.
 * Fields: none.
 * @example
 * const action: MessageAction = "copy";
 */
export type MessageAction =
    | "copy"
    | "forward"
    | "favourite"
    | "select"
    | "quote"
    | "delete"
    | "recall";

/**
 * One chat message.
 * Type: interface.
 * Fields: id, author, content, timestamp, avatar, self, contactId, status.
 * @example
 * const message: MessageItem = { id: "m1", author: "Mira", content: "Hello" };
 */
export interface MessageItem {
    id: string;
    author: string;
    content: ReactNode;
    timestamp?: string;
    avatar?: string;
    self?: boolean;
    contactId?: string;
    status?: MessageStatus;
}

/**
 * Indexed adapter used by normal and virtual message lists.
 * Type: type alias.
 * Fields: none.
 * @example
 * const adapter: MessageAdapter = createMessageAdapter(messages);
 */
export type MessageAdapter = ListAdapter<MessageItem>;

/**
 * Builds a message adapter keyed by message id.
 * @param messages - Messages in display order.
 * @example
 * const adapter = createMessageAdapter(messages);
 * @returns An indexed message adapter.
 */
export const createMessageAdapter: (messages: readonly MessageItem[]) => MessageAdapter = (
    messages: readonly MessageItem[],
): MessageAdapter =>
    createListAdapter<MessageItem>(messages, {
        getKey: (message: MessageItem): string => message.id,
    });
