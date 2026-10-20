import { Node } from "../../node";
import { normaliseCapacity } from "../internal";

/**
 * Capacity-bounded least-recently-used map with deterministic recency-ordered iteration.
 *
 * The backing `Map` stores entries in least-to-most-recent order. A successful `get` or `has`, and every `set`, moves
 * the touched entry to the end of that order; an insertion that overflows the capacity removes the first entry. All
 * snapshots (`keys`, `values`, `entries`, `at`, `forEach` and `[Symbol.iterator]`) therefore run from the next eviction
 * victim to the most recently used key. Values may be `undefined`; `peek` and `contains` inspect without changing
 * recency.
 * Type: class.
 * @param capacity - Maximum number of entries; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const cache: LeastRarelyUsageOrderedMap<string, number> = new LeastRarelyUsageOrderedMap<string, number>(2);
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.get("a");
 * cache.set("c", 3);
 * const keys: string[] = cache.keys();
 */
export class LeastRarelyUsageOrderedMap<K, V> {
    private readonly index: Map<K, Node<K, V>>;
    private capacityValue: number;

    /**
     * Creates an empty recency-ordered map.
     * @param capacity - Maximum number of entries; must be a positive whole number or `Infinity`.
     * @example
     * const cache: LeastRarelyUsageOrderedMap<string, number> = new LeastRarelyUsageOrderedMap<string, number>(16);
     * @returns A new LeastRarelyUsageOrderedMap instance.
     */
    public constructor(capacity: number) {
        this.index = new Map<K, Node<K, V>>();
        this.capacityValue = normaliseCapacity(capacity);
    }

    /**
     * Number of cached entries.
     * @example
     * const size: number = cache.size();
     * @returns The current entry count.
     */
    public size(): number {
        return this.index.size;
    }

    /**
     * Maximum number of entries the cache may retain.
     * @example
     * const capacity: number = cache.capacity();
     * @returns The configured capacity, or `Infinity` when unbounded.
     */
    public capacity(): number {
        return this.capacityValue;
    }

    /**
     * Checks whether the cache has reached its capacity.
     * @example
     * const full: boolean = cache.isFull();
     * @returns True when no further entry can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.index.size >= this.capacityValue;
    }

    /**
     * Checks whether a key is present without changing its recency.
     * @param key - Key to look up.
     * @example
     * const present: boolean = cache.contains("a");
     * @returns True when the key is cached.
     */
    public contains(key: K): boolean {
        return this.index.has(key);
    }

    /**
     * Reads a value without changing the recency of its key.
     * @param key - Key to look up.
     * @example
     * const value: number | void = cache.peek("a");
     * @returns The cached value, or (void 0) when absent.
     */
    public peek(key: K): V | void {
        const node: Node<K, V> | void = this.index.get(key);

        return node === (void 0) ? (void 0) : node.value;
    }

    /**
     * Checks whether a key is present and promotes it to the most-recent position.
     * @param key - Key to look up.
     * @example
     * const present: boolean = cache.has("a");
     * @returns True when the key is cached.
     */
    public has(key: K): boolean {
        const node: Node<K, V> | void = this.index.get(key);

        if (node === (void 0)) {
            return false;
        }

        this.touch(key, node);

        return true;
    }

    /**
     * Reads a value and promotes its key to the most-recent position.
     * @param key - Key to look up.
     * @example
     * const value: number | void = cache.get("a");
     * @returns The cached value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const node: Node<K, V> | void = this.index.get(key);

        if (node === (void 0)) {
            return (void 0);
        }

        this.touch(key, node);

        return node.value;
    }

    /**
     * Inserts or updates an entry, promotes it to the most-recent position and evicts the least recently used entry
     * when the capacity has been exceeded.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * cache.set("a", 1);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const node: Node<K, V> | void = this.index.get(key);

        if (node !== (void 0)) {
            node.value = value;
            this.touch(key, node);

            return this;
        }

        this.index.set(key, new Node<K, V>(key, value));
        this.trim();

        return this;
    }

    /**
     * Removes an entry.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = cache.delete("a");
     * @returns True when the key was cached.
     */
    public delete(key: K): boolean {
        return this.index.delete(key);
    }

