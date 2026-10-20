import {
    useMemo,
    useState,
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import cx from "../../../component/foundation/cx";
import type { ListEntry } from "../../list/adapter";
import type { ContactAction, ContactAdapter, ContactItem, ContactPresence } from "../adapter";
import { createContactAdapter } from "../adapter";
import ContactContextMenu from "../ContactContextMenu";
import "../Contact.css";

/**
 * Props for the normal contact list.
 * Type: interface.
 * Fields: contacts, adapter, value, defaultValue, onSelect, onContactAction,
 * title, searchable, empty, className.
 * @example
 * <Contact contacts={contacts} value={active} onSelect={setActive} />
 */
export interface ContactProps {
    contacts?: readonly ContactItem[];
    adapter?: ContactAdapter;
    value?: string;
    defaultValue?: string;
    onSelect?: (contact: ContactItem) => void;
    onContactAction?: (action: ContactAction, contact: ContactItem) => void;
    title?: ReactNode;
    searchable?: boolean;
    empty?: ReactNode;
    className?: string;
}

/**
 * Renders an adapter-backed contact list with presence and selection.
 * @param props - Contacts or adapter, selection, and search state.
 * @example
 * <Contact contacts={contacts} onSelect={openConversation} />
 * @returns A contact listbox.
 */
const Contact: (props: ContactProps) => ReactNode = ({
    contacts = [],
    adapter,
    value,
    defaultValue = "",
    onSelect,
    onContactAction,
    title = "Contacts",
    searchable = true,
    empty = "No contacts",
    className = "",
}: ContactProps): ReactNode => {
    const source: ContactAdapter = useMemo(
        (): ContactAdapter => adapter ?? createContactAdapter(contacts),
        [adapter, contacts],
    );
    const [internalValue, setInternalValue]: [string, (next: string) => void] =
        useState<string>(defaultValue);
    const [query, setQuery]: [string, (next: string) => void] = useState<string>("");
    const selected: string = value ?? internalValue;
    const normalized: string = query.trim().toLowerCase();
    const rows: readonly ContactItem[] = source
        .getRange(0, source.size)
        .map((entry: ListEntry<ContactItem>): ContactItem => entry.item)
        .filter(
            (contact: ContactItem): boolean =>
                normalized.length === 0 ||
                contact.name.toLowerCase().includes(normalized) ||
                (contact.description ?? "").toLowerCase().includes(normalized),
        );

    const choose: (contact: ContactItem) => void = (contact: ContactItem): void => {
        if (value === (void 0)) {
            setInternalValue(contact.id);
        }

        onSelect?.(contact);
    };

    const act: (action: ContactAction, contact: ContactItem) => void = (
        action: ContactAction,
        contact: ContactItem,
    ): void => {
        onContactAction?.(action, contact);
    };

    const handleKeyDown: (
        event: ReactKeyboardEvent<HTMLDivElement>,
        contact: ContactItem,
    ) => void = (event: ReactKeyboardEvent<HTMLDivElement>, contact: ContactItem): void => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            choose(contact);
        }
    };

    return (
        <section className={cx("contact", className)} aria-label="Contacts">
            {title === (void 0) ? null : <h3 className="contact__title">{title}</h3>}
            {searchable ? (
                <label className="contact__search">
                    <Icon name="Search" size={16} />
                    <input
                        className="contact__search-input"
                        type="search"
                        value={query}
                        placeholder="Search contacts"
                        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                            setQuery(event.target.value)
                        }
                    />
                </label>
            ) : null}
            <div className="contact__list" role="listbox" aria-label="Contact list">
                {rows.length === 0 ? (
                    <div className="contact__empty">{empty}</div>
                ) : (
                    rows.map((contact: ContactItem): ReactNode => (
                        <ContactContextMenu
                            key={contact.id}
                            contact={contact}
                            onAction={act}
                        >
                            <Surface
                                className={cx(
                                    "contact__row",
                                    selected === contact.id && "contact__row--selected",
                                )}
                                role="option"
                                aria-selected={selected === contact.id}
                                tabIndex={0}
                                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                                onClick={(event: ReactMouseEvent<HTMLDivElement>): void => {
                                    event.currentTarget.focus({ preventScroll: true });
                                    choose(contact);
                                }}
                                onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>): void =>
                                    handleKeyDown(event, contact)
                                }
                            >
                                <Avatar name={contact.name} src={contact.avatar} size="sm" />
                                <span className="contact__copy">
                                    <span className="contact__name">{contact.name}</span>
                                    {contact.description === (void 0) ? null : (
                                        <span className="contact__description">
                                            {contact.description}
                                        </span>
                                    )}
                                </span>
                                <span
                                    className="contact__presence"
                                    data-presence={contact.presence ?? "offline"}
                                    aria-label={contact.presence ?? "offline"}
                                />
                            </Surface>
                        </ContactContextMenu>
                    ))
                )}
            </div>
        </section>
    );
};

export type { ContactPresence };
export default Contact;
