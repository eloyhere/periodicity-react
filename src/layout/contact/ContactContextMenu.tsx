import type { FC, ReactNode } from "react";
import ContextMenu, { ContextMenuItem } from "../../component/context/ContextMenu";
import type { ContactAction, ContactItem } from "./adapter";
import "./Contact.css";

/**
 * Props for the contact context-menu wrapper.
 * Type: interface.
 * Fields: contact, onAction, children.
 * @example
 * <ContactContextMenu contact={contact} onAction={act}>...</ContactContextMenu>
 */
export interface ContactContextMenuProps {
    contact: ContactItem;
    onAction: (action: ContactAction, contact: ContactItem) => void;
    children: ReactNode;
}

/**
 * Wraps a contact row in the shared ContextMenu and supplies its menu slot.
 * @param props - Contact, action handler, and row content.
 * @example
 * <ContactContextMenu contact={contact} onAction={act}>...</ContactContextMenu>
 * @returns A right-click and long-press contact zone.
 */
const ContactContextMenu: FC<ContactContextMenuProps> = ({
    contact,
    onAction,
    children,
}: ContactContextMenuProps) => (
    <ContextMenu
        className="contact-menu-zone"
        menuClassName="contact-menu"
        longPress
        header={contact.name}
        menu={
            <>
                <ContextMenuItem
                    icon="Profile"
                    onSelect={(): void => onAction("profile", contact)}
                >
                    Profile
                </ContextMenuItem>
                <ContextMenuItem
                    icon="Chat"
                    onSelect={(): void => onAction("chat", contact)}
                >
                    Chat
                </ContextMenuItem>
                <ContextMenuItem
                    icon="Close"
                    danger
                    onSelect={(): void => onAction("delete", contact)}
                >
                    Delete
                </ContextMenuItem>
                <ContextMenuItem
                    icon="RemoveUser"
                    onSelect={(): void => onAction("block", contact)}
                >
                    Block
                </ContextMenuItem>
            </>
        }
    >
        {children}
    </ContextMenu>
);

export default ContactContextMenu;
