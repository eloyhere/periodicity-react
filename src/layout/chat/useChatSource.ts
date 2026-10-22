import { useMemo } from "react";
import type { ListAdapter, ListEntry } from "../list/adapter";
import type { ContactItem } from "../contact/adapter";
import type { MessageItem } from "../message/adapter";
import type { ChatAdapter } from "./adapter";
import { createChatAdapter } from "./adapter";
import type {
    ChatConversation,
    ChatDataSource,
    ChatDataSourceAdapter,
    ChatMessage,
} from "./model";
import { isListAdapter } from "./model";

/**
 * Input accepted by the chat data-source binder.
 * Type: interface.
 * Fields: dataSource, conversations, messages, contacts, adapter.
 * `dataSource` wins over `conversations`, which wins over the legacy `contacts`.
 * @example
 * const source = useChatSource({ dataSource });
 */
export interface ChatSourceOptions {
    dataSource?: ChatDataSource | ChatDataSourceAdapter;
    conversations?: readonly ChatConversation[];
    messages?: readonly MessageItem[];
    contacts?: readonly ContactItem[];
    adapter?: ChatAdapter;
}

/**
 * Normalised chat source shared by the normal and virtual layouts.
 * Type: interface.
 * Fields: adapter, conversationById.
 * @example
 * const { adapter, conversationById } = useChatSource({ conversations, messages });
 */
export interface ChatSource {
    adapter: ChatAdapter;
    conversationById: ReadonlyMap<string, ChatConversation>;
}

/**
 * Reads every row of a bound collection, whether it is an array or an indexed adapter.
 * @param value - Array or list adapter.
 * @example
 * const rows = collectRows(dataSource.messages);
 * @returns The rows in display order.
 */
const collectRows: <T>(value: readonly T[] | ListAdapter<T>) => readonly T[] = <T>(
    value: readonly T[] | ListAdapter<T>,
): readonly T[] =>
    isListAdapter(value)
        ? value
              .getRange(0, value.size)
              .map((entry: ListEntry<T>): T => entry.item)
        : value;

/**
 * Maps a conversation onto the contact row contract used by `Contact`.
 * @param conversation - Recent conversation.
 * @example
 * const contact = toContactItem(conversation);
 * @returns The contact row for the conversation.
 */
const toContactItem: (conversation: ChatConversation) => ContactItem = (
    conversation: ChatConversation,
): ContactItem => ({
    id: conversation.id,
    name: conversation.name,
    avatar: conversation.avatar,
    description: conversation.description,
    presence: conversation.presence,
    disabled: conversation.disabled,
});

/**
 * Builds the adapter pair and the conversation lookup.
 * @param conversations - Conversations in display order.
 * @param messages - Messages across every conversation.
 * @example
 * const source = buildSource(conversations, messages);
 * @returns The normalised chat source.
 */
const buildSource: (
    conversations: readonly ChatConversation[],
    messages: readonly MessageItem[],
) => ChatSource = (
    conversations: readonly ChatConversation[],
    messages: readonly MessageItem[],
): ChatSource => {
    const normalized: readonly MessageItem[] = messages.map((message: MessageItem): MessageItem => {
        const conversationId: string | void = (message as ChatMessage).conversationId;

        return conversationId === (void 0) ? message : { ...message, contactId: conversationId };
    });

    return {
        adapter: createChatAdapter(conversations.map(toContactItem), normalized),
        conversationById: new Map<string, ChatConversation>(
            conversations.map((conversation: ChatConversation): [string, ChatConversation] => [
                conversation.id,
                conversation,
            ]),
        ),
    };
};

/**
 * Binds a plain or indexed chat data source to the adapter pair used by the layouts.
 * @param options - Data source, conversations, messages, contacts, and legacy adapter.
 * @example
 * const { adapter } = useChatSource({ dataSource });
 * @returns The adapter pair and a conversation lookup.
 */
export const useChatSource: (options: ChatSourceOptions) => ChatSource = (
    options: ChatSourceOptions,
): ChatSource => {
    const {
        dataSource,
        conversations,
        messages = [],
        contacts = [],
        adapter,
    }: ChatSourceOptions = options;

    return useMemo((): ChatSource => {
        if (dataSource !== (void 0)) {
            return buildSource(
                collectRows<ChatConversation>(dataSource.conversations),
                collectRows<ChatMessage>(dataSource.messages),
            );
        }

        if (conversations !== (void 0)) {
            return buildSource(conversations, messages);
        }

        return {
            adapter: adapter ?? createChatAdapter(contacts, messages),
            conversationById: new Map<string, ChatConversation>(),
        };
    }, [adapter, contacts, conversations, dataSource, messages]);
};
