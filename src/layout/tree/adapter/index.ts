import type { ListAdapter } from "../../list/adapter";
import { createListAdapter } from "../../list/adapter";

/**
 * Read-only index over a tree.
 * Type: interface.
 * Fields: size, roots, getItem, getParentKey, getChildren, getPath, getLevel,
 * isExpandable, indexOf, flatten.
 * @example
 * const tree: TreeAdapter<Item> = createTreeAdapter(roots, { getKey: (item) => item.id });
 */
export interface TreeAdapter<T> {
    readonly size: number;
    readonly roots: readonly string[];
    getItem(key: string): T;
    getParentKey(key: string): string | null;
    getChildren(key: string | null): readonly string[];
    getPath(key: string): readonly string[];
    getLevel(key: string): number;
    isExpandable(key: string): boolean;
    indexOf(key: string): number;
    flatten(expandedKeys: ReadonlySet<string>): ListAdapter<T>;
}

/**
 * Tree extraction options.
 * Type: interface.
 * Fields: getKey, getChildren, isExpandable.
 * @example
 * const options: TreeAdapterOptions<Item> = { getKey: (item) => item.id };
 */
export interface TreeAdapterOptions<T> {
    getKey: (item: T, index: number) => string;
    getChildren?: (item: T) => readonly T[] | void;
    isExpandable?: (item: T) => boolean;
}

interface TreeNode<T> {
    readonly key: string;
    readonly item: T;
    readonly parentKey: string | null;
    readonly level: number;
    readonly index: number;
    readonly childKeys: readonly string[];
    readonly expandable: boolean;
}

/**
 * Builds an immutable tree adapter with an explicit stack.
 * @param roots - Root items in display order.
 * @param options - Key and child extractors.
 * @example
 * const tree: TreeAdapter<Item> = createTreeAdapter(roots, { getKey: (item) => item.id });
 * @returns A tree adapter.
 */
export const createTreeAdapter: <T>(
    roots: readonly T[],
    options: TreeAdapterOptions<T>,
) => TreeAdapter<T> = <T>(
    roots: readonly T[],
    options: TreeAdapterOptions<T>,
): TreeAdapter<T> => {
    const nodes: Map<string, TreeNode<T>> = new Map<string, TreeNode<T>>();
    const rootKeys: string[] = [];
    const order: string[] = [];
    const stack: Array<{ item: T; parentKey: string | null; level: number; index: number }> = [];

    for (let index: number = roots.length - 1; index >= 0; index -= 1) {
        stack.push({ item: roots[index], parentKey: null, level: 0, index });
    }

    while (stack.length > 0) {
        const frame: { item: T; parentKey: string | null; level: number; index: number } =
            stack.pop() as { item: T; parentKey: string | null; level: number; index: number };
        const key: string = options.getKey(frame.item, frame.index);

        if (nodes.has(key)) {
            throw new Error(`Duplicate tree key: ${key}`);
        }

        const children: readonly T[] = options.getChildren?.(frame.item) ?? [];
        const childKeys: string[] = children.map(
            (child: T, childIndex: number): string => options.getKey(child, childIndex),
        );
        const expandable: boolean =
            options.isExpandable === (void 0)
                ? children.length > 0
                : options.isExpandable(frame.item);

        nodes.set(key, {
            key,
            item: frame.item,
            parentKey: frame.parentKey,
            level: frame.level,
            index: order.length,
            childKeys,
            expandable,
        });
        order.push(key);

        if (frame.parentKey === null) {
            rootKeys.push(key);
        }

        for (let childIndex: number = children.length - 1; childIndex >= 0; childIndex -= 1) {
            stack.push({
                item: children[childIndex],
                parentKey: key,
                level: frame.level + 1,
                index: childIndex,
            });
        }
    }

    const requireNode: (key: string) => TreeNode<T> = (key: string): TreeNode<T> => {
        const node: TreeNode<T> | undefined = nodes.get(key);

        if (node === (void 0)) {
            throw new RangeError(`Unknown tree key: ${key}`);
        }

        return node;
    };

    return {
        size: order.length,
        roots: rootKeys,
        getItem: (key: string): T => requireNode(key).item,
        getParentKey: (key: string): string | null => requireNode(key).parentKey,
        getChildren: (key: string | null): readonly string[] =>
            key === null ? rootKeys : requireNode(key).childKeys,
        getPath: (key: string): readonly string[] => {
            const path: string[] = [];
            let current: string | null = key;

            while (current !== null) {
                path.unshift(current);
                current = requireNode(current).parentKey;
            }

            return path;
        },
        getLevel: (key: string): number => requireNode(key).level,
        isExpandable: (key: string): boolean => requireNode(key).expandable,
        indexOf: (key: string): number => nodes.get(key)?.index ?? -1,
        flatten: (expandedKeys: ReadonlySet<string>): ListAdapter<T> => {
            const visible: T[] = [];
            const visibleKeys: string[] = [];

            const walk: (key: string) => void = (key: string): void => {
                const node: TreeNode<T> = requireNode(key);
                visible.push(node.item);
                visibleKeys.push(key);

                if (node.expandable && expandedKeys.has(key)) {
                    for (const childKey of node.childKeys) {
                        walk(childKey);
                    }
                }
            };

            for (const rootKey of rootKeys) {
                walk(rootKey);
            }

            return createListAdapter<T>(visible, {
                getKey: (item: T, index: number): string =>
                    visibleKeys[index] ?? options.getKey(item, index),
                getLevel: (item: T, index: number): number => {
                    void item;
                    return requireNode(visibleKeys[index] ?? "").level;
                },
                getParentKey: (item: T, index: number): string | null => {
                    void item;
                    return requireNode(visibleKeys[index] ?? "").parentKey;
                },
                isExpandable: (item: T, index: number): boolean => {
                    void item;
                    return requireNode(visibleKeys[index] ?? "").expandable;
                },
            });
        },
    };
};
