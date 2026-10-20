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
import Icon from "../../component/icon/Icon";
import cx from "../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../component/foundation/useVirtualWindow";
import type { ListAdapter, ListEntry } from "../list/adapter";
import { isTreeOption, optionKey, optionLabel } from "../list/node";
import type { TreeAdapter } from "./adapter";
import { createTreeAdapter } from "./adapter";
import "./Tree.css";

/**
 * State passed to a tree item slot.
 * Type: interface.
 * Fields: index, level, expanded, selected, checked.
 * @example
 * const state: TreeItemState = {
 *     index: 0,
 *     level: 0,
 *     expanded: true,
 *     selected: false,
 *     checked: false,
 * };
 */
export interface TreeItemState {
    index: number;
    level: number;
    expanded: boolean;
    selected: boolean;
    checked: boolean;
}

/**
 * Custom item rendering hooks for a tree.
 * Type: interface.
 * Fields: item.
 * @example
 * <Tree slots={{ item: (item, state) => <span>{item.label}</span> }} />
 */
export interface TreeSlots<Item> {
    item?: (item: Item, state: TreeItemState) => ReactNode;
}

/**
 * Selection behaviour of a tree.
 * Type: type alias.
 * Fields: none.
 * @example
 * const mode: TreeSelectionMode = "multiple";
 */
export type TreeSelectionMode = "none" | "single" | "multiple";

/**
 * Props for the adapter-backed tree.
 * Type: interface.
 * Fields: items, adapter, getKey, getChildren, expandedKeys, defaultExpandedKeys,
 * onExpandedChange, selectionMode, selectedKeys, defaultSelectedKeys,
 * onSelectionChange, checkable, checkedKeys, defaultCheckedKeys,
 * onCheckedChange, renderItem, slots, virtual, itemHeight, height, empty,
 * className.
 * @example
 * <Tree items={nodes} checkable virtual height={320} />
 */
export interface TreeProps<Item> {
    items?: readonly Item[];
    adapter?: TreeAdapter<Item>;
    getKey?: (item: Item, index: number) => string;
    getChildren?: (item: Item) => readonly Item[] | void;
    expandedKeys?: ReadonlySet<string>;
    defaultExpandedKeys?: ReadonlySet<string>;
    onExpandedChange?: (keys: ReadonlySet<string>) => void;
    selectionMode?: TreeSelectionMode;
    selectedKeys?: readonly string[];
    defaultSelectedKeys?: readonly string[];
    onSelectionChange?: (keys: readonly string[], items: readonly Item[]) => void;
    checkable?: boolean;
    checkedKeys?: readonly string[];
    defaultCheckedKeys?: readonly string[];
    onCheckedChange?: (keys: readonly string[]) => void;
    renderItem?: (item: Item, level: number, expanded: boolean) => ReactNode;
    slots?: TreeSlots<Item>;
    virtual?: boolean;
    itemHeight?: number;
    height?: number;
    empty?: ReactNode;
    className?: string;
}

/**
 * Renders an expandable Material tree with adapter, selection, check, and
 * optional fixed-row virtualisation.
 * @param props - Tree data, expansion, selection, and check state.
 * @example
 * <Tree items={nodes} selectionMode="single" />
 * @returns A tree widget.
 */
