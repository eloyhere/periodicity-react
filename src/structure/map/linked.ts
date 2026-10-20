import { LinearNode, Node } from "../node";

/**
 * Insertion-ordered map backed by a doubly linked list of linear nodes.
 *
 * The linked list keeps iteration in first-insertion order and makes removal independent of the index, while a `Map`
 * supplies expected constant-time key lookup. Updating an existing key replaces its value without moving it, matching
 * the semantics of {@link OrderedMap}. `first` and `last` expose the ends of the order, and `shift` and `pop` remove
 * them. Type: class.
 * @example
 * const map: LinkedMap<string, number> = new LinkedMap<string, number>();
 * map.set("a", 1);
 * map.set("b", 2);
 * const keys: string[] = map.keys();
 */
export class LinkedMap<K, V> {
    private readonly index: Map<K, LinearNode<K, V>>;
    private head: LinearNode<K, V> | void;
    private tail: LinearNode<K, V> | void;

    /**
     * Creates an empty insertion-ordered map.
     * @example
     * const map: LinkedMap<string, number> = new LinkedMap<string, number>();
     * @returns A new LinkedMap instance.
     */
    public constructor() {
        this.index = new Map<K, LinearNode<K, V>>();
        this.head = (void 0);
        this.tail = (void 0);
    }

    /**
     * Number of entries.
     * @example
     * const size: number = map.size;
     * @returns Number of entries.
     */
    public get size(): number {
        return this.index.size;
    }

    /**
     * Checks whether the map holds no entries.
     * @example
     * const empty: boolean = map.isEmpty();
     * @returns True when the map is empty.
     */
    public isEmpty(): boolean {
        return this.index.size === 0;
    }

    /**
     * Checks whether `key` is present.
     * @param key - Key to look up.
     * @example
     * const present: boolean = map.has("a");
     * @returns True when the key is present.
     */
    public has(key: K): boolean {
        return this.index.has(key);
    }

    /**
     * Reads the value stored for `key`.
     * @param key - Key to look up.
     * @example
     * const value: number | void = map.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const node: LinearNode<K, V> | void = this.index.get(key);

        return node === (void 0) ? (void 0) : node.item.value;
    }

    /**
     * Stores `value` under `key`, appending a new key at the end of the insertion order.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * map.set("a", 1);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const existing: LinearNode<K, V> | void = this.index.get(key);

        if (existing !== (void 0)) {
            existing.item.value = value;

            return this;
        }

        const node: LinearNode<K, V> = new LinearNode<K, V>(new Node<K, V>(key, value));

        node.previous = this.tail;

        if (this.tail === (void 0)) {
            this.head = node;
        } else {
            this.tail.next = node;
        }

        this.tail = node;
        this.index.set(key, node);

        return this;
    }

    /**
     * Removes `key` and its linked node.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = map.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const node: LinearNode<K, V> | void = this.index.get(key);

        if (node === (void 0)) {
            return false;
        }

        const previous: LinearNode<K, V> | void = node.previous;
        const next: LinearNode<K, V> | void = node.next;

        node.unlink();

        if (previous === (void 0)) {
            this.head = next;
        }

        if (next === (void 0)) {
            this.tail = previous;
        }

        this.index.delete(key);

        return true;
    }

    /**
     * Removes every entry.
     * @example
     * map.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.index.clear();
        this.head = (void 0);
        this.tail = (void 0);
    }

    /**
     * Returns keys in first-insertion order.
     * @example
     * const keys: string[] = map.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        const result: K[] = [];
        let current: LinearNode<K, V> | void = this.head;

        while (current !== (void 0)) {
            result.push(current.item.key);
            current = current.next;
        }

        return result;
    }

    /**
     * Returns values in first-insertion order.
     * @example
     * const values: number[] = map.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        const result: V[] = [];
        let current: LinearNode<K, V> | void = this.head;

        while (current !== (void 0)) {
            result.push(current.item.value);
            current = current.next;
        }

        return result;
    }

    /**
     * Returns key-value pairs in first-insertion order.
     * @example
     * const entries: Array<readonly [string, number]> = map.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];
        let current: LinearNode<K, V> | void = this.head;

        while (current !== (void 0)) {
            result.push(current.item.toEntry());
            current = current.next;
        }

        return result;
    }

    /**
     * Visits each entry in first-insertion order.
     * @param callback - Called with the value and key.
     * @example
     * map.forEach((value: number, key: string): void => {
     *     collected.push(`${key}:${value}`);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: V, key: K) => void): void {
        let current: LinearNode<K, V> | void = this.head;

        while (current !== (void 0)) {
            callback(current.item.value, current.item.key);
            current = current.next;
        }
    }

    /**
     * Returns the first entry in insertion order.
     * @example
     * const first: readonly [string, number] | void = map.first();
     * @returns The first key-value pair, or (void 0) when empty.
     */
    public first(): readonly [K, V] | void {
        return this.head === (void 0) ? (void 0) : this.head.item.toEntry();
    }

    /**
     * Returns the last entry in insertion order.
     * @example
     * const last: readonly [string, number] | void = map.last();
     * @returns The last key-value pair, or (void 0) when empty.
     */
    public last(): readonly [K, V] | void {
        return this.tail === (void 0) ? (void 0) : this.tail.item.toEntry();
    }

    /**
     * Removes and returns the first entry in insertion order.
     * @example
     * const first: readonly [string, number] | void = map.shift();
     * @returns The removed key-value pair, or (void 0) when empty.
     */
    public shift(): readonly [K, V] | void {
        if (this.head === (void 0)) {
            return (void 0);
        }

        const entry: readonly [K, V] = this.head.item.toEntry();

        this.delete(this.head.item.key);

        return entry;
    }

    /**
     * Removes and returns the last entry in insertion order.
     * @example
     * const last: readonly [string, number] | void = map.pop();
     * @returns The removed key-value pair, or (void 0) when empty.
     */
    public pop(): readonly [K, V] | void {
        if (this.tail === (void 0)) {
            return (void 0);
        }

        const entry: readonly [K, V] = this.tail.item.toEntry();

        this.delete(this.tail.item.key);

        return entry;
    }

    /**
     * Iterates key-value pairs in first-insertion order.
     * @example
     * for (const entry of map) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over a snapshot of mutable key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        const entries: Array<[K, V]> = this.entries().map(
            (entry: readonly [K, V]): [K, V] => [entry[0], entry[1]],
        );

        return entries.values();
    }
}

export default LinkedMap;
