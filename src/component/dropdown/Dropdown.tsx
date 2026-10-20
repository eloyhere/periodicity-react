import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type Context,
    type FC,
    type HTMLAttributes,
    type KeyboardEventHandler,
    type MouseEventHandler,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Icon, { type IconName } from "../icon/Icon";
import cx from "../foundation/cx";
import { useControllableState } from "../foundation/useControllableState";
import { useDismiss } from "../foundation/useDismiss";
import { useAnchoredPosition, type AnchoredPositionResult, type Placement } from "../foundation/useAnchoredPosition";
import Portal from "../foundation/Portal";
import Surface from "../surface/Surface";
import "./Dropdown.css";

export interface DropdownTriggerProps {
    ref: RefCallback<HTMLElement>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "listbox" | "menu" | "dialog";
    disabled: boolean;
}

export type DropdownRole = "listbox" | "menu" | "dialog";

/**
 * Why the dropdown asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: DropdownCloseReason = "select";
 */
export type DropdownCloseReason = "escape" | "outside" | "select" | "tab" | "trigger";

export interface DropdownProps {
    children: ReactNode;
    trigger?: (props: DropdownTriggerProps) => ReactNode;
    anchorRef?: RefObject<HTMLElement | null>;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Called with the reason whenever the dropdown asks to close. */
    onClose?: (reason: DropdownCloseReason) => void;
    placement?: Placement;
    offset?: number;
    matchWidth?: boolean;
    header?: ReactNode;
    footer?: ReactNode;
    empty?: ReactNode;
    isEmpty?: boolean;
    role?: DropdownRole;
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
    closeOnSelect?: boolean;
    autoFocus?: boolean;
    /** Whether Escape asks the dropdown to close; defaults to `true`. */
    closeOnEscape?: boolean;
    /** Whether focus returns to the anchor after a keyboard or selection close; defaults to `true`. */
    restoreFocus?: boolean;
    /** Extra keydown handler for the panel, composed after the internal navigation keys. */
    onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}

interface DropdownContextValue {
    close: () => void;
    closeOnSelect: boolean;
    role: DropdownRole;
}

const DropdownContext: Context<DropdownContextValue | null> =
    createContext<DropdownContextValue | null>(null);

/**
 * Anchored dropdown with trigger, header, footer, empty, and item slots.
 * Type: function component.
 * @param props - Trigger slot, anchor, open state, slots, item behaviour, and close rules.
 * @example
 * <Dropdown trigger={(slot) => <button {...slot}>Open</button>} header={<Text>Recent</Text>}>
 *     <DropdownItem onSelect={select}>Alpha</DropdownItem>
 * </Dropdown>
 * @returns A dropdown trigger and, when open, a portalled panel.
 */
