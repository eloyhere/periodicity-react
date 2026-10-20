import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type UIEvent,
    type UIEventHandler,
} from "react";
import Checkbox from "../../component/input/check/Checkbox";
import Surface from "../../component/surface/Surface";
import Icon from "../../component/icon/Icon";
import Spinner from "../../component/progress/Spinner";
import cx from "../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../component/foundation/useVirtualWindow";
import type { ListAdapter, ListEntry } from "../list/adapter";
import { isTreeOption, optionKey, optionLabel } from "../list/node";
import { composeRefs } from "../list/refs";
import type { TreeAdapter } from "./adapter";
import { createTreeAdapter } from "./adapter";
import { useInternational, type InternationalContextValue } from "../../international";
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
 * onExpandedChange, selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange,
 * checkable, checkedKeys, defaultCheckedKeys, onCheckedChange, onItemClick, isDisabled,
 * disabled, loading, loadingLabel, renderItem, slots, virtual, itemHeight, height, empty,
 * ref, and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the scrolling container.
 * Items expose `role="treeitem"`, `aria-level`, `aria-expanded`, `aria-selected`, `aria-checked`,
 * and `aria-disabled`; children are grouped under `role="group"`. A single roving tab stop and
 * ArrowUp/ArrowDown/ArrowLeft/ArrowRight/Home/End/Enter/Space navigation are built in.
 * @example
 * <Tree items={nodes} checkable virtual height={320} aria-label="Outline" />
 */
