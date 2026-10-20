import type { ContactAdapter, ContactItem } from "../../contact/adapter";
import { createContactAdapter } from "../../contact/adapter";
import type { ListEntry } from "../../list/adapter";
import type { MessageAdapter, MessageItem } from "../../message/adapter";
import { createMessageAdapter } from "../../message/adapter";

/**
 * Adapter bundle used by normal and virtual chat layouts.
 * Type: interface.
 * Fields: contacts, messages.
 * @example
 * const adapter = createChatAdapter(contacts, messages);
 */
export interface ChatAdapter {
    contacts: ContactAdapter;
    messages: MessageAdapter;
}

/**
 * Builds the contact and message adapters for a chat view.
 * @param contacts - Contacts in display order.
 * @param messages - Messages in transcript order.
 * @example
 * const adapter = createChatAdapter(contacts, messages);
 * @returns A chat adapter bundle.
 */
export const createChatAdapter: (
    contacts: readonly ContactItem[],
    messages: readonly MessageItem[],
) => ChatAdapter = (
    contacts: readonly ContactItem[],
    messages: readonly MessageItem[],
): ChatAdapter => ({
    contacts: createContactAdapter(contacts),
    messages: createMessageAdapter(messages),
});

/**
 * Narrows a message adapter to one conversation when messages carry a contact id.
 * @param adapter - Source message adapter.
 * @param contactId - Active contact id.
 * @example
 * const messages = conversationMessages(adapter, "mira");
 * @returns A message adapter for the conversation.
 */
export const conversationMessages: (
    adapter: MessageAdapter,
    contactId: string,
) => MessageAdapter = (
    adapter: MessageAdapter,
    contactId: string,
): MessageAdapter => {
    const items: MessageItem[] = adapter
        .getRange(0, adapter.size)
        .map((entry: ListEntry<MessageItem>): MessageItem => entry.item)
        .filter(
            (message: MessageItem): boolean =>
                message.contactId === (void 0) || message.contactId === contactId,
        );

    return createMessageAdapter(items);
};