export const Dropdown: FC<DropdownProps> = ({
    children,
    trigger,
    anchorRef,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onClose,
    placement = "bottom-start",
    offset = 6,
    matchWidth = true,
    header,
    footer,
    empty,
    isEmpty = false,
    role = "menu",
    ariaLabel,
    disabled = false,
    className = "",
    contentClassName = "",
    closeOnSelect = true,
    autoFocus = true,
    closeOnEscape = true,
    restoreFocus = true,
    onKeyDown,
}: DropdownProps) => {
    const internalAnchorRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const wasOpenRef: MutableRefObject<boolean> = useRef<boolean>(openProp ?? defaultOpen);
    const shouldRestoreFocusRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const [open, setOpen]: readonly [boolean, (next: boolean | ((previous: boolean) => boolean)) => void] =
        useControllableState<boolean>({
            value: openProp,
            defaultValue: defaultOpen,
            onChange: onOpenChange,
        });
    const [present, setPresent]: [boolean, (next: boolean) => void] = useState<boolean>(open);
    const [closing, setClosing]: [boolean, (next: boolean) => void] = useState<boolean>(false);

    const requestClose: (reason: DropdownCloseReason) => void = useCallback(
        (reason: DropdownCloseReason): void => {
            if (reason !== "outside") {
                shouldRestoreFocusRef.current = true;
            }

            setOpen(false);
            onClose?.(reason);
        },
        [onClose, setOpen],
    );

    // Keep the panel mounted for one exit animation beat.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect((): (() => void) | void => {
        if (open) {
            setPresent(true);
            setClosing(false);
            return;
        }

        if (!present) {
            return;
        }

        setClosing(true);
        const timeout: number = window.setTimeout((): void => {
            setPresent(false);
            setClosing(false);
        }, 170);

        return (): void => {
            window.clearTimeout(timeout);
        };
    }, [open, present]);
    /* eslint-enable react-hooks/set-state-in-effect */
    const resolvedAnchorRef: RefObject<HTMLElement | null> = anchorRef ?? internalAnchorRef;
    const anchored: AnchoredPositionResult = useAnchoredPosition(resolvedAnchorRef, panelRef, {
        placement,
        offset,
        matchWidth,
    });

    useEffect((): void => {
        if (wasOpenRef.current && !open) {
            if (restoreFocus && shouldRestoreFocusRef.current) {
                resolvedAnchorRef.current?.focus({ preventScroll: true });
            }

            shouldRestoreFocusRef.current = false;
        }

        wasOpenRef.current = open;
    }, [open, resolvedAnchorRef, restoreFocus]);

    useDismiss({
        enabled: open,
        refs: [resolvedAnchorRef, panelRef],
        onDismiss: (): void => requestClose("outside"),
        escape: false,
    });

    useEffect((): (() => void) | void => {
        if (!open || !closeOnEscape) {
            return;
        }

        const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                event.stopPropagation();
                requestClose("escape");
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return (): void => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, open, requestClose]);

    useEffect((): void => {
        if (open && autoFocus && panelRef.current !== null) {
            panelRef.current.focus({ preventScroll: true });
        }
    }, [open, autoFocus]);

    const focusItem: (direction: 1 | -1 | "first" | "last") => void = (
        direction: 1 | -1 | "first" | "last",
    ): void => {
        const panel: HTMLDivElement | null = panelRef.current;

        if (panel === null) {
            return;
        }

        const items: HTMLElement[] = Array.from(
            panel.querySelectorAll<HTMLElement>(
                '[role="option"]:not(:disabled), [role="menuitem"]:not(:disabled)',
            ),
        );

        if (items.length === 0) {
            return;
        }

        const current: number = items.indexOf(document.activeElement as HTMLElement);
        let next: number;

        if (direction === "first") {
            next = 0;
        } else if (direction === "last") {
            next = items.length - 1;
        } else if (current === -1) {
            next = direction === 1 ? 0 : items.length - 1;
        } else {
            next = (current + direction + items.length) % items.length;
        }

        items[next]?.focus({ preventScroll: true });
    };

    const handlePanelKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            focusItem(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            focusItem(-1);
        } else if (event.key === "Home") {
            event.preventDefault();
            focusItem("first");
        } else if (event.key === "End") {
            event.preventDefault();
            focusItem("last");
        } else if (event.key === "Tab") {
            requestClose("tab");
        }

        onKeyDown?.(event);
    };

    const handleTriggerClick: () => void = (): void => {
        if (disabled) {
            return;
        }

        if (open) {
            requestClose("trigger");
            return;
        }

        setOpen(true);
    };

    const triggerSlot: ReactNode =
        trigger === (void 0)
            ? null
            : // The trigger is a render prop: the ref is attached to the caller's element,
              // never read during this render, so the refs rule is a false positive here.
              // eslint-disable-next-line react-hooks/refs
              trigger({
                  ref: (node: HTMLElement | null): void => {
                      internalAnchorRef.current = node;
                  },
                  onClick: handleTriggerClick,
                  "aria-expanded": open,
                  "aria-haspopup": role,
                  disabled,
              });

    const contextValue: DropdownContextValue = {
        close: (): void => requestClose("select"),
        closeOnSelect,
        role,
    };

    return (
        <>
            {triggerSlot}
            {present ? (
                <Portal>
                    <Surface
                        ref={panelRef}
                        className={cx(
                            "dropdown__panel",
                            closing && "dropdown__panel--closing",
                            contentClassName,
                            className,
                        )}
                        style={anchored.style}
                        tone="neutral"
                        elevation={3}
                        shape="md"
                        tabIndex={-1}
                        role={role}
                        aria-label={ariaLabel}
                        onKeyDown={handlePanelKeyDown}
                    >
                        {header === (void 0) ? null : (
                            <div className="dropdown__header">{header}</div>
                        )}
                        <div className="dropdown__body">
                            {isEmpty ? (
                                <div className="dropdown__empty">{empty ?? "No options"}</div>
                            ) : (
                                <DropdownContext.Provider value={contextValue}>
                                    {children}
                                </DropdownContext.Provider>
                            )}
                        </div>
                        {footer === (void 0) ? null : (
                            <div className="dropdown__footer">{footer}</div>
                        )}
                    </Surface>
                </Portal>
            ) : null}
        </>
    );
};

/**
 * Props for one dropdown row.
 * Type: interface.
 * Fields: children, onSelect, icon, description, shortcut, selected, disabled, role, className, ref,
 * plus native button attributes forwarded to the row control.
 * @example
 * <DropdownItem icon="Check" selected onSelect={choose}>Alpha</DropdownItem>
 */
