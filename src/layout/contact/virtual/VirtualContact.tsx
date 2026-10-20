import {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ChangeEvent,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type UIEvent,
} from "react";
import Avatar from "../../../component/thumb/Avatar";
import Icon from "../../../component/icon/Icon";
import Surface from "../../../component/surface/Surface";
import Spinner from "../../../component/progress/Spinner";
import cx from "../../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../../component/foundation/useVirtualWindow";
import type { ListEntry } from "../../list/adapter";
import type { ContactAction, ContactAdapter, ContactItem, ContactPresence } from "../adapter";
import { createContactAdapter } from "../adapter";
import ContactContextMenu from "../ContactContextMenu";
import { focusListOption } from "../keyboard";
import "../Contact.css";

/**
 * Props for the virtual contact list.
 * Type: interface.
 * Fields: contacts, adapter, value, defaultValue, onValueChange, onSelect, onContactAction,
 * onContactMenuOpenChange, title, titleText, searchable, searchPlaceholder, searchLabel,
 * onSearchChange, listLabel, height, itemHeight, loading, loadingLabel, disabled, empty,
 * emptySearch, className, ref, plus native section attributes and events.
 * @example
 * <VirtualContact contacts={contacts} height={320} itemHeight={60} />
 */
export interface VirtualContactProps
    extends Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect" | "title"> {
    contacts?: readonly ContactItem[];
    adapter?: ContactAdapter;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string, contact: ContactItem) => void;
    onSelect?: (contact: ContactItem) => void;
    onContactAction?: (action: ContactAction, contact: ContactItem) => void;
    onContactMenuOpenChange?: (open: boolean, contact: ContactItem) => void;
    title?: ReactNode;
    titleText?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchLabel?: string;
    onSearchChange?: (query: string) => void;
    listLabel?: string;
    height?: number;
    itemHeight?: number;
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    empty?: ReactNode;
    emptySearch?: ReactNode;
    className?: string;
    ref?: Ref<HTMLElement>;
}

/**
 * Renders a fixed-row virtual contact list with search and selection.
 * @param props - Contacts or adapter, selection, search, loading, and window sizing.
 * @example
 * <VirtualContact contacts={contacts} height={320} />
 * @returns A virtualised contact listbox.
 */
const VirtualContact: (props: VirtualContactProps) => ReactNode = ({
    contacts = [],
    adapter,
    value,
    defaultValue = "",
    onValueChange,
    onSelect,
    onContactAction,
    onContactMenuOpenChange,
    title = "Contacts",
    titleText,
    searchable = true,
    searchPlaceholder = "Search contacts",
    searchLabel = "Search contacts",
    onSearchChange,
    listLabel = "Contact list",
    height = 320,
    itemHeight = 76,
    loading = false,
    loadingLabel = "Loading contacts",
    disabled = false,
    empty = "No contacts",
    emptySearch,
    className = "",
    "aria-label": ariaLabel,
    onKeyDown,
    onScroll,
    ref,
    ...rest
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
        onScroll: onWindowScroll,
        scrollToIndex,
    }: VirtualWindow = useVirtualWindow({
        count: rows.length,
        itemHeight,
        fallbackHeight: height,
        overscan: 2,
        resetKey: loading,
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
        if (disabled || contact.disabled === true) {
            return;
        }

        if (selected !== contact.id) {
            if (value === (void 0)) {
                setInternalValue(contact.id);
            }

            onValueChange?.(contact.id, contact);
        }

        onSelect?.(contact);
    };

    const act: (action: ContactAction, contact: ContactItem) => void = (
        action: ContactAction,
        contact: ContactItem,
    ): void => {
        if (disabled || contact.disabled === true) {
            return;
        }

        onContactAction?.(action, contact);
    };

    const handleSearch: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const next: string = event.target.value;
        setQuery(next);
        onSearchChange?.(next);
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

    const handleListKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (!disabled && focusListOption(event.currentTarget, event.key)) {
            event.preventDefault();
        }

        onKeyDown?.(event);
    };

    const handleViewportScroll: (event: UIEvent<HTMLDivElement>) => void = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        onWindowScroll(event);
        onScroll?.(event);
    };

    return (
        <section
            {...rest}
            ref={ref}
            className={cx("contact", "contact--virtual", className)}
            aria-label={ariaLabel ?? "Contacts"}
            aria-busy={loading ? "true" : (void 0)}
            title={titleText}
        >
            {title === (void 0) ? null : <h3 className="contact__title">{title}</h3>}
            {searchable ? (
                <label className="contact__search">
                    <Icon name="Search" size={16} />
                    <input
                        className="contact__search-input"
                        type="search"
                        value={query}
                        placeholder={searchPlaceholder}
                        aria-label={searchLabel}
                        disabled={disabled}
                        onChange={handleSearch}
                    />
                </label>
            ) : null}
            <div
                ref={attachViewport}
                className="contact__list"
                role="listbox"
                aria-label={listLabel}
                aria-busy={loading ? "true" : (void 0)}
                aria-disabled={disabled ? "true" : (void 0)}
                style={{ height }}
                onKeyDown={handleListKeyDown}
                onScroll={handleViewportScroll}
            >
                {loading ? (
                    <div className="contact__state">
                        <Spinner size="sm" label={loadingLabel} />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="contact__empty">
                        {normalized.length > 0 ? (emptySearch ?? empty) : empty}
                    </div>
                ) : (
                    <div className="contact__spacer" style={spacerStyle}>
                        {visible.map((contact: ContactItem, index: number): ReactNode => {
                            const contactDisabled: boolean = disabled || contact.disabled === true;
                            const rowStyle: CSSProperties = {
                                top: (start + index) * itemHeight,
                                height: itemHeight,
                            };

                            return (
                                <ContactContextMenu
                                    key={contact.id}
                                    contact={contact}
                                    onAction={act}
                                    disabled={contactDisabled}
                                    onOpenChange={(open: boolean): void =>
                                        onContactMenuOpenChange?.(open, contact)
                                    }
                                >
                                    <Surface
                                        className={cx(
                                            "contact__row",
                                            selected === contact.id && "contact__row--selected",
                                            contactDisabled && "contact__row--disabled",
                                        )}
                                        style={rowStyle}
                                        role="option"
                                        aria-selected={selected === contact.id}
                                        aria-disabled={contactDisabled ? "true" : (void 0)}
                                        tabIndex={contactDisabled ? -1 : 0}
                                        data-contact-id={contact.id}
                                        disabled={contactDisabled}
                                        ripple={{
                                            layer: "foreground",
                                            trigger: ["hover", "click"],
                                        }}
                                        onClick={(
                                            event: ReactMouseEvent<HTMLDivElement>,
                                        ): void => {
                                            if (contactDisabled) {
                                                return;
                                            }

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
