/**
 * Indexed list adapter used by layout and component collections.
 */

/**
 * One row in a list adapter.
 * Type: interface.
 * Fields: key, index, item, level, parentKey, expandable.
 * @example
 * const entry: ListEntry<Item> = adapter.getEntry(0);
 */
export interface ListEntry<T> {
    readonly key: string;
    readonly index: number;
    readonly item: T;
    readonly level: number;
    readonly parentKey: string | null;
    readonly expandable: boolean;
}

/**
 * Read-only indexed view over a sequence.
 * Type: interface.
 * Fields: size, keys, getKey, getItem, getEntry, indexOf, getRange.
 * @example
 * const adapter: ListAdapter<Item> = createListAdapter(items);
 */
export interface ListAdapter<T> {
    readonly size: number;
    readonly keys: readonly string[];
    getKey(index: number): string;
    getItem(index: number): T;
    getEntry(index: number): ListEntry<T>;
    indexOf(key: string): number;
    getRange(start: number, end: number): readonly ListEntry<T>[];
}

/**
 * Optional metadata extractors for list rows.
 * Type: interface.
 * Fields: getKey, getLevel, getParentKey, isExpandable.
 * @example
 * const options: ListAdapterOptions<Item> = { getKey: (item) => item.id };
 */
export interface ListAdapterOptions<T> {
    getKey?: (item: T, index: number) => string;
    getLevel?: (item: T, index: number) => number;
    getParentKey?: (item: T, index: number) => string | null;
    isExpandable?: (item: T, index: number) => boolean;
}

/**
 * Builds an immutable list adapter over an array.
 * @param items - Source rows in display order.
 * @param options - Key and hierarchy extractors.
 * @example
 * const adapter: ListAdapter<Item> = createListAdapter(items, { getKey: (item) => item.id });
 * @returns An indexed list adapter.
 */
export const createListAdapter: <T>(
    items: readonly T[],
    options?: ListAdapterOptions<T>,
) => ListAdapter<T> = <T>(
    items: readonly T[],
    options: ListAdapterOptions<T> = {},
): ListAdapter<T> => {
    const entries: ListEntry<T>[] = items.map((item: T, index: number): ListEntry<T> => ({
        key: options.getKey === (void 0) ? `${index}` : options.getKey(item, index),
        index,
        item,
        level: options.getLevel === (void 0) ? 0 : options.getLevel(item, index),
        parentKey: options.getParentKey === (void 0) ? null : options.getParentKey(item, index),
        expandable: options.isExpandable === (void 0) ? false : options.isExpandable(item, index),
    }));
    const indexByKey: Map<string, number> = new Map<string, number>();

    for (const entry of entries) {
        if (indexByKey.has(entry.key)) {
            throw new Error(`Duplicate list key: ${entry.key}`);
        }

        indexByKey.set(entry.key, entry.index);
    }

    const requireIndex: (index: number) => ListEntry<T> = (index: number): ListEntry<T> => {
        if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
            throw new RangeError(`List index out of range: ${index}`);
        }

        return entries[index];
    };

    return {
        size: entries.length,
        keys: entries.map((entry: ListEntry<T>): string => entry.key),
        getKey: (index: number): string => requireIndex(index).key,
        getItem: (index: number): T => requireIndex(index).item,
        getEntry: (index: number): ListEntry<T> => requireIndex(index),
        indexOf: (key: string): number => indexByKey.get(key) ?? -1,
        getRange: (start: number, end: number): readonly ListEntry<T>[] => {
            const from: number = Math.max(0, Math.floor(start));
            const to: number = Math.min(entries.length, Math.floor(end));

            return to <= from ? [] : entries.slice(from, to);
        },
    };
};

/**
 * Alias for array-backed list adapters.
 * @param items - Source rows.
 * @param options - Key and hierarchy extractors.
 * @example
 * const adapter = createArrayAdapter(items);
 * @returns A list adapter.
 */
export const createArrayAdapter: <T>(
    items: readonly T[],
    options?: ListAdapterOptions<T>,
) => ListAdapter<T> = createListAdapter;
