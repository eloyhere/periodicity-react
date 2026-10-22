import type { ReactNode } from "react";
import type { ContactItem } from "./adapter";

/**
 * Render slots for a contact list.
 * Type: interface.
 * Fields: contact, context.
 * Every slot receives the index in the rendered list and the contact itself.
 * @example
 * <Contact
 *     slots={{
 *         contact: (index, contact) => <span>{contact.name}</span>,
 *         context: (index, contact) => <ContextMenuItem>{contact.name}</ContextMenuItem>,
 *     }}
 * />
 */
export interface ContactSlots {
    /** Replaces the contents of one contact row; the row shell, selection, and ripple stay in place. */
    contact?: (index: number, contact: ContactItem) => ReactNode;
    /** Replaces the context-menu contents for one contact; the right-click zone stays in place. */
    context?: (index: number, contact: ContactItem) => ReactNode;
}
