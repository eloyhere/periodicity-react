import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type Context,
    type FC,
    type ReactNode,
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

export interface DropdownProps {
    children: ReactNode;
    trigger?: (props: DropdownTriggerProps) => ReactNode;
    anchorRef?: RefObject<HTMLElement | null>;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
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
 * @param props - Trigger slot, anchor, open state, slots, and item behaviour.
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
}: DropdownProps) => {
    const internalAnchorRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [open, setOpen]: readonly [boolean, (next: boolean | ((previous: boolean) => boolean)) => void] =
        useControllableState<boolean>({
            value: openProp,
            defaultValue: defaultOpen,
            onChange: onOpenChange,
        });
    const [present, setPresent]: [boolean, (next: boolean) => void] = useState<boolean>(open);
    const [closing, setClosing]: [boolean, (next: boolean) => void] = useState<boolean>(false);

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

    useDismiss({
        enabled: open,
        refs: [resolvedAnchorRef, panelRef],
        onDismiss: (): void => setOpen(false),
    });

    useEffect((): void => {
        if (open && autoFocus && panelRef.current !== null) {
            panelRef.current.focus({ preventScroll: true });
        }
    }, [open, autoFocus]);

    const handleTriggerClick: () => void = (): void => {
        if (!disabled) {
            setOpen(!open);
        }
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
        close: (): void => setOpen(false),
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

export interface DropdownItemProps {
    children: ReactNode;
    onSelect?: () => void;
    icon?: IconName;
    description?: ReactNode;
    shortcut?: string;
    selected?: boolean;
    disabled?: boolean;
    role?: string;
    className?: string;
}

/**
 * Selectable dropdown row.
 * Type: function component.
 * @param props - Label, icon, description, shortcut, selected and disabled states.
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
}: DropdownItemProps) => {
    const context: DropdownContextValue | null = useContext(DropdownContext);
    const itemRole: string =
        role ?? (context === null || context.role === "dialog" ? "menuitem" : context.role === "listbox" ? "option" : "menuitem");

    const handleClick: () => void = (): void => {
        if (disabled) {
            return;
        }

        onSelect?.();

        if (context !== null && context.closeOnSelect) {
            context.close();
        }
    };

    return (
        <Surface
            className={cx("dropdown__item", selected && "dropdown__item--selected", disabled && "dropdown__item--disabled", className)}
            shape="sm"
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
        >
            <button
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

export interface DropdownSeparatorProps {
    className?: string;
}

/**
 * Horizontal separator between dropdown groups.
 * Type: function component.
 * @example
 * <DropdownSeparator />
 * @returns A separator element.
 */
export const DropdownSeparator: FC<DropdownSeparatorProps> = ({ className = "" }: DropdownSeparatorProps) => (
    <div className={cx("dropdown__separator", className)} role="separator" />
);

export interface DropdownGroupProps {
    label: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * Labelled group of dropdown items.
 * Type: function component.
 * @example
 * <DropdownGroup label="Recent"><DropdownItem>Alpha</DropdownItem></DropdownGroup>
 * @returns A labelled group.
 */
export const DropdownGroup: FC<DropdownGroupProps> = ({ label, children, className = "" }: DropdownGroupProps) => (
    <div className={cx("dropdown__group", className)}>
        <div className="dropdown__group-label">{label}</div>
        {children}
    </div>
);

export default Dropdown;
