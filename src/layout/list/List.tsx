import {
    useMemo,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
} from "react";
import Checkbox from "../../component/input/check/Checkbox";
import Surface from "../../component/surface/Surface";
import Spinner from "../../component/progress/Spinner";
import cx from "../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../component/foundation/useVirtualWindow";
import type { ListAdapter, ListEntry } from "./adapter";
import { createListAdapter } from "./adapter";
import { optionKey, optionLabel } from "./node";
import "./List.css";

/**
 * State passed to a list item slot.
 * Type: interface.
 * Fields: index, selected, disabled.
 * @example
 * const state: ListItemState = { index: 0, selected: true, disabled: false };
 */
export interface ListItemState {
    index: number;
    selected: boolean;
    disabled: boolean;
}

/**
 * Custom item rendering hooks for a list.
 * Type: interface.
 * Fields: item.
 * @example
 * <List slots={{ item: (item, state) => <span>{item.label}</span> }} />
 */
export interface ListSlots<Item> {
    item?: (item: Item, state: ListItemState) => ReactNode;
}

/**
 * Selection behaviour of a list.
 * Type: type alias.
 * Fields: none.
 * @example
 * const mode: ListSelectionMode = "multiple";
 */
export type ListSelectionMode = "none" | "single" | "multiple";

/**
 * Props for the adapter-backed list.
 * Type: interface.
 * Fields: items, adapter, getKey, selectionMode, selectedKeys, defaultSelectedKeys,
 * onSelectionChange, onItemClick, renderItem, slots, isDisabled, virtual,
 * itemHeight, height, loading, empty, className.
 * @example
 * <List items={items} selectionMode="multiple" virtual height={320} />
 */
export interface ListProps<Item> {
    items?: readonly Item[];
    adapter?: ListAdapter<Item>;
    getKey?: (item: Item, index: number) => string;
    selectionMode?: ListSelectionMode;
    selectedKeys?: readonly string[];
    defaultSelectedKeys?: readonly string[];
    onSelectionChange?: (keys: readonly string[], items: readonly Item[]) => void;
    onItemClick?: (item: Item, index: number) => void;
    renderItem?: (item: Item, index: number) => ReactNode;
    slots?: ListSlots<Item>;
    isDisabled?: (item: Item, index: number) => boolean;
    virtual?: boolean;
    itemHeight?: number;
    height?: number;
    loading?: boolean;
    empty?: ReactNode;
    className?: string;
}

/**
 * Renders a Material list backed by a list adapter, with optional virtual
 * windowing and single/multiple selection.
 * @param props - Items or adapter, selection mode, and virtual window.
 * @example
 * <List items={people} selectionMode="single" />
 * @returns A listbox.
 */
