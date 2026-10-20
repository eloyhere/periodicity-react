import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type Context,
    type Dispatch,
    type FC,
    type FocusEventHandler,
    type HTMLAttributes,
    type KeyboardEvent,
    type KeyboardEventHandler,
    type MouseEvent as ReactMouseEvent,
    type MouseEventHandler,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from "react";
import cx from "../../component/foundation/cx";
import useControllableState from "../../component/foundation/useControllableState";
import useMergedRef from "../../component/foundation/useMergedRef";
import type { Placement } from "../../component/foundation/useAnchoredPosition";
import { useRovingTabIndex, type RovingTabIndexResult } from "../../component/foundation/useRovingTabIndex";
import Icon, { type IconName } from "../../component/icon/Icon";
import Popover from "../../component/popover/Popover";
import Surface from "../../component/surface/Surface";
import Text from "../../component/text/Text";
import "./Menu.css";

/**
 * Values shared by menu items and the menu root.
 * Type: interface.
 * @param getTabIndex - Resolves the roving tab stop for an item id.
 * @param registerItem - Registers or unregisters an item's button node.
 * @param setActive - Marks the item that owns the roving tab stop.
 * @param select - Runs a selection action and closes the menu.
 * @example
 * const value: MenuContextValue = { getTabIndex, registerItem, setActive, select };
 */
interface MenuContextValue {
    getTabIndex: (id: string) => 0 | -1;
    registerItem: (id: string, node: HTMLButtonElement | null) => void;
    setActive: (id: string) => void;
    select: (
        event: ReactMouseEvent<HTMLButtonElement>,
        onSelect?: (event: ReactMouseEvent<HTMLButtonElement>) => void,
    ) => void;
}

const MenuContext: Context<MenuContextValue | null> = createContext<MenuContextValue | null>(null);

/**
 * Props for the menu root.
 * Type: interface.
 * @param open - Controlled visibility state; omit for an uncontrolled menu.
 * @param defaultOpen - Initial visibility when the menu is uncontrolled.
 * @param onOpenChange - Called with the requested open state.
 * @param anchorRef - Trigger element the menu is anchored to.
 * @param children - Menu items, groups, and separators.
 * @param placement - Preferred menu placement relative to the trigger.
 * @param ariaLabel - Accessible name announced for the menu.
 * @param className - Extra class applied to the menu panel.
 * @param ref - Ref forwarded to the menu panel.
 * @example
 * <Menu open={open} onOpenChange={setOpen} anchorRef={buttonRef}>
 *     <MenuItem onSelect={rename}>Rename</MenuItem>
 * </Menu>
 */
export interface MenuProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    anchorRef: RefObject<HTMLElement | null>;
    children: ReactNode;
    placement?: Placement;
    ariaLabel?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Menu root with compound subcomponents.
 * Type: interface.
 * @param Item - Selectable menu row.
 * @param Separator - Thin divider between groups of items.
 * @param Group - Labelled group of related items.
 * @example
 * <Menu.Item onSelect={rename}>Rename</Menu.Item>
 */
export interface MenuComponent extends FC<MenuProps> {
    Item: FC<MenuItemProps>;
    Separator: FC<MenuSeparatorProps>;
    Group: FC<MenuGroupProps>;
}

/**
 * Props for a selectable menu row.
 * Type: interface.
 * @param children - Visible row label.
 * @param onSelect - Runs after the row is activated and before the menu closes.
 * @param icon - Optional leading icon.
 * @param disabled - Keeps the row visible but prevents selection.
 * @param shortcut - Optional keyboard hint shown at the row end.
 * @param selected - Marks a radio-style selection and exposes it to assistive technology.
 * @param className - Extra class applied to the row surface.
 * @param ref - Ref forwarded to the row button.
 * @example
 * <MenuItem icon="Refresh" shortcut="R" onSelect={refresh}>Refresh</MenuItem>
 */
export interface MenuItemProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled" | "onSelect"> {
    children: ReactNode;
    onSelect?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    icon?: IconName;
    disabled?: boolean;
    shortcut?: string;
    selected?: boolean;
    className?: string;
    ref?: Ref<HTMLButtonElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Props for a menu separator.
 * Type: interface.
 * @param className - Extra class applied to the separator.
 * @param ref - Ref forwarded to the separator element.
 * @example
 * <MenuSeparator className="menu__separator--wide" />
 */
export interface MenuSeparatorProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    className?: string;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Props for a labelled menu group.
 * Type: interface.
 * @param label - Group heading text.
 * @param children - Items belonging to the group.
 * @param className - Extra class applied to the group wrapper.
 * @param ref - Ref forwarded to the group wrapper.
 * @example
 * <MenuGroup label="Actions"><MenuItem onSelect={archive}>Archive</MenuItem></MenuGroup>
 */
