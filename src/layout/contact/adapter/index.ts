import type { ListAdapter } from "../../list/adapter";
import { createListAdapter } from "../../list/adapter";

/**
 * Presence state shown beside a contact.
 * Type: type alias.
 * Fields: none.
 * @example
 * const presence: ContactPresence = "online";
 */
export type ContactPresence = "online" | "away" | "busy" | "offline";

/**
 * Actions available from a contact context menu.
 * Type: type alias.
 * Fields: none.
 * @example
 * const action: ContactAction = "profile";
 */
export type ContactAction = "profile" | "chat" | "delete" | "block";

/**
 * One person in a contact list.
 * Type: interface.
 * Fields: id, name, avatar, description, presence, disabled.
 * @example
 * const contact: ContactItem = { id: "mira", name: "Mira Chen", presence: "online" };
 */
export interface ContactItem {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    presence?: ContactPresence;
    disabled?: boolean;
}

/**
 * Indexed adapter used by normal and virtual contact lists.
 * Type: type alias.
 * Fields: none.
 * @example
 * const adapter: ContactAdapter = createContactAdapter(contacts);
 */
export type ContactAdapter = ListAdapter<ContactItem>;

/**
 * Builds a contact adapter keyed by contact id.
 * @param contacts - Contacts in display order.
 * @example
 * const adapter = createContactAdapter(contacts);
 * @returns An indexed contact adapter.
 */
export const createContactAdapter: (contacts: readonly ContactItem[]) => ContactAdapter = (
    contacts: readonly ContactItem[],
): ContactAdapter =>
    createListAdapter<ContactItem>(contacts, {
        getKey: (contact: ContactItem): string => contact.id,
    });