export interface TreeProps<Item> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
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
    onItemClick?: (item: Item, key: string) => void;
    isDisabled?: (item: Item, level: number) => boolean;
    disabled?: boolean;
    loading?: boolean;
    /** Accessible loading label; defaults to the localised Loading label. */
    loadingLabel?: string;
    renderItem?: (item: Item, level: number, expanded: boolean) => ReactNode;
    slots?: TreeSlots<Item>;
    virtual?: boolean;
    itemHeight?: number;
    height?: number;
    /** Empty-state content; defaults to the localised Empty label. */
    empty?: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders an expandable Material tree with adapter, selection, check, optional
 * fixed-row virtualisation, loading and empty states, and native `div`
 * pass-through for attributes, events, and refs.
 * @param props - Tree data, expansion, selection, check state, and native attributes.
 * @example
 * <Tree items={nodes} selectionMode="single" aria-label="Outline" />
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
    onItemClick,
    isDisabled,
    disabled = false,
    loading = false,
    loadingLabel,
    renderItem,
    slots,
    virtual = false,
    itemHeight = 40,
    height = 320,
    empty,
    className = "",
    style,
    role = "tree",
    ref,
    onScroll,
    ...rest
}: TreeProps<Item>): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const loadingText: string = loadingLabel ?? t("loading");
    const emptyContent: ReactNode = empty ?? t("empty");
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
    const [activeKey, setActiveKey]: [string | null, (next: string | null) => void] =
        useState<string | null>(null);
    const rowRefs: RefObject<Map<string, HTMLDivElement>> = useRef<Map<string, HTMLDivElement>>(
        new Map<string, HTMLDivElement>(),
    );
    const pendingFocusRef: RefObject<string | null> = useRef<string | null>(null);
    const visible: ListAdapter<Item> = tree.flatten(expanded);
    const {
        attachViewport,
        start: windowStart,
        end: windowEnd,
        onScroll: handleVirtualScroll,
        scrollToIndex,
    }: VirtualWindow = useVirtualWindow({
        count: visible.size,
        itemHeight,
        fallbackHeight: height,
        overscan: 4,
        resetKey: loading,
    });
    const start: number = virtual ? windowStart : 0;
    const end: number = virtual ? windowEnd : visible.size;
    const entries: readonly ListEntry<Item>[] = visible.getRange(start, end);
    const spacerStyle: CSSProperties = virtual
        ? { height: visible.size * itemHeight, position: "relative" }
        : {};
    const rootRef: RefCallback<HTMLDivElement> = useMemo(
        (): RefCallback<HTMLDivElement> =>
            composeRefs<HTMLDivElement>([virtual ? attachViewport : (void 0), ref]),
        [virtual, attachViewport, ref],
    );
    const handleScroll: UIEventHandler<HTMLDivElement> = (event: UIEvent<HTMLDivElement>): void => {
        if (virtual) {
            handleVirtualScroll(event);
        }

        onScroll?.(event);
    };

    const resolveDepth: (entry: ListEntry<Item>) => number = (entry: ListEntry<Item>): number =>
        isTreeOption(entry.item) ? entry.item.depth : entry.level;
    const resolveRowDisabled: (entry: ListEntry<Item>) => boolean = (entry: ListEntry<Item>): boolean =>
        disabled || isDisabled?.(entry.item, resolveDepth(entry)) === true;
    const visibleEntries: readonly ListEntry<Item>[] = visible.getRange(0, visible.size);
    const firstEnabledKey: (candidates: readonly ListEntry<Item>[]) => string | null = (
        candidates: readonly ListEntry<Item>[],
    ): string | null => {
        for (const candidate of candidates) {
            if (!resolveRowDisabled(candidate)) {
                return candidate.key;
            }
        }

        return null;
    };
    const findEnabledKey: (from: number, step: 1 | -1) => string | null = (
        from: number,
        step: 1 | -1,
    ): string | null => {
        for (let index: number = from; index >= 0 && index < visible.size; index += step) {
            const candidate: ListEntry<Item> = visible.getEntry(index);

            if (!resolveRowDisabled(candidate)) {
                return candidate.key;
            }
        }

        return null;
    };
    const resolveVisibleActiveKey: () => string | null = (): string | null => {
        if (activeKey === null) {
            return null;
        }

        if (visible.indexOf(activeKey) !== -1) {
            return activeKey;
        }

        if (tree.indexOf(activeKey) === -1) {
            return null;
        }

        const path: readonly string[] = tree.getPath(activeKey);

        for (let index: number = path.length - 1; index >= 0; index -= 1) {
            if (visible.indexOf(path[index]) !== -1) {
                return path[index];
            }
        }

        return null;
    };
    const visibleActiveKey: string | null = resolveVisibleActiveKey();
    const visibleActiveIndex: number = visibleActiveKey === null ? -1 : visible.indexOf(visibleActiveKey);
    const normalizedActiveKey: string | null =
        visibleActiveIndex !== -1 && !resolveRowDisabled(visible.getEntry(visibleActiveIndex))
            ? visibleActiveKey
            : firstEnabledKey(visibleEntries);
    const renderedKeys: ReadonlySet<string> = new Set<string>(
        entries.map((entry: ListEntry<Item>): string => entry.key),
    );
    const rovingKey: string | null =
        normalizedActiveKey !== null && renderedKeys.has(normalizedActiveKey)
            ? normalizedActiveKey
            : firstEnabledKey(entries);
    const childrenByParent: Map<string | null, ListEntry<Item>[]> = new Map<
        string | null,
        ListEntry<Item>[]
    >();

    for (const entry of entries) {
        const parentKey: string | null =
            entry.parentKey !== null && renderedKeys.has(entry.parentKey) ? entry.parentKey : null;
        const siblings: ListEntry<Item>[] | undefined = childrenByParent.get(parentKey);

        if (siblings === (void 0)) {
            childrenByParent.set(parentKey, [entry]);
        } else {
            siblings.push(entry);
        }
    }

    const rootEntries: readonly ListEntry<Item>[] = childrenByParent.get(null) ?? [];

    useEffect((): void => {
        const key: string | null = pendingFocusRef.current;

        if (key === null) {
            return;
        }

        if (visible.indexOf(key) === -1) {
            pendingFocusRef.current = null;
            return;
        }

        const node: HTMLDivElement | undefined = rowRefs.current.get(key);

        if (node === (void 0)) {
            return;
        }

        pendingFocusRef.current = null;
        node.focus();
    });

    const focusKey: (key: string) => void = (key: string): void => {
        const index: number = visible.indexOf(key);

        if (index === -1 || resolveRowDisabled(visible.getEntry(index))) {
            return;
        }

        setActiveKey(key);

        const node: HTMLDivElement | undefined = rowRefs.current.get(key);

        if (node !== (void 0)) {
            pendingFocusRef.current = null;
            node.focus();
            return;
        }

        pendingFocusRef.current = key;

        if (virtual) {
            scrollToIndex(index, "nearest");
        }
    };

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

    const handleRowKeyDown: (
        event: ReactKeyboardEvent<HTMLDivElement>,
        entry: ListEntry<Item>,
        rowDisabled: boolean,
    ) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
        entry: ListEntry<Item>,
        rowDisabled: boolean,
    ): void => {
        const fromCheckbox: boolean = (event.target as Element).closest(".checkbox") !== null;

        if (rowDisabled) {
            return;
        }

        if (fromCheckbox && (event.key === "Enter" || event.key === " " || event.key === "Spacebar")) {
            return;
        }

        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            setActiveKey(entry.key);

            if (checkable && selectionMode === "none") {
                toggleCheck(entry.key);
            } else {
                toggleSelection(entry.key);
            }

            onItemClick?.(entry.item, entry.key);
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step: 1 | -1 = event.key === "ArrowDown" ? 1 : -1;
            const nextKey: string | null = findEnabledKey(entry.index + step, step);

            if (nextKey !== null) {
                focusKey(nextKey);
            }

            return;
        }

        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const from: number = event.key === "Home" ? 0 : visible.size - 1;
            const step: 1 | -1 = event.key === "Home" ? 1 : -1;
            const nextKey: string | null = findEnabledKey(from, step);

            if (nextKey !== null) {
                focusKey(nextKey);
            }

            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();

            if (!tree.isExpandable(entry.key)) {
                return;
            }

            if (!expanded.has(entry.key)) {
                toggleExpansion(entry.key);
                return;
            }

            const firstChildKey: string | undefined = tree.getChildren(entry.key)[0];

            if (firstChildKey !== (void 0)) {
                focusKey(firstChildKey);
            }

            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();

            if (tree.isExpandable(entry.key) && expanded.has(entry.key)) {
                toggleExpansion(entry.key);
                return;
            }

            let parentKey: string | null = entry.parentKey;

            while (parentKey !== null) {
                const parentIndex: number = visible.indexOf(parentKey);

                if (parentIndex === -1) {
                    return;
                }

                const parentEntry: ListEntry<Item> = visible.getEntry(parentIndex);

                if (!resolveRowDisabled(parentEntry)) {
                    focusKey(parentKey);
                    return;
                }

                parentKey = parentEntry.parentKey;
            }
        }
    };

    const handleRowClick: (
        event: ReactMouseEvent<HTMLDivElement>,
        entry: ListEntry<Item>,
        rowDisabled: boolean,
    ) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
        entry: ListEntry<Item>,
        rowDisabled: boolean,
    ): void => {
        if (rowDisabled) {
            return;
        }

        setActiveKey(entry.key);

        if ((event.target as Element).closest(".tree__toggle, .checkbox") !== null) {
            return;
        }

        if (tree.isExpandable(entry.key)) {
            toggleExpansion(entry.key);
        }

        toggleSelection(entry.key);
        onItemClick?.(entry.item, entry.key);
    };

    const renderRow: (entry: ListEntry<Item>) => ReactNode = (entry: ListEntry<Item>): ReactNode => {
        const expandable: boolean = tree.isExpandable(entry.key);
        const isExpanded: boolean = expanded.has(entry.key);
        const isSelected: boolean = selected.has(entry.key);
        const isChecked: boolean = checked.has(entry.key);
        const depth: number = resolveDepth(entry);
        const rowDisabled: boolean = resolveRowDisabled(entry);
        const siblingKeys: readonly string[] = virtual ? tree.getChildren(entry.parentKey) : [];
        const positionInSet: number = virtual ? siblingKeys.indexOf(entry.key) + 1 : 0;
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
                ref={(node: HTMLDivElement | null): void => {
                    if (node === null) {
                        rowRefs.current.delete(entry.key);
                        return;
                    }

                    rowRefs.current.set(entry.key, node);
                }}
                className={cx(
                    "tree__row",
                    isSelected && "tree__row--selected",
                    rowDisabled && "tree__row--disabled",
                )}
                style={rowStyle}
                role="treeitem"
                aria-selected={selectionMode === "none" ? (void 0) : isSelected}
                aria-checked={checkable ? isChecked : (void 0)}
                aria-expanded={expandable ? isExpanded : (void 0)}
                aria-level={depth + 1}
                aria-disabled={rowDisabled ? "true" : (void 0)}
                aria-posinset={virtual && positionInSet > 0 ? positionInSet : (void 0)}
                aria-setsize={virtual && siblingKeys.length > 0 ? siblingKeys.length : (void 0)}
                tabIndex={!rowDisabled && entry.key === rovingKey ? 0 : -1}
                disabled={rowDisabled}
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                onFocus={(): void => {
                    setActiveKey(entry.key);
                }}
                onClick={(event: ReactMouseEvent<HTMLDivElement>): void => {
                    handleRowClick(event, entry, rowDisabled);
                }}
                onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>): void => {
                    handleRowKeyDown(event, entry, rowDisabled);
                }}
            >
                <span
                    className={
                        expandable ? "tree__toggle" : "tree__toggle tree__toggle--empty"
                    }
                    onClick={(event: ReactMouseEvent<HTMLSpanElement>): void => {
                        event.stopPropagation();

                        if (expandable && !rowDisabled) {
                            setActiveKey(entry.key);
                            toggleExpansion(entry.key);
                            rowRefs.current.get(entry.key)?.focus();
                        }
                    }}
                    role="presentation"
                >
                    {expandable ? (
                        <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={14} />
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
                            disabled={rowDisabled}
                            onCheckedChange={(): void => {
                                if (!rowDisabled) {
                                    setActiveKey(entry.key);
                                    toggleCheck(entry.key);
                                }
                            }}
                            label={
                                <span className="visually-hidden">
                                    {t("selectNode", {
                                        index: entry.index + 1,
                                        total: visible.size,
                                    })}
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
    };

    const renderEntry: (entry: ListEntry<Item>) => ReactNode = (entry: ListEntry<Item>): ReactNode => {
        const childEntries: readonly ListEntry<Item>[] = childrenByParent.get(entry.key) ?? [];

        return (
            <Fragment key={entry.key}>
                {renderRow(entry)}
                {childEntries.length === 0 ? null : (
                    <div className="tree__group" role="group">
                        {childEntries.map(renderEntry)}
                    </div>
                )}
            </Fragment>
        );
    };

    return (
        <div
            {...rest}
            ref={rootRef}
            role={role}
            aria-label={rest["aria-label"] ?? t("tree")}
            className={cx("tree", virtual && "tree--virtual", disabled && "tree--disabled", className)}
            style={virtual ? { ...style, height } : style}
            aria-busy={loading ? "true" : rest["aria-busy"]}
            aria-disabled={disabled ? "true" : rest["aria-disabled"]}
            aria-multiselectable={
                selectionMode === "multiple" || checkable
                    ? "true"
                    : rest["aria-multiselectable"]
            }
            data-disabled={disabled ? "true" : "false"}
            data-loading={loading ? "true" : "false"}
            onScroll={handleScroll}
        >
            {loading ? (
                <div className="tree__state">
                    <Spinner size="sm" label={loadingText} />
                </div>
            ) : entries.length === 0 ? (
                <div className="tree__state" role="status">
                    {emptyContent}
                </div>
            ) : (
                <div className="tree__spacer" style={spacerStyle} role="none">
                    {rootEntries.map(renderEntry)}
                </div>
            )}
        </div>
    );
};

export default Tree;
