import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    type FC,
    type MutableRefObject,
    type ReactNode,
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
 * - `variant`: Visual treatment; defaults to `line`.
 * - `size`: Control size; defaults to `md`.
 * - `className`: Extra class names for the root element.
 * @example
 * <Tabs items={[{ value: "today", label: "Today" }]} defaultValue="today" />
 */
export interface TabsProps {
    items: TabItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    variant?: "line" | "pill" | "enclosed";
    size?: "sm" | "md" | "lg";
    className?: string;
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
 * @param props - Tab items, controlled value, variant, size, and change handler.
 * @example
 * <Tabs items={[{ value: "today", label: "Today" }]} defaultValue="today" />
 * @returns The tab list; pair it with a TabPanel per value.
 */
const Tabs: FC<TabsProps> = ({
    items,
    value,
    defaultValue,
    onValueChange,
    variant = "line",
    size = "md",
    className = "",
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

    const handleSelect: (item: TabItem) => void = useCallback(
        (item: TabItem): void => {
            select(item.value);
        },
        [select],
    );

    const iconSize: number = size === "sm" ? 14 : size === "lg" ? 18 : 16;

    return (
        <div className={cx("tabs", `tabs--${variant}`, `tabs--${size}`, className)}>
            <div className="tabs__scroller">
                <div className="tabs__list" role="tablist" aria-label="Tabs" aria-orientation="horizontal">
                    {entries.map((entry: ListEntry<TabItem>): ReactNode => {
                        const item: TabItem = entry.item;
                        const isSelected: boolean = item.value === currentValue;
                        const enabledPosition: number = enabledPositions[entry.index];
                        const hasBadge: boolean = item.badge !== (void 0) && item.badge !== null;

                        return (
                            <Surface
                                key={entry.key}
                                className={cx(
                                    "tabs__surface",
                                    isSelected && "tabs__surface--selected",
                                    item.disabled && "tabs__surface--disabled",
                                )}
                                disabled={item.disabled}
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
                                    tabIndex={item.disabled ? -1 : roving.tabIndexFor(enabledPosition)}
                                    disabled={item.disabled}
                                    onClick={(): void => {
                                        handleSelect(item);
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
