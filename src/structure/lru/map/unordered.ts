import { Node } from "../../node";
import { normaliseCapacity } from "../internal";

/**
 * Capacity-bounded least-recently-used map without an iteration-order guarantee.
 *
 * Storage and recency are deliberately separate: the `Map` index keeps entries in insertion order, while a `Set` of
 * keys records least-to-most-recent order for eviction. A successful `get` or `has`, and every `set`, refreshes the
 * key in that recency set, but leaves the index untouched, so `keys`, `values`, `entries`, `at`, `forEach` and
 * `[Symbol.iterator]` expose insertion order rather than recency order and callers must not rely on any particular
 * order. `shift` still evicts the least recently used entry. Values may be `undefined`; `peek` and `contains` inspect
 * without changing recency.
 * Type: class.
 * @param capacity - Maximum number of entries; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const cache: LeastRarelyUsageUnorderedMap<string, number> = new LeastRarelyUsageUnorderedMap<string, number>(2);
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.get("a");
 * cache.set("c", 3);
 * const size: number = cache.size();
 */
export class LeastRarelyUsageUnorderedMap<K, V> {
    private readonly index: Map<K, Node<K, V>>;
    private readonly recency: Set<K>;
    private capacityValue: number;

    /**
     * Creates an empty unordered cache.
     * @param capacity - Maximum number of entries; must be a positive whole number or `Infinity`.
     * @example
     * const cache: LeastRarelyUsageUnorderedMap<string, number> =
     *     new LeastRarelyUsageUnorderedMap<string, number>(16);
     * @returns A new LeastRarelyUsageUnorderedMap instance.
     */
    public constructor(capacity: number) {
        this.index = new Map<K, Node<K, V>>();
        this.recency = new Set<K>();
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
     * Checks whether a key is present and refreshes its recency without promising an iteration position.
     * @param key - Key to look up.
     * @example
     * const present: boolean = cache.has("a");
     * @returns True when the key is cached.
     */
    public has(key: K): boolean {
        if (!this.index.has(key)) {
            return false;
        }

        this.touch(key);

        return true;
    }

    /**
     * Reads a value and refreshes the recency of its key without promising an iteration position.
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

        this.touch(key);

        return node.value;
    }

    /**
     * Inserts or updates an entry, refreshes its recency and evicts the least recently used entry when the capacity has
     * been exceeded.
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
            this.touch(key);

            return this;
        }

        this.index.set(key, new Node<K, V>(key, value));
        this.recency.add(key);
        this.trim();

        return this;
    }

    /**
     * Removes an entry from both the index and the recency record.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = cache.delete("a");
     * @returns True when the key was cached.
     */
    public delete(key: K): boolean {
        const removed: boolean = this.index.delete(key);

        if (removed) {
            this.recency.delete(key);
        }

        return removed;
    }

    /**
     * Removes every entry and every recency record.
     * @example
     * cache.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.index.clear();
        this.recency.clear();
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
     * Returns keys in the index order; the order is unspecified.
     * @example
     * const keys: string[] = cache.keys();
     * @returns A snapshot of keys in an unspecified order.
     */
    public keys(): K[] {
        return Array.from<K>(this.index.keys());
    }

    /**
     * Returns values in the index order; the order is unspecified.
     * @example
     * const values: number[] = cache.values();
     * @returns A snapshot of values in an unspecified order.
     */
    public values(): V[] {
        return Array.from<Node<K, V>>(this.index.values()).map((node: Node<K, V>): V => node.value);
    }

    /**
     * Returns key-value pairs in the index order; the order is unspecified.
     * @example
     * const entries: Array<readonly [string, number]> = cache.entries();
     * @returns A snapshot of key-value pairs in an unspecified order.
     */
    public entries(): Array<readonly [K, V]> {
        return Array.from<Node<K, V>>(this.index.values()).map(
            (node: Node<K, V>): readonly [K, V] => node.toEntry(),
        );
    }

    /**
     * Reads the entry at an index position without changing recency; the position follows the unspecified index order.
     * @param position - Zero-based position in the index order.
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
        const oldest: IteratorResult<K> = this.recency.values().next();

        if (oldest.done === true) {
            return (void 0);
        }

        const key: K = oldest.value;
        const node: Node<K, V> | void = this.index.get(key);

        this.recency.delete(key);
        this.index.delete(key);

        return node === (void 0) ? (void 0) : node.toEntry();
    }

    /**
     * Visits every entry in the index order without changing recency; the order is unspecified.
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
     * Iterates key-value pairs in the index order without changing recency; the order is unspecified.
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
     * Moves a key to the most-recent end of the recency set.
     * @param key - Key to promote.
     * @example
     * this.touch("a");
     * @returns Nothing.
     */
    private touch(key: K): void {
        this.recency.delete(key);
        this.recency.add(key);
    }

    /**
     * Evicts least recently used entries until the configured capacity is satisfied.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        while (this.index.size > this.capacityValue) {
            const oldest: IteratorResult<K> = this.recency.values().next();

            if (oldest.done === true) {
                break;
            }

            const key: K = oldest.value;

            this.recency.delete(key);
            this.index.delete(key);
        }
    }
}

export default LeastRarelyUsageUnorderedMap;
