import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type Context,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type KeyboardEventHandler,
    type MouseEventHandler,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from "react";
import Icon, { type IconName } from "../icon/Icon";
import cx from "../foundation/cx";
import Portal from "../foundation/Portal";
import useControllableState from "../foundation/useControllableState";
import useDismiss from "../foundation/useDismiss";
import useMergedRef from "../foundation/useMergedRef";
import Surface from "../surface/Surface";
import { useInternational, type InternationalContextValue } from "../../international";
import "./ContextMenu.css";

/**
 * Viewport point used to place the context menu.
 * Type: interface.
 * Fields: x, y.
 * @example
 * const point: ContextMenuPoint = { x: event.clientX, y: event.clientY };
 */
export interface ContextMenuPoint {
    x: number;
    y: number;
}

/**
 * Why the context menu asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: ContextMenuCloseReason = "select";
 */
export type ContextMenuCloseReason = "escape" | "outside" | "select" | "tab";

/**
 * Shared menu state consumed by items.
 * Type: interface.
 * Fields: close.
 * @example
 * const menu: ContextMenuContextValue = { close: () => undefined };
 */
interface ContextMenuContextValue {
    close: () => void;
}

/**
 * Props for the context menu.
 * Type: interface.
 * Fields: children, menu, header, footer, empty, disabled, open, defaultOpen, onOpenChange,
 * onClose, closeOnEscape, ariaLabel, className, menuClassName, closeOnSelect, longPress,
 * longPressDelay, ref, plus native div attributes forwarded to the trigger zone.
 * @example
 * <ContextMenu menu={<ContextMenuItem onSelect={copy}>Copy</ContextMenuItem>}>
 *     <div>Right-click this area</div>
 * </ContextMenu>
 */
export interface ContextMenuProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    menu?: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    empty?: ReactNode;
    disabled?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Called with the reason whenever the menu asks to close. */
    onClose?: (reason: ContextMenuCloseReason) => void;
    /** Whether Escape asks the menu to close; defaults to `true`. */
    closeOnEscape?: boolean;
    ariaLabel?: string;
    className?: string;
    menuClassName?: string;
    closeOnSelect?: boolean;
    longPress?: boolean;
    longPressDelay?: number;
    /** Ref for the native trigger zone element. */
    ref?: Ref<HTMLDivElement>;
}

const ContextMenuContext: Context<ContextMenuContextValue | null> =
    createContext<ContextMenuContextValue | null>(null);

const edgePadding: number = 8;

/**
 * Gives every descendant menu item a single close action.
 * @param props - Target area, slots, menu state, and native zone attributes.
 * @example
 * <ContextMenu menu={<ContextMenuItem>Copy</ContextMenuItem>}>Area</ContextMenu>
 * @returns A right-click zone and its portalled menu.
 */