export interface MenuGroupProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    label: string;
    children: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Implements the APG menu pattern: roving tab stop, arrow keys, Home/End, and focus return.
 * @param props - Open state, anchor, placement, native panel attributes, and composed menu children.
 * @example
 * <Menu open={open} onOpenChange={setOpen} anchorRef={triggerRef}>
 *     <MenuItem onSelect={copy}>Copy</MenuItem>
 * </Menu>
 * @returns A popover containing the menu surface.
 */
const MenuRoot: FC<MenuProps> = ({
    open,
    defaultOpen,
    onOpenChange,
    anchorRef,
    children,
    placement = "bottom-start",
    ariaLabel,
    className = "",
    ref,
    onKeyDown,
    "aria-label": ariaLabelAttribute,
    ...rest
}: MenuProps) => {
    const [itemIds, setItemIds]: [readonly string[], Dispatch<SetStateAction<readonly string[]>>] =
        useState<readonly string[]>([]);
    const [activeId, setActiveId]: [string | null, Dispatch<SetStateAction<string | null>>] =
        useState<string | null>(null);
    const nodesRef: MutableRefObject<Record<string, HTMLButtonElement>> = useRef<
        Record<string, HTMLButtonElement>
    >({});
    const [resolvedOpen, setOpen]: readonly [boolean, (next: boolean | ((previous: boolean) => boolean)) => void] =
        useControllableState<boolean>({
            value: open,
            defaultValue: defaultOpen ?? false,
            onChange: onOpenChange,
        });
    const resolvedAriaLabel: string = ariaLabel ?? ariaLabelAttribute ?? "Menu";

    const registerItem: (id: string, node: HTMLButtonElement | null) => void = useCallback(
        (id: string, node: HTMLButtonElement | null): void => {
            if (node === null) {
                delete nodesRef.current[id];
                setItemIds((current: readonly string[]): readonly string[] =>
                    current.includes(id) ? current.filter((itemId: string): boolean => itemId !== id) : current,
                );
                return;
            }

            nodesRef.current[id] = node;
            setItemIds((current: readonly string[]): readonly string[] =>
                current.includes(id) ? current : [...current, id],
            );
        },
        [],
    );

    const handleOpenChange: (nextOpen: boolean) => void = useCallback(
        (nextOpen: boolean): void => {
            if (!nextOpen) {
                setActiveId(null);
            }

            setOpen(nextOpen);
        },
        [setOpen],
    );

    const closeAndRestoreFocus: () => void = useCallback((): void => {
        handleOpenChange(false);
        anchorRef.current?.focus({ preventScroll: true });
    }, [anchorRef, handleOpenChange]);

    const handleSelect: (
        event: ReactMouseEvent<HTMLButtonElement>,
        onSelect?: (event: ReactMouseEvent<HTMLButtonElement>) => void,
    ) => void = useCallback(
        (
            event: ReactMouseEvent<HTMLButtonElement>,
            onSelect?: (event: ReactMouseEvent<HTMLButtonElement>) => void,
        ): void => {
            onSelect?.(event);
            closeAndRestoreFocus();
        },
        [closeAndRestoreFocus],
    );

    const firstItemId: string | null = itemIds.length > 0 ? itemIds[0] : null;
    const resolvedActiveId: string | null =
        activeId !== null && itemIds.includes(activeId) ? activeId : firstItemId;
    const activeIndex: number = resolvedActiveId === null ? 0 : itemIds.indexOf(resolvedActiveId);

    const handleRovingChange: (index: number) => void = useCallback(
        (index: number): void => {
            const nextId: string | void = itemIds[index];

            if (nextId === (void 0)) {
                return;
            }

            setActiveId(nextId);
        },
        [itemIds],
    );

    const { tabIndexFor, onKeyDown: handleRovingKeyDown }: RovingTabIndexResult = useRovingTabIndex({
        count: itemIds.length,
        activeIndex,
        onChange: handleRovingChange,
        orientation: "vertical",
    });

    const getTabIndex: (id: string) => 0 | -1 = useCallback(
        (id: string): 0 | -1 => {
            const index: number = itemIds.indexOf(id);

            return index >= 0 ? tabIndexFor(index) : -1;
        },
        [itemIds, tabIndexFor],
    );

    const handleMenuKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: KeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeAndRestoreFocus();
        } else if (event.key === "Tab") {
            handleOpenChange(false);
            anchorRef.current?.focus({ preventScroll: true });
        } else {
            handleRovingKeyDown(event);
        }

        onKeyDown?.(event);
    };

    useEffect((): void => {
        if (!resolvedOpen || resolvedActiveId === null) {
            return;
        }

        const node: HTMLButtonElement | void = nodesRef.current[resolvedActiveId];

        if (node !== (void 0) && document.activeElement !== node) {
            node.focus();
        }
    }, [resolvedOpen, resolvedActiveId]);

    const contextValue: MenuContextValue = useMemo<MenuContextValue>(
        () => ({ getTabIndex, registerItem, setActive: setActiveId, select: handleSelect }),
        [getTabIndex, handleSelect, registerItem],
    );

    return (
        <Popover
            open={resolvedOpen}
            onOpenChange={handleOpenChange}
            anchorRef={anchorRef}
            placement={placement}
        >
            <MenuContext.Provider value={contextValue}>
                <div
                    {...rest}
                    ref={ref}
                    className={cx("menu", className)}
                    role="menu"
                    aria-label={resolvedAriaLabel}
                    onKeyDown={handleMenuKeyDown}
                >
                    {children}
                </div>
            </MenuContext.Provider>
        </Popover>
    );
};

