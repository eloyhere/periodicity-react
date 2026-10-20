import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    type FC,
    type HTMLAttributes,
    type MouseEvent as ReactMouseEvent,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import { createListAdapter, type ListAdapter, type ListEntry } from "../list/adapter";
import cx from "../../component/foundation/cx";
import useControllableState, { type Updater } from "../../component/foundation/useControllableState";
import useRovingTabIndex, { type RovingTabIndexResult } from "../../component/foundation/useRovingTabIndex";
import Icon, { type IconName } from "../../component/icon/Icon";
import Surface from "../../component/surface/Surface";
import { panelDomId, tabDomId } from "./ids";
import "./Tabs.css";

/**
 * A single tab definition.
 * Type: interface.
 * Fields:
 * - `value`: Stable identifier shared with the matching panel.
 * - `label`: Visible tab text.
 * - `icon`: Optional leading icon.
 * - `disabled`: Whether the tab can be selected and focused.
 * - `badge`: Optional trailing content, such as a count.
 * @example
 * const item: TabItem = { value: "today", label: "Today" };
 */
export interface TabItem {
    value: string;
    label: string;
    icon?: IconName;
    disabled?: boolean;
    badge?: ReactNode;
}

/**
 * Props for the Tabs component.
 * Type: interface.
 * Fields:
 * - `items`: Tab definitions in display order.
 * - `value`: Controlled selected value.
 * - `defaultValue`: Uncontrolled initial value; defaults to the first enabled tab.
 * - `onValueChange`: Called with the next selected value.
 * - `onTabClick`: Called with the clicked tab, its index, and the native event.
 * - `variant`: Visual treatment; defaults to `line`.
 * - `size`: Control size; defaults to `md`.
 * - `ariaLabel`: Accessible name for the tab list; defaults to `Tabs`.
 * - `disabled`: Disables every tab without removing it from the tab list.
 * - `className`: Extra class names for the root element.
 * - `ref`: Ref forwarded to the root element.
 * Scroll events are observed on the horizontal tab scroller.
 * @example
 * <Tabs items={[{ value: "today", label: "Today" }]} defaultValue="today" />
 */
export interface TabsProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
    items: readonly TabItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onTabClick?: (item: TabItem, index: number, event: ReactMouseEvent<HTMLButtonElement>) => void;
    variant?: "line" | "pill" | "enclosed";
    size?: "sm" | "md" | "lg";
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Resolves the first selectable value, so an uncontrolled strip starts on a usable tab.
 * @param items - Tab definitions in display order.
 * @example
 * const value: string = firstEnabledValue(items);
 * @returns The first enabled value, or an empty string when every tab is disabled.
 */
const firstEnabledValue: (items: readonly TabItem[]) => string = (items: readonly TabItem[]): string => {
    let result: string = "";

    for (let index: number = 0; index < items.length; index += 1) {
        if (!items[index].disabled) {
            result = items[index].value;

            break;
        }
    }

    return result;
};

/**
 * Renders an accessible tab strip with roving focus, badges, and overflow scrolling.
 * @param props - Tab items, controlled value, callbacks, variant, size, and native attributes.
 * @example
 * <Tabs items={[{ value: "today", label: "Today" }]} defaultValue="today" />
 * @returns The tab list; pair it with a TabPanel per value.
 */