    /**
     * Removes every entry.
     * @example
     * cache.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.index.clear();
    }

    /**
     * Changes the capacity and evicts the least recently used entries until the new bound is satisfied.
     * @param capacity - New maximum number of entries; must be a positive whole number or `Infinity`.
     * @example
     * cache.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacityValue = normaliseCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns keys ordered from least to most recently used.
     * @example
     * const keys: string[] = cache.keys();
     * @returns A snapshot of keys; the first key is the next eviction victim.
     */
    public keys(): K[] {
        return Array.from<K>(this.index.keys());
    }

    /**
     * Returns values ordered from least to most recently used.
     * @example
     * const values: number[] = cache.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return Array.from<Node<K, V>>(this.index.values()).map((node: Node<K, V>): V => node.value);
    }

    /**
     * Returns key-value pairs ordered from least to most recently used.
     * @example
     * const entries: Array<readonly [string, number]> = cache.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return Array.from<Node<K, V>>(this.index.values()).map(
            (node: Node<K, V>): readonly [K, V] => node.toEntry(),
        );
    }

    /**
     * Reads the entry at a recency position without changing recency.
     * @param position - Zero-based position; `0` is the least recently used entry.
     * @example
     * const entry: readonly [string, number] | void = cache.at(0);
     * @returns The key-value pair, or (void 0) when the position is out of range.
     */
    public at(position: number): readonly [K, V] | void {
        const nodes: Array<Node<K, V>> = Array.from<Node<K, V>>(this.index.values());

        if (!Number.isInteger(position) || position < 0 || position >= nodes.length) {
            return (void 0);
        }

        return nodes[position].toEntry();
    }

    /**
     * Removes and returns the least recently used entry.
     * @example
     * const evicted: readonly [string, number] | void = cache.shift();
     * @returns The evicted key-value pair, or (void 0) when the cache is empty.
     */
    public shift(): readonly [K, V] | void {
        const oldest: IteratorResult<[K, Node<K, V>]> = this.index.entries().next();

        if (oldest.done === true) {
            return (void 0);
        }

        const key: K = oldest.value[0];
        const node: Node<K, V> = oldest.value[1];

        this.index.delete(key);

        return node.toEntry();
    }

    /**
     * Visits every entry from least to most recently used without changing recency.
     * @param callback - Called with the value and key.
     * @example
     * cache.forEach((value: number, key: string): void => {
     *     collected.push(`${key}:${value}`);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: V, key: K) => void): void {
        this.index.forEach((node: Node<K, V>, key: K): void => {
            callback(node.value, key);
        });
    }

    /**
     * Iterates key-value pairs from least to most recently used without changing recency.
     * @example
     * const entries: Array<[string, number]> = [...cache];
     * @returns An iterator over a snapshot of mutable key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        const entries: Array<[K, V]> = this.entries().map(
            (entry: readonly [K, V]): [K, V] => [entry[0], entry[1]],
        );

        return entries.values();
    }

    /**
     * Moves an existing entry to the most-recent end of the backing map.
     * @param key - Key to promote.
     * @param node - Node currently stored under `key`.
     * @example
     * this.touch("a", node);
     * @returns Nothing.
     */
    private touch(key: K, node: Node<K, V>): void {
        this.index.delete(key);
        this.index.set(key, node);
    }

    /**
     * Evicts least recently used entries until the configured capacity is satisfied.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        while (this.index.size > this.capacityValue) {
            const oldest: IteratorResult<[K, Node<K, V>]> = this.index.entries().next();

            if (oldest.done === true) {
                break;
            }

            this.index.delete(oldest.value[0]);
        }
    }
}

export default LeastRarelyUsageOrderedMap;
