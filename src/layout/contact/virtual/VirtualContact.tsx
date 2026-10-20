import {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type MutableRefObject,
    type ReactNode,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import cx from "../../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../../component/foundation/useVirtualWindow";
import type { ListEntry } from "../../list/adapter";
import type { ContactAction, ContactAdapter, ContactItem, ContactPresence } from "../adapter";
import { createContactAdapter } from "../adapter";
import ContactContextMenu from "../ContactContextMenu";
import "../Contact.css";

/**
 * Props for the virtual contact list.
 * Type: interface.
 * Fields: contacts, adapter, value, defaultValue, onSelect, onContactAction,
 * title, searchable, height, itemHeight, empty, className.
 * @example
 * <VirtualContact contacts={contacts} height={320} itemHeight={60} />
 */
export interface VirtualContactProps {
    contacts?: readonly ContactItem[];
    adapter?: ContactAdapter;
    value?: string;
    defaultValue?: string;
    onSelect?: (contact: ContactItem) => void;
    onContactAction?: (action: ContactAction, contact: ContactItem) => void;
    title?: ReactNode;
    searchable?: boolean;
    height?: number;
    itemHeight?: number;
    empty?: ReactNode;
    className?: string;
}

/**
 * Renders a fixed-row virtual contact list.
 * @param props - Contacts or adapter, selection, search, and window sizing.
 * @example
 * <VirtualContact contacts={contacts} height={320} />
 * @returns A virtualised contact listbox.
 */
const VirtualContact: (props: VirtualContactProps) => ReactNode = ({
    contacts = [],
    adapter,
    value,
    defaultValue = "",
    onSelect,
    onContactAction,
    title = "Contacts",
    searchable = true,
    height = 320,
    itemHeight = 76,
    empty = "No contacts",
    className = "",
}: VirtualContactProps): ReactNode => {
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
    const {
        attachViewport,
        start,
        end,
        onScroll,
        scrollToIndex,
    }: VirtualWindow = useVirtualWindow({
        count: rows.length,
        itemHeight,
        fallbackHeight: height,
        overscan: 2,
    });
    const previousQueryRef: MutableRefObject<string> = useRef<string>(normalized);
    const visible: readonly ContactItem[] = rows.slice(start, end);
    const spacerStyle: CSSProperties = { height: rows.length * itemHeight };

    useLayoutEffect((): void => {
        if (previousQueryRef.current === normalized) {
            return;
        }

        previousQueryRef.current = normalized;
        scrollToIndex(0, "start");
    }, [normalized, scrollToIndex]);

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
        <section className={cx("contact", "contact--virtual", className)} aria-label="Contacts">
            {title === (void 0) ? null : <h3 className="contact__title">{title}</h3>}
            {searchable ? (
                <label className="contact__search">
                    <Icon name="Search" size={16} />
                    <input
                        className="contact__search-input"
                        type="search"
                        value={query}
                        placeholder="Search contacts"
                        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                            setQuery(event.target.value);
                        }}
                    />
                </label>
            ) : null}
            <div
                ref={attachViewport}
                className="contact__list"
                role="listbox"
                aria-label="Contact list"
                style={{ height }}
                onScroll={onScroll}
            >
                {rows.length === 0 ? (
                    <div className="contact__empty">{empty}</div>
                ) : (
                    <div className="contact__spacer" style={spacerStyle}>
                        {visible.map((contact: ContactItem, index: number): ReactNode => {
                            const rowStyle: CSSProperties = {
                                top: (start + index) * itemHeight,
                                height: itemHeight,
                            };

                            return (
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
                                        style={rowStyle}
                                        role="option"
                                        aria-selected={selected === contact.id}
                                        tabIndex={0}
                                        ripple={{
                                            layer: "foreground",
                                            trigger: ["hover", "click"],
                                        }}
                                        onClick={(
                                            event: ReactMouseEvent<HTMLDivElement>,
                                        ): void => {
                                            event.currentTarget.focus({ preventScroll: true });
                                            choose(contact);
                                        }}
                                        onKeyDown={(
                                            event: ReactKeyboardEvent<HTMLDivElement>,
                                        ): void => handleKeyDown(event, contact)}
                                    >
                                        <Avatar
                                            name={contact.name}
                                            src={contact.avatar}
                                            size="sm"
                                        />
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
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export type { ContactPresence };
export default VirtualContact;
