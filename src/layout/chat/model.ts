import type { ListAdapter } from "../list/adapter";
import { createListAdapter } from "../list/adapter";
import type { ReactNode } from "react";
import type { ContactPresence } from "../contact/adapter";
import type { MessageItem } from "../message/adapter";

/**
 * One recent conversation shown in the chat sidebar.
 * Type: interface.
 * Fields: id, name, avatar, description, presence, preview, timestamp, unread, pinned, muted,
 * disabled.
 * @example
 * const conversation: ChatConversation = {
 *     id: "mira",
 *     name: "Mira Chen",
 *     preview: "The cycle view is ready",
 *     timestamp: "09:41",
 *     unread: 2,
 * };
 */
export interface ChatConversation {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    presence?: ContactPresence;
    /** Last-message preview shown under the conversation name. */
    preview?: ReactNode;
    /** Last activity label, such as a time or "Yesterday". */
    timestamp?: string;
    /** Unread count; zero or absent hides the badge. */
    unread?: number;
    pinned?: boolean;
    muted?: boolean;
    disabled?: boolean;
}

/**
 * One message belonging to a conversation.
 * Type: interface.
 * Extends `MessageItem`; `conversationId` is mandatory so Chat can group the transcript.
 * @example
 * const message: ChatMessage = {
 *     id: "m1",
 *     conversationId: "mira",
 *     author: "Mira Chen",
 *     content: "Hello",
 *     timestamp: "09:41",
 * };
 */
export interface ChatMessage extends MessageItem {
    conversationId: string;
}

/**
 * Plain data source bound to a chat.
 * Type: interface.
 * Fields: conversations, messages.
 * @example
 * const dataSource: ChatDataSource = { conversations, messages };
 */
export interface ChatDataSource {
    conversations: readonly ChatConversation[];
    messages: readonly ChatMessage[];
}

/**
 * Indexed data source bound to a chat for large or externally driven collections.
 * Type: interface.
 * Fields: conversations, messages.
 * @example
 * const dataSource: ChatDataSourceAdapter = createChatDataSource(conversations, messages);
 */
export interface ChatDataSourceAdapter {
    conversations: ListAdapter<ChatConversation>;
    messages: ListAdapter<ChatMessage>;
}

/**
 * Reports whether a bound collection is already an indexed adapter.
 * @param value - Array or list adapter.
 * @example
 * const indexed = isListAdapter(dataSource.messages);
 * @returns `true` when the value exposes `getRange`.
 */
export const isListAdapter: <T>(value: readonly T[] | ListAdapter<T>) => value is ListAdapter<T> = <T>(
    value: readonly T[] | ListAdapter<T>,
): value is ListAdapter<T> =>
    !Array.isArray(value) && typeof (value as ListAdapter<T>).getRange === "function";

/**
 * Builds the indexed data source accepted by `Chat` and `VirtualChat`.
 * @param conversations - Recent conversations in display order.
 * @param messages - Messages across every conversation.
 * @example
 * const dataSource = createChatDataSource(conversations, messages);
 * @returns An adapter-backed chat data source.
 */
export const createChatDataSource: (
    conversations: readonly ChatConversation[],
    messages: readonly ChatMessage[],
) => ChatDataSourceAdapter = (
    conversations: readonly ChatConversation[],
    messages: readonly ChatMessage[],
): ChatDataSourceAdapter => ({
    conversations: createListAdapter<ChatConversation>(conversations, {
        getKey: (conversation: ChatConversation): string => conversation.id,
    }),
    messages: createListAdapter<ChatMessage>(messages, {
        getKey: (message: ChatMessage): string => message.id,
    }),
});
