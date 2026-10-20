import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type Context,
    type FC,
    type FocusEventHandler,
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
import useMergedRef from "../foundation/useMergedRef";
import { useAnchoredPosition, type AnchoredPositionResult, type Placement } from "../foundation/useAnchoredPosition";
import Portal from "../foundation/Portal";
import Surface from "../surface/Surface";
import Scrollbar from "../scrollbar/Scrollbar";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Dropdown.css";

/**
 * Props the dropdown passes to its trigger render prop.
 * Type: interface.
 * Fields: ref, onClick, aria-expanded, aria-haspopup, aria-controls, disabled.
 * @example
 * <Dropdown trigger={(slot: DropdownTriggerProps) => <button {...slot}>Open</button>} />
 */
export interface DropdownTriggerProps {
    ref: RefCallback<HTMLElement>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "listbox" | "menu" | "dialog";
    "aria-controls"?: string;
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

/**
 * Snapshot of the ARIA attributes the dropdown owns on an external anchor.
 * Type: interface.
 * Fields: expanded, controls.
 * @example
 * const snapshot: AnchorAriaSnapshot = { expanded: null, controls: null };
 */
interface AnchorAriaSnapshot {
    expanded: string | null;
    controls: string | null;
}

const TriggerSelector: string = [
    "button",
    "[role='button']",
    "a[href]",
    "summary",
    "select",
    "[role='combobox']",
    "[role='menuitem']",
    "[role='tab']",
].join(",");

const FocusableSelector: string = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "summary",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Reports whether an anchor natively supports the disclosure ARIA attributes.
 * @param anchor - Element held by `anchorRef`.
 * @example
 * const supported = isTriggerLike(button);
 * @returns Whether the dropdown may mirror `aria-expanded` and `aria-controls` onto it.
 */
const isTriggerLike: (anchor: HTMLElement) => boolean = (anchor: HTMLElement): boolean =>
    anchor.matches(TriggerSelector);

/**
 * Resolves the element that should carry the disclosure ARIA attributes.
 * A wrapper anchor is accepted only when it contains a single trigger-like element, so the
 * dropdown never guesses between several controls.
 * @param anchor - Element held by `anchorRef`.
 * @example
 * const target = resolveAriaTarget(wrapper);
 * @returns The trigger element, or null when the anchor is not a usable trigger.
 */
const resolveAriaTarget: (anchor: HTMLElement) => HTMLElement | null = (
    anchor: HTMLElement,
): HTMLElement | null => {
    if (isTriggerLike(anchor)) {
        return anchor;
    }

    const candidates: HTMLElement[] = Array.from(anchor.querySelectorAll<HTMLElement>(TriggerSelector));

    return candidates.length === 1 ? candidates[0] : null;
};

/**
 * Reports whether an element can receive focus and is visibly rendered.
 * @param node - Candidate focus target.
 * @example
 * const usable = isVisibleFocusable(button);
 * @returns Whether the element belongs in the Tab sequence.
 */
const isVisibleFocusable: (node: HTMLElement) => boolean = (node: HTMLElement): boolean =>
    node.getClientRects().length > 0 &&
    !node.hasAttribute("inert") &&
    node.closest("[inert]") === null &&
    !(node instanceof HTMLInputElement && node.type === "hidden");

/**
 * Collects the visible focusable descendants of an element.
 * @param container - Container element.
 * @example
 * const items = getFocusableItems(anchor);
 * @returns Focusable elements in document order.
 */
const getFocusableItems: (container: HTMLElement) => HTMLElement[] = (
    container: HTMLElement,
): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FocusableSelector)).filter(
        (node: HTMLElement): boolean => isVisibleFocusable(node),
    );

/**
 * Focuses an anchor directly, or the first focusable element inside a wrapper anchor.
 * @param anchor - Element held by `anchorRef`.
 * @example
 * focusAnchor(triggerRef.current);
 * @returns Nothing.
 */
const focusAnchor: (anchor: HTMLElement | null) => void = (anchor: HTMLElement | null): void => {
    if (anchor === null) {
        return;
    }

    if (anchor.tabIndex >= 0 || anchor.isContentEditable) {
        anchor.focus({ preventScroll: true });
        return;
    }

    const target: HTMLElement | void = getFocusableItems(anchor)[0];

    if (target !== (void 0)) {
        target.focus({ preventScroll: true });
        return;
    }

    anchor.focus({ preventScroll: true });
};