const Tree: <Item>(props: TreeProps<Item>) => ReactNode = <Item,>({
    items = [],
    adapter,
    getKey,
    getChildren,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    selectionMode = "none",
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    checkable = false,
    checkedKeys,
    defaultCheckedKeys,
    onCheckedChange,
    renderItem,
    slots,
    virtual = false,
    itemHeight = 40,
    height = 320,
    empty = "No nodes",
    className = "",
}: TreeProps<Item>): ReactNode => {
    const tree: TreeAdapter<Item> = useMemo((): TreeAdapter<Item> => {
        if (adapter !== (void 0)) {
            return adapter;
        }

        return createTreeAdapter<Item>(items, {
            getKey: (item: Item, index: number): string =>
                getKey === (void 0) ? optionKey(item, index) : getKey(item, index),
            getChildren: (item: Item): readonly Item[] =>
                getChildren?.(item) ??
                (isTreeOption(item) ? ((item.children ?? []) as readonly Item[]) : []),
        });
    }, [adapter, items, getKey, getChildren]);
    const [internalExpanded, setInternalExpanded]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(new Set<string>(defaultExpandedKeys ?? []));
    const [internalSelected, setInternalSelected]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(new Set<string>(defaultSelectedKeys ?? []));
    const [internalChecked, setInternalChecked]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(new Set<string>(defaultCheckedKeys ?? []));
    const expanded: ReadonlySet<string> =
        expandedKeys === (void 0) ? internalExpanded : new Set<string>(expandedKeys);
    const selected: ReadonlySet<string> =
        selectedKeys === (void 0) ? internalSelected : new Set<string>(selectedKeys);
    const checked: ReadonlySet<string> =
        checkedKeys === (void 0) ? internalChecked : new Set<string>(checkedKeys);
    const visible: ListAdapter<Item> = tree.flatten(expanded);
    const {
        attachViewport,
        start: windowStart,
        end: windowEnd,
        onScroll,
    }: VirtualWindow = useVirtualWindow({
        count: visible.size,
        itemHeight,
        fallbackHeight: height,
        overscan: 4,
    });
    const start: number = virtual ? windowStart : 0;
    const end: number = virtual ? windowEnd : visible.size;
    const entries: readonly ListEntry<Item>[] = visible.getRange(start, end);
    const spacerStyle: CSSProperties = virtual
        ? { height: visible.size * itemHeight, position: "relative" }
        : {};

    const setExpansion: (next: ReadonlySet<string>) => void = (next: ReadonlySet<string>): void => {
        if (expandedKeys === (void 0)) {
            setInternalExpanded(next);
        }

        onExpandedChange?.(next);
    };

    const toggleExpansion: (key: string) => void = (key: string): void => {
        const next: Set<string> = new Set<string>(expanded);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        setExpansion(next);
    };

    const setSelection: (next: ReadonlySet<string>) => void = (next: ReadonlySet<string>): void => {
        if (selectedKeys === (void 0)) {
            setInternalSelected(next);
        }

        const selectedItems: Item[] = [...next].map((key: string): Item => tree.getItem(key));
        onSelectionChange?.([...next], selectedItems);
    };

    const toggleSelection: (key: string) => void = (key: string): void => {
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

    const collectSubtree: (key: string, target: Set<string>) => void = (
        key: string,
        target: Set<string>,
    ): void => {
        target.add(key);

        for (const child of tree.getChildren(key)) {
            collectSubtree(child, target);
        }
    };

    const toggleCheck: (key: string) => void = (key: string): void => {
        const next: Set<string> = new Set<string>(checked);
        const subtree: Set<string> = new Set<string>();
        collectSubtree(key, subtree);

        if (checked.has(key)) {
            for (const item of subtree) {
                next.delete(item);
            }
        } else {
            for (const item of subtree) {
                next.add(item);
            }
        }

        if (checkedKeys === (void 0)) {
            setInternalChecked(next);
        }

        onCheckedChange?.([...next]);
    };

    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>, key: string) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
        key: string,
    ): void => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleSelection(key);
        } else if (event.key === "ArrowRight" && tree.isExpandable(key) && !expanded.has(key)) {
            event.preventDefault();
            toggleExpansion(key);
        } else if (event.key === "ArrowLeft" && expanded.has(key)) {
            event.preventDefault();
            toggleExpansion(key);
        }
    };

    return (
        <div
            ref={virtual ? attachViewport : (void 0)}
            className={cx("tree", virtual && "tree--virtual", className)}
            role="tree"
            aria-multiselectable={selectionMode === "multiple" ? "true" : (void 0)}
            style={virtual ? { height } : (void 0)}
            onScroll={virtual ? onScroll : (void 0)}
        >
            {entries.length === 0 ? (
                <div className="tree__state">{empty}</div>
            ) : (
                <div className="tree__spacer" style={spacerStyle}>
                    {entries.map((entry: ListEntry<Item>): ReactNode => {
                        const expandable: boolean = tree.isExpandable(entry.key);
                        const isExpanded: boolean = expanded.has(entry.key);
                        const isSelected: boolean = selected.has(entry.key);
                        const isChecked: boolean = checked.has(entry.key);
                        const depth: number = isTreeOption(entry.item)
                            ? entry.item.depth
                            : entry.level;
                        const rowStyle: CSSProperties = virtual
                            ? {
                                  top: entry.index * itemHeight,
                                  height: itemHeight,
                                  paddingLeft: `calc(${depth} * var(--space-4) + var(--space-2))`,
                              }
                            : {
                                  paddingLeft: `calc(${depth} * var(--space-4) + var(--space-2))`,
                              };

                        return (
                            <Surface
                                key={entry.key}
                                className={cx(
                                    "tree__row",
                                    isSelected && "tree__row--selected",
                                )}
                                style={rowStyle}
                                role="treeitem"
                                aria-selected={isSelected}
                                aria-expanded={expandable ? isExpanded : (void 0)}
                                aria-level={depth + 1}
                                tabIndex={0}
                                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                                onClick={(event: ReactMouseEvent<HTMLDivElement>): void => {
                                    if (
                                        (event.target as Element).closest(
                                            ".tree__toggle, .checkbox",
                                        ) !== null
                                    ) {
                                        return;
                                    }

                                    if (expandable) {
                                        toggleExpansion(entry.key);
                                    }

                                    toggleSelection(entry.key);
                                }}
                                onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>): void =>
                                    handleKeyDown(event, entry.key)
                                }
                            >
                                <span
                                    className={
                                        expandable
                                            ? "tree__toggle"
                                            : "tree__toggle tree__toggle--empty"
                                    }
                                    onClick={(event: ReactMouseEvent<HTMLSpanElement>): void => {
                                        event.stopPropagation();

                                        if (expandable) {
                                            toggleExpansion(entry.key);
                                        }
                                    }}
                                    role="presentation"
                                >
                                    {expandable ? (
                                        <Icon
                                            name={isExpanded ? "ChevronDown" : "ChevronRight"}
                                            size={14}
                                        />
                                    ) : null}
                                </span>
                                {checkable ? (
                                    <span
                                        className="tree__check"
                                        onClick={(event: ReactMouseEvent<HTMLSpanElement>): void =>
                                            event.stopPropagation()
                                        }
                                        role="presentation"
                                    >
                                        <Checkbox
                                            size="sm"
                                            checked={isChecked}
                                            onCheckedChange={(): void => toggleCheck(entry.key)}
                                            label={
                                                <span className="visually-hidden">
                                                    Check node {entry.index + 1}
                                                </span>
                                            }
                                        />
                                    </span>
                                ) : null}
                                <span className="tree__content">
                                    {slots?.item !== (void 0)
                                        ? slots.item(entry.item, {
                                              index: entry.index,
                                              level: depth,
                                              expanded: isExpanded,
                                              selected: isSelected,
                                              checked: isChecked,
                                          })
                                        : renderItem !== (void 0)
                                          ? renderItem(entry.item, depth, isExpanded)
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

export default Tree;
