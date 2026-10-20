import { LinearTree } from "../tree/linear";

/**
 * Insertion-ordered map backed by a LinearTree.
 * Type: class.
 * @example
 * const map: OrderedMap<string, number> = new OrderedMap<string, number>();
 * map.set("a", 1);
 */
export class OrderedMap<K, V> {
    private readonly source: LinearTree<K, V>;

    /**
     * Creates an empty ordered map.
     * @example
     * const map: OrderedMap<string, number> = new OrderedMap<string, number>();
     * @returns A new OrderedMap.
     */
    constructor() {
        this.source = new LinearTree<K, V>();
    }

    /**
     * Number of entries.
     * @example
     * const size: number = map.size;
     * @returns Number of entries.
     */
    public get size(): number {
        return this.source.size;
    }

    /**
     * Checks whether `key` is present.
     * @param key - Key to look up.
     * @example
     * const present: boolean = map.has("a");
     * @returns True when the key is present.
     */
    public has(key: K): boolean {
        return this.source.has(key);
    }

    /**
     * Reads the value stored for `key`.
     * @param key - Key to look up.
     * @example
     * const value: number | void = map.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        return this.source.get(key);
    }

    /**
     * Stores `value` under `key`, preserving insertion order.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * map.set("a", 1);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        this.source.set(key, value);

        return this;
    }

    /**
     * Removes `key` and its value.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = map.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        return this.source.delete(key);
    }

    /**
     * Removes every entry.
     * @example
     * map.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
    }

    /**
     * Returns keys in insertion order.
     * @example
     * const keys: string[] = map.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.source.keys();
    }

    /**
     * Returns values in insertion order.
     * @example
     * const values: number[] = map.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.source.values();
    }

    /**
     * Returns key-value pairs in insertion order.
     * @example
     * const entries: Array<readonly [string, number]> = map.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.source.entries();
    }

    /**
     * Visits each entry in insertion order.
     * @param callback - Called with value and key.
     * @example
     * map.forEach((value: number, key: string): void => {
     *     entries.push([key, value] as const);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: V, key: K) => void): void {
        this.source.entries().forEach((entry: readonly [K, V]): void => {
            callback(entry[1], entry[0]);
        });
    }

    /**
     * Iterates key-value pairs in insertion order.
     * @example
     * for (const entry of map) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.source[Symbol.iterator]();
    }
}

export default OrderedMap;