const ContextMenu: FC<ContextMenuProps> = ({
    children,
    menu,
    header,
    footer,
    empty,
    disabled = false,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onClose,
    closeOnEscape = true,
    ariaLabel,
    className = "",
    menuClassName = "",
    closeOnSelect = true,
    longPress = false,
    longPressDelay = 500,
    ref,
    "aria-label": ariaLabelAttribute,
    onContextMenu,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    ...rest
}: ContextMenuProps) => {
    const { t }: InternationalContextValue = useInternational();
    const zoneRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const longPressTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const longPressPointRef: RefObject<ContextMenuPoint | null> = useRef<ContextMenuPoint | null>(
        null,
    );
    const keyboardOpened: RefObject<boolean> = useRef<boolean>(false);
    const [point, setPoint]: [ContextMenuPoint, Dispatch<SetStateAction<ContextMenuPoint>>] =
        useState<ContextMenuPoint>({ x: 0, y: 0 });
    const [position, setPosition]: [
        ContextMenuPoint,
        Dispatch<SetStateAction<ContextMenuPoint>>,
    ] = useState<ContextMenuPoint>({ x: 0, y: 0 });
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const mergedZoneRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(zoneRef, ref);

    const close: (reason?: ContextMenuCloseReason) => void = useCallback(
        (reason: ContextMenuCloseReason = "outside"): void => {
            setOpen(false);
            onClose?.(reason);

            if (keyboardOpened.current) {
                keyboardOpened.current = false;
                zoneRef.current?.focus({ preventScroll: true });
            }
        },
        [onClose, setOpen],
    );

    useDismiss({
        enabled: open,
        refs: [zoneRef, panelRef],
        onDismiss: (): void => close("outside"),
        escape: false,
    });

    useEffect((): (() => void) | void => {
        if (!open || !closeOnEscape) {
            return;
        }

        const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                close("escape");
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return (): void => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [close, closeOnEscape, open]);

    useLayoutEffect((): void => {
        const panel: HTMLDivElement | null = panelRef.current;

        if (!open || panel === null) {
            return;
        }

        const rect: DOMRect = panel.getBoundingClientRect();
        const maxX: number = Math.max(edgePadding, window.innerWidth - rect.width - edgePadding);
        const maxY: number = Math.max(edgePadding, window.innerHeight - rect.height - edgePadding);
        const next: ContextMenuPoint = {
            x: Math.min(Math.max(point.x, edgePadding), maxX),
            y: Math.min(Math.max(point.y, edgePadding), maxY),
        };

        setPosition((previous: ContextMenuPoint): ContextMenuPoint =>
            previous.x === next.x && previous.y === next.y ? previous : next,
        );
    }, [open, point]);

    useEffect((): void => {
        if (!open) {
            return;
        }

        const panel: HTMLDivElement | null = panelRef.current;

        if (panel === null) {
            return;
        }

        const first: HTMLElement | null = panel.querySelector<HTMLElement>(
            '[role="menuitem"]:not(:disabled)',
        );

        (first ?? panel).focus({ preventScroll: true });
    }, [open]);

    const openAt: (x: number, y: number, fromKeyboard: boolean) => void = (
        x: number,
        y: number,
        fromKeyboard: boolean,
    ): void => {
        if (disabled) {
            return;
        }

        keyboardOpened.current = fromKeyboard;
        setPoint({ x, y });
        setPosition({ x, y });
        setOpen(true);
    };

    const handleContextMenu: MouseEventHandler<HTMLDivElement> = (
        event: Parameters<MouseEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (!disabled) {
            event.preventDefault();
            openAt(event.clientX, event.clientY, false);
        }

        onContextMenu?.(event);
    };

    const handleZoneKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        const isMenuKey: boolean = event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");

        if (isMenuKey && !disabled) {
            event.preventDefault();
            const rect: DOMRect | undefined = zoneRef.current?.getBoundingClientRect();

            if (rect !== (void 0)) {
                openAt(rect.left + rect.width / 2, rect.top + rect.height / 2, true);
            }
        }

        onKeyDown?.(event);
    };

    const clearLongPress: () => void = (): void => {
        if (longPressTimerRef.current !== null) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        longPressPointRef.current = null;
    };

    useEffect(
        (): (() => void) => (): void => {
            clearLongPress();
        },
        [],
    );

    const handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (longPress && !disabled && event.button === 0) {
            clearLongPress();
            longPressPointRef.current = { x: event.clientX, y: event.clientY };
            longPressTimerRef.current = window.setTimeout((): void => {
                const pointAtPress: ContextMenuPoint | null = longPressPointRef.current;

                if (pointAtPress !== null) {
                    openAt(pointAtPress.x, pointAtPress.y, false);
                }
            }, longPressDelay);
        }

        onPointerDown?.(event);
    };

    const handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        const pointAtPress: ContextMenuPoint | null = longPressPointRef.current;

        if (
            pointAtPress !== null &&
            (Math.abs(event.clientX - pointAtPress.x) > 8 || Math.abs(event.clientY - pointAtPress.y) > 8)
        ) {
            clearLongPress();
        }

        onPointerMove?.(event);
    };

    const handlePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        clearLongPress();
        onPointerUp?.(event);
    };

    const handlePointerLeave: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        clearLongPress();
        onPointerLeave?.(event);
    };

    const handlePointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        clearLongPress();
        onPointerCancel?.(event);
    };

    const focusItem: (direction: 1 | -1 | "first" | "last") => void = (
        direction: 1 | -1 | "first" | "last",
    ): void => {
        const panel: HTMLDivElement | null = panelRef.current;

        if (panel === null) {
            return;
        }

        const items: HTMLElement[] = Array.from(
            panel.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'),
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
            close("tab");
        }
    };

    const contextValue: ContextMenuContextValue = {
        close: closeOnSelect ? (): void => close("select") : (): void => {},
    };
    const hasMenu: boolean = menu !== (void 0) && menu !== null && menu !== false;
    const hasHeader: boolean = header !== (void 0) && header !== null && header !== false;
    const hasFooter: boolean = footer !== (void 0) && footer !== null && footer !== false;
    const menuLabel: string = ariaLabelAttribute ?? ariaLabel ?? t("contextMenu");

    return (
        <div
            {...rest}
            ref={mergedZoneRef}
            className={cx("context-menu__zone", className)}
            onContextMenu={handleContextMenu}
            onKeyDown={handleZoneKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerCancel}
        >
            {children}

            {open ? (
                <Portal>
                    <Surface
                        ref={panelRef}
                        className={cx("context-menu__panel", menuClassName)}
                        style={{
                            position: "fixed",
                            top: position.y,
                            left: position.x,
                            zIndex: "var(--z-dropdown)",
                        }}
                        elevation={3}
                        shape="sm"
                        tone="neutral"
                        role="menu"
                        tabIndex={-1}
                        aria-label={menuLabel}
                        onKeyDown={handlePanelKeyDown}
                    >
                        {hasHeader ? <div className="context-menu__header">{header}</div> : null}

                        <div className="context-menu__body">
                            {hasMenu ? (
                                <ContextMenuContext.Provider value={contextValue}>
                                    {menu}
                                </ContextMenuContext.Provider>
                            ) : (
                                <div className="context-menu__empty">{empty ?? "No actions"}</div>
                            )}
                        </div>

                        {hasFooter ? <div className="context-menu__footer">{footer}</div> : null}
                    </Surface>
                </Portal>
            ) : null}
        </div>
    );
};