/**
 * Captures the ARIA attributes the dropdown is about to change.
 * @param anchor - External trigger element.
 * @example
 * const snapshot = captureAnchorAria(button);
 * @returns The previous attribute values.
 */
const captureAnchorAria: (anchor: HTMLElement) => AnchorAriaSnapshot = (
    anchor: HTMLElement,
): AnchorAriaSnapshot => ({
    expanded: anchor.getAttribute("aria-expanded"),
    controls: anchor.getAttribute("aria-controls"),
});

/**
 * Restores the ARIA attributes captured before the dropdown bound to the trigger.
 * @param anchor - External trigger element.
 * @param snapshot - Previous attribute values.
 * @example
 * restoreAnchorAria(button, snapshot);
 * @returns Nothing.
 */
const restoreAnchorAria: (anchor: HTMLElement, snapshot: AnchorAriaSnapshot) => void = (
    anchor: HTMLElement,
    snapshot: AnchorAriaSnapshot,
): void => {
    if (snapshot.expanded === null) {
        anchor.removeAttribute("aria-expanded");
    } else {
        anchor.setAttribute("aria-expanded", snapshot.expanded);
    }

    if (snapshot.controls === null) {
        anchor.removeAttribute("aria-controls");
    } else {
        anchor.setAttribute("aria-controls", snapshot.controls);
    }
};

/**
 * Values shared by the dropdown panel and its rows.
 * Type: interface.
 * Fields: close, closeOnSelect, getTabIndex, registerItem, role, setActive.
 * @example
 * const value: DropdownContextValue = { close, getTabIndex, registerItem, setActive, role, closeOnSelect };
 */
interface DropdownContextValue {
    close: () => void;
    closeOnSelect: boolean;
    getTabIndex: (id: string) => 0 | -1;
    registerItem: (id: string, node: HTMLButtonElement | null) => void;
    role: DropdownRole;
    setActive: (id: string) => void;
}

const DropdownContext: Context<DropdownContextValue | null> =
    createContext<DropdownContextValue | null>(null);

