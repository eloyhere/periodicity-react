import type { ReactNode } from "react";
import type { ContactItem } from "../contact/adapter";
import type { MessageItem } from "../message/adapter";

/**
 * Render slots for the two-pane chat.
 * Type: interface.
 * Fields: contact, contactContext, message, beforeMessage, header, messageContext, avatar.
 * Every slot receives the index in its rendered list and the item itself.
 * @example
 * <Chat
 *     slots={{
 *         contact: (index, contact) => <strong>{contact.name}</strong>,
 *         message: (index, message) => <span>{message.content}</span>,
 *     }}
 * />
 */
export interface ChatSlots {
    /** Replaces the contents of one contact row in the contact pane. */
    contact?: (index: number, contact: ContactItem) => ReactNode;
    /** Replaces the context-menu contents for one contact. */
    contactContext?: (index: number, contact: ContactItem) => ReactNode;
    /** Replaces the bubble contents of one message in the transcript. */
    message?: (index: number, message: MessageItem) => ReactNode;
    /** Renders between the author and bubble, for example an agent's reasoning view. */
    beforeMessage?: (index: number, message: MessageItem) => ReactNode;
    /** Replaces the conversation header for the active contact or session. */
    header?: (contact: ContactItem) => ReactNode;
    /** Replaces the context-menu contents for one message. */
    messageContext?: (index: number, message: MessageItem) => ReactNode;
    /** Replaces the avatar of one message. */
    avatar?: (index: number, message: MessageItem) => ReactNode;
}
