import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type Context,
    type Dispatch,
    type FC,
    type KeyboardEvent,
    type KeyboardEventHandler,
    type MutableRefObject,
    type ReactNode,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from "react";
import cx from "../../component/foundation/cx";
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
    select: (onSelect?: () => void) => void;
}

const MenuContext: Context<MenuContextValue | null> = createContext<MenuContextValue | null>(null);

/**
 * Props for the menu root.
 * Type: interface.
 * @param open - Whether the menu is visible.
 * @param onOpenChange - Called with the requested open state.
 * @param anchorRef - Trigger element the menu is anchored to.
 * @param children - Menu items, groups, and separators.
 * @param placement - Preferred menu placement relative to the trigger.
 * @param ariaLabel - Accessible name announced for the menu.
 * @example
 * <Menu open={open} onOpenChange={setOpen} anchorRef={buttonRef}>
 *     <MenuItem onSelect={rename}>Rename</MenuItem>
 * </Menu>
 */
export interface MenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    anchorRef: RefObject<HTMLElement | null>;
    children: ReactNode;
    placement?: Placement;
    ariaLabel?: string;
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
 * @example
 * <MenuItem icon="Refresh" shortcut="R" onSelect={refresh}>Refresh</MenuItem>
 */
export interface MenuItemProps {
    children: ReactNode;
    onSelect?: () => void;
    icon?: IconName;
    disabled?: boolean;
    shortcut?: string;
    selected?: boolean;
    className?: string;
}

/**
 * Props for a menu separator.
 * Type: interface.
 * @param className - Extra class applied to the separator.
 * @example
 * <MenuSeparator className="menu__separator--wide" />
 */
export interface MenuSeparatorProps {
    className?: string;
}

/**
 * Props for a labelled menu group.
 * Type: interface.
 * @param label - Group heading text.
 * @param children - Items belonging to the group.
 * @param className - Extra class applied to the group wrapper.
 * @example
 * <MenuGroup label="Actions"><MenuItem onSelect={archive}>Archive</MenuItem></MenuGroup>
 */
export interface MenuGroupProps {
    label: string;
    children: ReactNode;
    className?: string;
}

/**
 * Implements the APG menu pattern: roving tab stop, arrow keys, Home/End, and focus return.
 * @param props - Open state, anchor, placement, and composed menu children.
 * @example
 * <Menu open={open} onOpenChange={setOpen} anchorRef={triggerRef}>
 *     <MenuItem onSelect={copy}>Copy</MenuItem>
 * </Menu>
 * @returns A popover containing the menu surface.
 */
const MenuRoot: FC<MenuProps> = ({
    open,
    onOpenChange,
    anchorRef,
    children,
    placement = "bottom-start",
    ariaLabel = "Menu",
}: MenuProps) => {
    const [itemIds, setItemIds]: [readonly string[], Dispatch<SetStateAction<readonly string[]>>] =
        useState<readonly string[]>([]);
    const [activeId, setActiveId]: [string | null, Dispatch<SetStateAction<string | null>>] =
        useState<string | null>(null);
    const nodesRef: MutableRefObject<Record<string, HTMLButtonElement>> = useRef<
        Record<string, HTMLButtonElement>
    >({});

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

            onOpenChange(nextOpen);
        },
        [onOpenChange],
    );

    const closeAndRestoreFocus: () => void = useCallback((): void => {
        handleOpenChange(false);
        anchorRef.current?.focus({ preventScroll: true });
    }, [anchorRef, handleOpenChange]);

    const handleSelect: (onSelect?: () => void) => void = useCallback(
        (onSelect?: () => void): void => {
            onSelect?.();
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

    const handleMenuKeyDown: KeyboardEventHandler<HTMLElement> = (
        event: KeyboardEvent<HTMLElement>,
    ): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeAndRestoreFocus();
            return;
        }

        if (event.key === "Tab") {
            handleOpenChange(false);
            anchorRef.current?.focus({ preventScroll: true });
            return;
        }

        handleRovingKeyDown(event);
    };

    useEffect((): void => {
        if (!open || resolvedActiveId === null) {
            return;
        }

        const node: HTMLButtonElement | void = nodesRef.current[resolvedActiveId];

        if (node !== (void 0) && document.activeElement !== node) {
            node.focus();
        }
    }, [open, resolvedActiveId]);

    const contextValue: MenuContextValue = useMemo<MenuContextValue>(
        () => ({ getTabIndex, registerItem, setActive: setActiveId, select: handleSelect }),
        [getTabIndex, handleSelect, registerItem],
    );

    return (
        <Popover
            open={open}
            onOpenChange={handleOpenChange}
            anchorRef={anchorRef}
            placement={placement}
        >
            <MenuContext.Provider value={contextValue}>
                <div className="menu" role="menu" aria-label={ariaLabel} onKeyDown={handleMenuKeyDown}>
                    {children}
                </div>
            </MenuContext.Provider>
        </Popover>
    );
};

/**
 * Renders a selectable menu row on a rippling Surface.
 * @param props - Label, selection callback, icon, shortcut, and disabled state.
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
    const tabIndex: 0 | -1 = menuContext === null ? 0 : menuContext.getTabIndex(itemId);

    const handleFocus: () => void = (): void => {
        menuContext?.setActive(itemId);
    };

    const handleClick: () => void = (): void => {
        if (disabled) {
            return;
        }

        menuContext?.select(onSelect);
    };

    return (
        <Surface
            className={cx("menu__item", className)}
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            disabled={disabled}
        >
            <button
                ref={handleRef}
                type="button"
                className="menu__item-control"
                role={selected === (void 0) ? "menuitem" : "menuitemradio"}
                aria-checked={selected}
                aria-disabled={disabled ? true : (void 0)}
                data-selected={selected === true ? "true" : "false"}
                tabIndex={tabIndex}
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
 * @param props - Optional class name.
 * @example
 * <MenuSeparator />
 * @returns A decorative separator row.
 */
export const MenuSeparator: FC<MenuSeparatorProps> = ({ className = "" }: MenuSeparatorProps) => (
    <div role="separator" className={cx("menu__separator", className)} />
);

/**
 * Renders a labelled group of related menu items.
 * @param props - Group label, items, and optional class name.
 * @example
 * <MenuGroup label="Layout"><MenuItem onSelect={grid}>Grid</MenuItem></MenuGroup>
 * @returns A labelled group container.
 */
export const MenuGroup: FC<MenuGroupProps> = ({ label, children, className = "" }: MenuGroupProps) => {
    const labelId: string = useId();

    return (
        <div role="group" aria-labelledby={labelId} className={cx("menu__group", className)}>
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