/**
 * Props for a single context-menu action.
 * Type: interface.
 * Fields: children, onSelect, icon, shortcut, selected, disabled, danger, className, ref,
 * plus native button attributes forwarded to the menu item control.
 * @example
 * <ContextMenuItem icon="Copy" onSelect={copy}>Copy</ContextMenuItem>
 */
export interface ContextMenuItemProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect" | "type" | "role"> {
    children: ReactNode;
    onSelect?: () => void;
    icon?: IconName;
    shortcut?: string;
    selected?: boolean;
    danger?: boolean;
    /** Ref for the native menu item button. */
    ref?: Ref<HTMLButtonElement>;
}

/**
 * Renders one Material menu item, closing its menu after selection.
 * Caller event handlers are composed with the internal selection behaviour.
 * @param props - Label, icon, shortcut, state, and native button attributes.
 * @example
 * <ContextMenuItem icon="Copy" shortcut="⌘C">Copy</ContextMenuItem>
 * @returns A menu item.
 */
export const ContextMenuItem: FC<ContextMenuItemProps> = ({
    children,
    onSelect,
    icon,
    shortcut,
    selected = false,
    disabled = false,
    danger = false,
    className = "",
    ref,
    onClick,
    ...rest
}: ContextMenuItemProps) => {
    const menu: ContextMenuContextValue | null = useContext(ContextMenuContext);

    const handleClick: MouseEventHandler<HTMLButtonElement> = (
        event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
    ): void => {
        if (!disabled) {
            onSelect?.();
            menu?.close();
        }

        onClick?.(event);
    };

    return (
        <Surface
            className={cx(
                "context-menu__item",
                selected && "context-menu__item--selected",
                danger && "context-menu__item--danger",
                disabled && "context-menu__item--disabled",
                className,
            )}
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            disabled={disabled}
        >
            <button
                {...rest}
                ref={ref}
                className="context-menu__item-control"
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={handleClick}
            >
                <span className="context-menu__item-icon" aria-hidden="true">
                    {icon === (void 0) ? null : <Icon name={icon} size={16} />}
                </span>
                <span className="context-menu__item-label">{children}</span>
                {shortcut === (void 0) ? null : (
                    <span className="context-menu__item-shortcut">{shortcut}</span>
                )}
                <span className="context-menu__item-check" aria-hidden="true">
                    {selected ? <Icon name="Check" size={16} /> : null}
                </span>
            </button>
        </Surface>
    );
};

/**
 * Props for the menu separator.
 * Type: type alias.
 * Fields: native div attributes and a ref.
 * @example
 * const props: ContextMenuSeparatorProps = { className: "context-menu__separator--wide" };
 */
export type ContextMenuSeparatorProps = HTMLAttributes<HTMLDivElement> & {
    ref?: Ref<HTMLDivElement>;
};

/**
 * Renders a Material menu separator.
 * @param props - Native div attributes and a ref.
 * @example
 * <ContextMenuSeparator />
 * @returns A separator.
 */
export const ContextMenuSeparator: FC<ContextMenuSeparatorProps> = ({
    className = "",
    ref,
    ...rest
}: ContextMenuSeparatorProps) => (
    <div {...rest} ref={ref} className={cx("context-menu__separator", className)} role="separator" />
);

/**
 * Props for a labelled context-menu group.
 * Type: interface.
 * Fields: label, children, className, ref, plus native div attributes.
 * @example
 * <ContextMenuGroup label="Edit">...</ContextMenuGroup>
 */
export interface ContextMenuGroupProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    children: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Groups related menu items under a small caption.
 * @param props - Group label, items, and native div attributes.
 * @example
 * <ContextMenuGroup label="Edit"><ContextMenuItem>Copy</ContextMenuItem></ContextMenuGroup>
 * @returns A labelled group.
 */
export const ContextMenuGroup: FC<ContextMenuGroupProps> = ({
    label,
    children,
    className = "",
    ref,
    ...rest
}: ContextMenuGroupProps) => (
    <div {...rest} ref={ref} className={cx("context-menu__group", className)}>
        <div className="context-menu__group-label">{label}</div>
        {children}
    </div>
);

export default ContextMenu;