const Tabs: FC<TabsProps> = ({
    items,
    value,
    defaultValue,
    onValueChange,
    onTabClick,
    variant = "line",
    size = "md",
    ariaLabel,
    disabled = false,
    className = "",
    ref,
    onScroll,
    "aria-label": ariaLabelAttribute,
    ...rest
}: TabsProps): ReactNode => {
    const adapter: ListAdapter<TabItem> = useMemo<ListAdapter<TabItem>>(
        () => createListAdapter<TabItem>(items, { getKey: (item: TabItem): string => item.value }),
        [items],
    );
    const entries: readonly ListEntry<TabItem>[] = useMemo<readonly ListEntry<TabItem>[]>(
        () => adapter.getRange(0, adapter.size),
        [adapter],
    );
    const enabledIndexes: readonly number[] = useMemo<readonly number[]>(() => {
        const indexes: number[] = [];

        entries.forEach((entry: ListEntry<TabItem>): void => {
            if (!entry.item.disabled) {
                indexes.push(entry.index);
            }
        });

        return indexes;
    }, [entries]);
    const enabledPositions: readonly number[] = useMemo<readonly number[]>(() => {
        const positions: number[] = new Array<number>(items.length).fill(-1);

        enabledIndexes.forEach((itemIndex: number, position: number): void => {
            positions[itemIndex] = position;
        });

        return positions;
    }, [enabledIndexes, items.length]);
    const initialValue: string = useMemo<string>(
        () => defaultValue ?? firstEnabledValue(items),
        [defaultValue, items],
    );
    const [currentValue, setValue]: readonly [string, (next: Updater<string>) => void] = useControllableState<string>({
        value,
        defaultValue: initialValue,
    });
    const notifyTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const pendingValueRef: RefObject<string | null> = useRef<string | null>(null);
    const resolvedAriaLabel: string = ariaLabel ?? ariaLabelAttribute ?? "Tabs";

    useEffect(
        (): (() => void) => (): void => {
            if (notifyTimerRef.current !== null) {
                window.clearTimeout(notifyTimerRef.current);
            }
        },
        [],
    );

    useEffect((): void => {
        if (value !== (void 0) && pendingValueRef.current !== null) {
            if (notifyTimerRef.current !== null) {
                window.clearTimeout(notifyTimerRef.current);
            }

            notifyTimerRef.current = null;
            pendingValueRef.current = null;
        }
    }, [value]);

    const select: (next: string) => void = useCallback(
        (next: string): void => {
            if (next === currentValue) {
                return;
            }

            setValue(next);
            pendingValueRef.current = next;

            if (notifyTimerRef.current !== null) {
                window.clearTimeout(notifyTimerRef.current);
            }

            notifyTimerRef.current = window.setTimeout((): void => {
                notifyTimerRef.current = null;
                pendingValueRef.current = null;
                onValueChange?.(next);
            }, 80);
        },
        [currentValue, onValueChange, setValue],
    );
    const selectedIndex: number = adapter.indexOf(currentValue);
    const selectedPosition: number = selectedIndex >= 0 ? enabledPositions[selectedIndex] : -1;
    const activePosition: number = selectedPosition >= 0 ? selectedPosition : 0;
    const tabRefs: MutableRefObject<(HTMLButtonElement | null)[]> = useRef<(HTMLButtonElement | null)[]>([]);

    const focusTabAt: (index: number) => void = useCallback((index: number): void => {
        tabRefs.current[index]?.focus();
    }, []);

    const handleRovingChange: (position: number) => void = useCallback(
        (position: number): void => {
            const itemIndex: number = enabledIndexes[position] ?? -1;

            if (itemIndex < 0) {
                return;
            }

            select(items[itemIndex].value);
            focusTabAt(itemIndex);
        },
        [enabledIndexes, focusTabAt, items, select],
    );

    const roving: RovingTabIndexResult = useRovingTabIndex({
        count: enabledIndexes.length,
        activeIndex: activePosition,
        onChange: handleRovingChange,
        orientation: "horizontal",
        loop: true,
    });

    const handleSelect: (
        item: TabItem,
        index: number,
        event: ReactMouseEvent<HTMLButtonElement>,
    ) => void = useCallback(
        (item: TabItem, index: number, event: ReactMouseEvent<HTMLButtonElement>): void => {
            select(item.value);
            onTabClick?.(item, index, event);
        },
        [onTabClick, select],
    );

    const iconSize: number = size === "sm" ? 14 : size === "lg" ? 18 : 16;

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("tabs", `tabs--${variant}`, `tabs--${size}`, className)}
            data-disabled={disabled ? "true" : "false"}
        >
            <div className="tabs__scroller" onScroll={onScroll}>
                <div className="tabs__list" role="tablist" aria-label={resolvedAriaLabel} aria-orientation="horizontal">
                    {entries.map((entry: ListEntry<TabItem>): ReactNode => {
                        const item: TabItem = entry.item;
                        const isSelected: boolean = item.value === currentValue;
                        const isDisabled: boolean = disabled || item.disabled === true;
                        const enabledPosition: number = enabledPositions[entry.index];
                        const hasBadge: boolean = item.badge !== (void 0) && item.badge !== null;

                        return (
                            <Surface
                                key={entry.key}
                                className={cx(
                                    "tabs__surface",
                                    isSelected && "tabs__surface--selected",
                                    isDisabled && "tabs__surface--disabled",
                                )}
                                disabled={isDisabled}
                                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                            >
                                <button
                                    ref={(node: HTMLButtonElement | null): void => {
                                        tabRefs.current[entry.index] = node;
                                    }}
                                    type="button"
                                    role="tab"
                                    id={tabDomId(item.value)}
                                    className="tabs__tab"
                                    aria-selected={isSelected}
                                    aria-controls={panelDomId(item.value)}
                                    tabIndex={isDisabled ? -1 : roving.tabIndexFor(enabledPosition)}
                                    disabled={isDisabled}
                                    onClick={(event: ReactMouseEvent<HTMLButtonElement>): void => {
                                        handleSelect(item, entry.index, event);
                                    }}
                                    onKeyDown={roving.onKeyDown}
                                >
                                    {item.icon ? (
                                        <Icon className="tabs__icon" name={item.icon} size={iconSize} />
                                    ) : null}
                                    <span className="tabs__label">{item.label}</span>
                                    {hasBadge ? <span className="tabs__badge">{item.badge}</span> : null}
                                </button>
                            </Surface>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Tabs;