const List: <Item>(props: ListProps<Item>) => ReactNode = <Item,>({
    items = [],
    adapter,
    getKey,
    selectionMode = "none",
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    onItemClick,
    renderItem,
    slots,
    isDisabled,
    virtual = false,
    itemHeight = 48,
    height = 320,
    loading = false,
    empty = "No items",
    className = "",
}: ListProps<Item>): ReactNode => {
    const list: ListAdapter<Item> = useMemo((): ListAdapter<Item> => {
        if (adapter !== (void 0)) {
            return adapter;
        }

        return createListAdapter<Item>(items, {
            getKey: (item: Item, index: number): string =>
                getKey === (void 0) ? optionKey(item, index) : getKey(item, index),
        });
    }, [adapter, items, getKey]);
    const [internalSelected, setInternalSelected]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(new Set<string>(defaultSelectedKeys ?? []));
    const selected: ReadonlySet<string> =
        selectedKeys === (void 0) ? internalSelected : new Set<string>(selectedKeys);
    const {
        attachViewport,
        start: windowStart,
        end: windowEnd,
        onScroll,
    }: VirtualWindow = useVirtualWindow({
        count: list.size,
        itemHeight,
        fallbackHeight: height,
        overscan: 4,
        resetKey: loading,
    });
    const start: number = virtual ? windowStart : 0;
    const end: number = virtual ? windowEnd : list.size;
    const entries: readonly ListEntry<Item>[] = list.getRange(start, end);
    const spacerStyle: CSSProperties = virtual
        ? { height: list.size * itemHeight, position: "relative" }
        : {};

    const setSelection: (next: ReadonlySet<string>) => void = (next: ReadonlySet<string>): void => {
        if (selectedKeys === (void 0)) {
            setInternalSelected(next);
        }

        const selectedItems: Item[] = [...next]
            .map((key: string): Item | null => {
                const index: number = list.indexOf(key);
                return index === -1 ? null : list.getItem(index);
            })
            .filter((item: Item | null): item is Item => item !== null);
        onSelectionChange?.([...next], selectedItems);
    };

    const toggle: (key: string) => void = (key: string): void => {
        if (selectionMode === "none") {
            return;
        }

        if (selectionMode === "single") {
            setSelection(new Set<string>([key]));
            return;
        }

        const next: Set<string> = new Set<string>(selected);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        setSelection(next);
    };

    const handleRowKeyDown: (
        event: ReactKeyboardEvent<HTMLDivElement>,
        entry: ListEntry<Item>,
    ) => void = (event: ReactKeyboardEvent<HTMLDivElement>, entry: ListEntry<Item>): void => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(entry.key);
            onItemClick?.(entry.item, entry.index);
        }
    };

    const handleRowClick: (
        event: ReactMouseEvent<HTMLDivElement>,
        entry: ListEntry<Item>,
    ) => void = (event: ReactMouseEvent<HTMLDivElement>, entry: ListEntry<Item>): void => {
        if ((event.target as Element).closest(".checkbox") !== null) {
            return;
        }

        toggle(entry.key);
        onItemClick?.(entry.item, entry.index);
    };

    return (
        <div
            className={cx("list", virtual && "list--virtual", className)}
            role="listbox"
            aria-multiselectable={selectionMode === "multiple" ? "true" : (void 0)}
            style={virtual ? { height } : (void 0)}
            ref={virtual ? attachViewport : (void 0)}
            onScroll={virtual ? onScroll : (void 0)}
        >
            {loading ? (
                <div className="list__state">
                    <Spinner size="sm" />
                </div>
            ) : entries.length === 0 ? (
                <div className="list__state">{empty}</div>
            ) : (
                <div className="list__spacer" style={spacerStyle}>
                    {entries.map((entry: ListEntry<Item>): ReactNode => {
                        const disabled: boolean = isDisabled?.(entry.item, entry.index) === true;
                        const isSelected: boolean = selected.has(entry.key);
                        const rowStyle: CSSProperties = virtual
                            ? { top: entry.index * itemHeight, height: itemHeight }
                            : {};

                        return (
                            <Surface
                                key={entry.key}
                                className={cx(
                                    "list__row",
                                    isSelected && "list__row--selected",
                                    disabled && "list__row--disabled",
                                )}
                                style={rowStyle}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={disabled ? "true" : (void 0)}
                                tabIndex={disabled ? -1 : 0}
                                disabled={disabled}
                                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                                onClick={(event: ReactMouseEvent<HTMLDivElement>): void =>
                                    handleRowClick(event, entry)
                                }
                                onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>): void =>
                                    handleRowKeyDown(event, entry)
                                }
                            >
                                {selectionMode === "multiple" ? (
                                    <span
                                        className="list__check"
                                        onClick={(event: ReactMouseEvent<HTMLSpanElement>): void =>
                                            event.stopPropagation()
                                        }
                                        role="presentation"
                                    >
                                        <Checkbox
                                            size="sm"
                                            checked={isSelected}
                                            disabled={disabled}
                                            onCheckedChange={(): void => toggle(entry.key)}
                                            label={
                                                <span className="visually-hidden">
                                                    Select row {entry.index + 1}
                                                </span>
                                            }
                                        />
                                    </span>
                                ) : null}
                                <span className="list__content">
                                    {slots?.item !== (void 0)
                                        ? slots.item(entry.item, {
                                              index: entry.index,
                                              selected: isSelected,
                                              disabled,
                                          })
                                        : renderItem !== (void 0)
                                          ? renderItem(entry.item, entry.index)
                                          : optionLabel(entry.item)}
                                </span>
                            </Surface>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default List;