/**
 * Renders a selectable menu row on a rippling Surface.
 * @param props - Label, selection callback, icon, shortcut, native button attributes, and disabled state.
 * @example
 * <MenuItem icon="Check" selected onSelect={apply}>Apply</MenuItem>
 * @returns A menu row button.
 */
export const MenuItem: FC<MenuItemProps> = ({
    children,
    onSelect,
    icon,
    disabled = false,
    shortcut,
    selected,
    className = "",
    ref,
    onClick,
    onFocus,
    type = "button",
    id,
    tabIndex,
    ...rest
}: MenuItemProps) => {
    const itemId: string = useId();
    const menuContext: MenuContextValue | null = useContext(MenuContext);
    const registerItem: ((id: string, node: HTMLButtonElement | null) => void) | void =
        menuContext?.registerItem;
    const handleRef: RefCallback<HTMLButtonElement> = useCallback(
        (node: HTMLButtonElement | null): void => {
            registerItem?.(itemId, node);
        },
        [itemId, registerItem],
    );
    const mergedRef: RefCallback<HTMLButtonElement> = useMergedRef(handleRef, ref);
    const rovingTabIndex: 0 | -1 = menuContext === null ? 0 : menuContext.getTabIndex(itemId);

    const handleFocus: FocusEventHandler<HTMLButtonElement> = (
        event: Parameters<FocusEventHandler<HTMLButtonElement>>[0],
    ): void => {
        menuContext?.setActive(itemId);
        onFocus?.(event);
    };

    const handleClick: MouseEventHandler<HTMLButtonElement> = (
        event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
    ): void => {
        if (!disabled) {
            menuContext?.select(event, onSelect);
        }

        onClick?.(event);
    };

    return (
        <Surface
            className={cx("menu__item", className)}
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            disabled={disabled}
        >
            <button
                {...rest}
                ref={mergedRef}
                type={type}
                id={id ?? itemId}
                className="menu__item-control"
                role={selected === (void 0) ? "menuitem" : "menuitemradio"}
                aria-checked={selected}
                aria-disabled={disabled ? true : (void 0)}
                data-selected={selected === true ? "true" : "false"}
                data-disabled={disabled ? "true" : "false"}
                tabIndex={tabIndex ?? rovingTabIndex}
                onFocus={handleFocus}
                onClick={handleClick}
            >
                <span className="menu__item-leading" aria-hidden="true">
                    {selected === true ? (
                        <Icon name="Check" size={16} />
                    ) : icon === (void 0) ? null : (
                        <Icon name={icon} size={16} />
                    )}
                </span>
                <span className="menu__item-label">{children}</span>
                {shortcut === (void 0) ? null : (
                    <Text as="span" variant="label" tone="soft" className="menu__item-shortcut">
                        {shortcut}
                    </Text>
                )}
            </button>
        </Surface>
    );
};

/**
 * Renders a divider between groups of menu items.
 * @param props - Optional class name and native separator attributes.
 * @example
 * <MenuSeparator />
 * @returns A decorative separator row.
 */
export const MenuSeparator: FC<MenuSeparatorProps> = ({
    className = "",
    ref,
    ...rest
}: MenuSeparatorProps) => (
    <div {...rest} ref={ref} role="separator" className={cx("menu__separator", className)} />
);

/**
 * Renders a labelled group of related menu items.
 * @param props - Group label, items, class name, ref, and native group attributes.
 * @example
 * <MenuGroup label="Layout"><MenuItem onSelect={grid}>Grid</MenuItem></MenuGroup>
 * @returns A labelled group container.
 */
export const MenuGroup: FC<MenuGroupProps> = ({
    label,
    children,
    className = "",
    ref,
    ...rest
}: MenuGroupProps) => {
    const labelId: string = useId();

    return (
        <div
            {...rest}
            ref={ref}
            role="group"
            aria-labelledby={labelId}
            className={cx("menu__group", className)}
        >
            <Text as="div" variant="label" tone="soft" className="menu__group-label" id={labelId}>
                {label}
            </Text>
            {children}
        </div>
    );
};

/**
 * Compound menu component with Item, Separator, and Group subcomponents.
 * @param props - Open state, anchor ref, placement, accessible name, and composed items.
 * @example
 * <Menu open={open} onOpenChange={setOpen} anchorRef={triggerRef}>
 *     <MenuItem onSelect={copy}>Copy</MenuItem>
 * </Menu>
 * @returns A popover containing the menu surface.
 */
const Menu: MenuComponent = Object.assign(MenuRoot, {
    Item: MenuItem,
    Separator: MenuSeparator,
    Group: MenuGroup,
});

export default Menu;