export interface DropdownItemProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect" | "type" | "role"> {
    children: ReactNode;
    onSelect?: () => void;
    icon?: IconName;
    description?: ReactNode;
    shortcut?: string;
    selected?: boolean;
    role?: string;
    /** Ref for the native row button. */
    ref?: Ref<HTMLButtonElement>;
}

/**
 * Selectable dropdown row.
 * Type: function component.
 * @param props - Label, icon, description, shortcut, state, and native button attributes.
 * @example
 * <DropdownItem icon="Check" selected onSelect={choose}>Alpha</DropdownItem>
 * @returns A dropdown row.
 */
export const DropdownItem: FC<DropdownItemProps> = ({
    children,
    onSelect,
    icon,
    description,
    shortcut,
    selected = false,
    disabled = false,
    role,
    className = "",
    ref,
    onClick,
    ...rest
}: DropdownItemProps) => {
    const context: DropdownContextValue | null = useContext(DropdownContext);
    const itemRole: string =
        role ??
        (context === null || context.role === "dialog"
            ? "menuitem"
            : context.role === "listbox"
              ? "option"
              : "menuitem");

    const handleClick: MouseEventHandler<HTMLButtonElement> = (
        event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
    ): void => {
        if (!disabled) {
            onSelect?.();

            if (context !== null && context.closeOnSelect) {
                context.close();
            }
        }

        onClick?.(event);
    };

    return (
        <Surface
            className={cx(
                "dropdown__item",
                selected && "dropdown__item--selected",
                disabled && "dropdown__item--disabled",
                className,
            )}
            shape="sm"
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
        >
            <button
                {...rest}
                ref={ref}
                type="button"
                className="dropdown__item-control"
                role={itemRole}
                aria-selected={context !== null && context.role === "listbox" ? selected : (void 0)}
                aria-checked={context !== null && context.role === "menu" ? selected : (void 0)}
                disabled={disabled}
                onClick={handleClick}
            >
                {icon === (void 0) ? null : (
                    <span className="dropdown__item-icon" aria-hidden="true">
                        <Icon name={icon} size={16} />
                    </span>
                )}
                <span className="dropdown__item-text">
                    <span className="dropdown__item-label">{children}</span>
                    {description === (void 0) ? null : (
                        <span className="dropdown__item-description">{description}</span>
                    )}
                </span>
                {shortcut === (void 0) ? null : (
                    <span className="dropdown__item-shortcut">{shortcut}</span>
                )}
                {selected ? (
                    <span className="dropdown__item-check" aria-hidden="true">
                        <Icon name="Check" size={16} />
                    </span>
                ) : null}
            </button>
        </Surface>
    );
};

/**
 * Props for the dropdown separator.
 * Type: type alias.
 * Fields: native div attributes and a ref.
 * @example
 * const props: DropdownSeparatorProps = { className: "dropdown__separator--wide" };
 */
export type DropdownSeparatorProps = HTMLAttributes<HTMLDivElement> & {
    ref?: Ref<HTMLDivElement>;
};

/**
 * Horizontal separator between dropdown groups.
 * Type: function component.
 * @param props - Native div attributes and a ref.
 * @example
 * <DropdownSeparator />
 * @returns A separator element.
 */
export const DropdownSeparator: FC<DropdownSeparatorProps> = ({
    className = "",
    ref,
    ...rest
}: DropdownSeparatorProps) => (
    <div {...rest} ref={ref} className={cx("dropdown__separator", className)} role="separator" />
);

/**
 * Props for a labelled dropdown group.
 * Type: interface.
 * Fields: label, children, className, ref, plus native div attributes.
 * @example
 * <DropdownGroup label="Recent"><DropdownItem>Alpha</DropdownItem></DropdownGroup>
 */
export interface DropdownGroupProps extends HTMLAttributes<HTMLDivElement> {
    label: ReactNode;
    children: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Labelled group of dropdown items.
 * Type: function component.
 * @param props - Label, items, and native div attributes.
 * @example
 * <DropdownGroup label="Recent"><DropdownItem>Alpha</DropdownItem></DropdownGroup>
 * @returns A labelled group.
 */
export const DropdownGroup: FC<DropdownGroupProps> = ({
    label,
    children,
    className = "",
    ref,
    ...rest
}: DropdownGroupProps) => (
    <div {...rest} ref={ref} className={cx("dropdown__group", className)}>
        <div className="dropdown__group-label">{label}</div>
        {children}
    </div>
);

export default Dropdown;