/**
 * Anchored dropdown with trigger, header, footer, empty, and item slots.
 * The panel owns a stable id, the trigger exposes `aria-expanded`, `aria-haspopup`, and
 * `aria-controls`, and rows share a single roving tab stop moved by the arrow keys, Home, and End.
 * Escape and Tab close the panel and return focus to the trigger; an interactive external
 * `anchorRef` target receives the same disclosure attributes when it does not define them itself.
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
    const { t }: InternationalContextValue = useInternational();
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
    const [itemIds, setItemIds]: [
        readonly string[],
        (next: (current: readonly string[]) => readonly string[]) => void,
    ] = useState<readonly string[]>([]);
    const [activeItemId, setActiveItemId]: [string | null, (next: string | null) => void] =
        useState<string | null>(null);
    const panelId: string = useId();
    const anchorNodeRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const anchorSnapshotRef: MutableRefObject<AnchorAriaSnapshot | null> = useRef<AnchorAriaSnapshot | null>(null);

    const requestClose: (reason: DropdownCloseReason) => void = useCallback(
        (reason: DropdownCloseReason): void => {
            if (reason !== "outside") {
                shouldRestoreFocusRef.current = true;
            }

            setActiveItemId(null);
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
    const registerItem: (id: string, node: HTMLButtonElement | null) => void = useCallback(
        (id: string, node: HTMLButtonElement | null): void => {
            setItemIds((current: readonly string[]): readonly string[] => {
                if (node === null) {
                    return current.includes(id)
                        ? current.filter((itemId: string): boolean => itemId !== id)
                        : current;
                }

                return current.includes(id) ? current : [...current, id];
            });
        },
        [],
    );
    const resolvedActiveId: string | null =
        activeItemId !== null && itemIds.includes(activeItemId) ? activeItemId : (itemIds[0] ?? null);
    const getTabIndex: (id: string) => 0 | -1 = useCallback(
        (id: string): 0 | -1 => (id === resolvedActiveId ? 0 : -1),
        [resolvedActiveId],
    );

    useEffect((): void => {
        if (wasOpenRef.current && !open) {
            if (restoreFocus && shouldRestoreFocusRef.current) {
                focusAnchor(resolvedAnchorRef.current);
            }

            shouldRestoreFocusRef.current = false;
        }

        wasOpenRef.current = open;
    }, [open, resolvedAnchorRef, restoreFocus]);

    useLayoutEffect((): void => {
        if (anchorRef === (void 0)) {
            return;
        }

        const anchor: HTMLElement | null = anchorRef.current;
        const target: HTMLElement | null = anchor === null ? null : resolveAriaTarget(anchor);

        if (target === null) {
            return;
        }

        const previousTarget: HTMLElement | null = anchorNodeRef.current;

        if (previousTarget !== null && previousTarget !== target && anchorSnapshotRef.current !== null) {
            restoreAnchorAria(previousTarget, anchorSnapshotRef.current);
            anchorSnapshotRef.current = null;
        }

        if (anchorSnapshotRef.current === null) {
            anchorSnapshotRef.current = captureAnchorAria(target);
        }

        anchorNodeRef.current = target;
        target.setAttribute("aria-expanded", open ? "true" : "false");

        if (open) {
            if (!target.hasAttribute("aria-controls")) {
                target.setAttribute("aria-controls", panelId);
            }

            return;
        }

        if (target.getAttribute("aria-controls") === panelId) {
            target.removeAttribute("aria-controls");
        }
    }, [anchorRef, open, panelId]);

    useEffect((): (() => void) => (): void => {
        const anchor: HTMLElement | null = anchorNodeRef.current;
        const snapshot: AnchorAriaSnapshot | null = anchorSnapshotRef.current;

        if (anchor !== null && snapshot !== null) {
            restoreAnchorAria(anchor, snapshot);
        }
    }, []);

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
            if (!event.defaultPrevented && event.key === "Escape") {
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
        if (open && present && autoFocus && panelRef.current !== null) {
            panelRef.current.focus({ preventScroll: true });
        }
    }, [open, present, autoFocus]);

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
        if (event.defaultPrevented) {
            onKeyDown?.(event);
            return;
        }

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
            event.preventDefault();
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
                  "aria-controls": open ? panelId : (void 0),
                  disabled,
              });

    const contextValue: DropdownContextValue = {
        close: (): void => requestClose("select"),
        closeOnSelect,
        getTabIndex,
        registerItem,
        role,
        setActive: setActiveItemId,
    };

    return (
        <>
            {triggerSlot}
            {present ? (
                <Portal>
                    <Surface
                        ref={panelRef}
                        id={panelId}
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
                        ripple={false}
                        tabIndex={-1}
                        role={role}
                        aria-label={ariaLabel}
                        onKeyDown={handlePanelKeyDown}
                    >
                        {header === (void 0) ? null : (
                            <div className="dropdown__header">{header}</div>
                        )}
                        <Scrollbar
                            className="dropdown__scroll"
                            viewportClassName="dropdown__body"
                            autoHide={false}
                            orientation="vertical"
                            viewportProps={{ tabIndex: -1 }}
                            scrollbarLabel="Options"
                        >
                            {isEmpty ? (
                                <div className="dropdown__empty">{empty ?? t("noResults")}</div>
                            ) : (
                                <DropdownContext.Provider value={contextValue}>
                                    {children}
                                </DropdownContext.Provider>
                            )}
                        </Scrollbar>
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
    id,
    tabIndex,
    onClick,
    onFocus,
    ...rest
}: DropdownItemProps) => {
    const itemId: string = useId();
    const context: DropdownContextValue | null = useContext(DropdownContext);
    const registerItem: ((id: string, node: HTMLButtonElement | null) => void) | void = context?.registerItem;
    const itemRole: string =
        role ??
        (context === null || context.role === "dialog"
            ? "menuitem"
            : context.role === "listbox"
              ? "option"
              : "menuitem");
    const handleRef: RefCallback<HTMLButtonElement> = useCallback(
        (node: HTMLButtonElement | null): void => {
            registerItem?.(itemId, node);
        },
        [itemId, registerItem],
    );
    const mergedRef: RefCallback<HTMLButtonElement> = useMergedRef<HTMLButtonElement>(handleRef, ref);
    const rovingTabIndex: 0 | -1 = context === null ? 0 : context.getTabIndex(itemId);

    const handleFocus: FocusEventHandler<HTMLButtonElement> = (
        event: Parameters<FocusEventHandler<HTMLButtonElement>>[0],
    ): void => {
        context?.setActive(itemId);
        onFocus?.(event);
    };

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
                ref={mergedRef}
                id={id ?? itemId}
                type="button"
                className="dropdown__item-control"
                role={itemRole}
                aria-selected={context !== null && context.role === "listbox" ? selected : (void 0)}
                aria-checked={context !== null && context.role === "menu" ? selected : (void 0)}
                disabled={disabled}
                tabIndex={tabIndex ?? rovingTabIndex}
                onClick={handleClick}
                onFocus={handleFocus}
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
