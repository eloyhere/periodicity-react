import { LinearNode, Node } from "../node";

const InitialCapacity: number = 16;
const LoadFactor: number = 0.75;

/**
 * Creates an empty array of bucket chains.
 * @param capacity - Number of buckets; must be a power of two.
 * @example
 * const buckets: Array<Array<LinearNode<string, number>>> = createBuckets<string, number>(16);
 * @returns An array of empty buckets.
 */
const createBuckets: <K, V>(capacity: number) => Array<Array<LinearNode<K, V>>> = <K, V>(
    capacity: number,
): Array<Array<LinearNode<K, V>>> =>
    Array.from({ length: capacity }, (): Array<LinearNode<K, V>> => []);

/**
 * Maps a hash to one bucket of a power-of-two bucket array.
 * @param hash - Hash to place.
 * @param capacity - Number of buckets; must be a power of two.
 * @example
 * const index: number = bucketOf(1n, 16);
 * @returns The zero-based bucket index.
 */
const bucketOf: (hash: bigint, capacity: number) => number = (hash: bigint, capacity: number): number =>
    Number(hash & BigInt(capacity - 1));

/**
 * Hash index map whose iteration order is unspecified.
 * Type: class.
 * @example
 * const map: UnorderedMap<string, number> = new UnorderedMap<string, number>();
 * map.set("a", 1);
 */
export class UnorderedMap<K, V> {
    private buckets: Array<Array<LinearNode<K, V>>>;
    private nodes: Array<LinearNode<K, V>>;
    private count: number;

    /**
     * Creates an empty unordered map.
     * @example
     * const map: UnorderedMap<string, number> = new UnorderedMap<string, number>();
     * @returns A new UnorderedMap.
     */
    constructor() {
        this.buckets = createBuckets<K, V>(InitialCapacity);
        this.nodes = [];
        this.count = 0;
    }

    /**
     * Number of entries.
     * @example
     * const size: number = map.size;
     * @returns Number of entries.
     */
    public get size(): number {
        return this.count;
    }

    /**
     * Checks whether `key` is present.
     * @param key - Key to look up.
     * @example
     * const present: boolean = map.has("a");
     * @returns True when the key is present.
     */
    public has(key: K): boolean {
        return this.find(key) !== (void 0);
    }

    /**
     * Reads the value stored for `key`.
     * @param key - Key to look up.
     * @example
     * const value: number | void = map.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const node: LinearNode<K, V> | void = this.find(key);

        return node === (void 0) ? (void 0) : node.item.value;
    }

    /**
     * Stores `value` under `key`; iteration order is not guaranteed.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * map.set("a", 1);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const existing: LinearNode<K, V> | void = this.find(key);

        if (existing !== (void 0)) {
            existing.item.value = value;

            return this;
        }

        const item: Node<K, V> = new Node<K, V>(key, value);
        const node: LinearNode<K, V> = new LinearNode<K, V>(item);
        const index: number = bucketOf(item.hash, this.buckets.length);

        this.buckets[index].push(node);
        this.nodes.push(node);
        this.count += 1;
        this.ensureCapacity();

        return this;
    }

    /**
     * Removes `key`, its bucket chain node, and its record.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = map.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const node: LinearNode<K, V> | void = this.find(key);

        if (node === (void 0)) {
            return false;
        }

        const bucket: Array<LinearNode<K, V>> = this.buckets[bucketOf(node.item.hash, this.buckets.length)];
        const bucketIndex: number = bucket.indexOf(node);

        if (bucketIndex >= 0) {
            bucket.splice(bucketIndex, 1);
        }

        const nodeIndex: number = this.nodes.indexOf(node);

        if (nodeIndex >= 0) {
            this.nodes.splice(nodeIndex, 1);
        }

        this.count -= 1;

        return true;
    }

    /**
     * Removes every entry and resets the bucket index.
     * @example
     * map.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.buckets = createBuckets<K, V>(InitialCapacity);
        this.nodes = [];
        this.count = 0;
    }

    /**
     * Returns keys; order is unspecified.
     * @example
     * const keys: string[] = map.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.nodes.map((node: LinearNode<K, V>): K => node.item.key);
    }

    /**
     * Returns values; order is unspecified.
     * @example
     * const values: number[] = map.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.nodes.map((node: LinearNode<K, V>): V => node.item.value);
    }

    /**
     * Returns key-value pairs; order is unspecified.
     * @example
     * const entries: Array<readonly [string, number]> = map.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.nodes.map((node: LinearNode<K, V>): readonly [K, V] => node.item.toEntry());
    }

    /**
     * Visits each entry; order is unspecified.
     * @param callback - Called with value and key.
     * @example
     * map.forEach((value: number, key: string): void => {
     *     entries.push([key, value] as const);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: V, key: K) => void): void {
        this.nodes.forEach((node: LinearNode<K, V>): void => {
            callback(node.item.value, node.item.key);
        });
    }

    /**
     * Iterates key-value pairs; order is unspecified.
     * @example
     * for (const entry of map) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over key-value pairs.
     */
    public *[Symbol.iterator](): IterableIterator<[K, V]> {
        for (let index: number = 0; index < this.nodes.length; index += 1) {
            const node: LinearNode<K, V> = this.nodes[index];

            yield [node.item.key, node.item.value];
        }
    }

    /**
     * Finds the node stored for `key` by its cached hash and key equality.
     * @param key - Key to look up.
     * @example
     * const node = this.find("a");
     * @returns The matching node, or (void 0) when absent.
     */
    private find(key: K): LinearNode<K, V> | void {
        const hash: bigint = new Node<K, V>(key, (void 0) as V).hash;
        const index: number = bucketOf(hash, this.buckets.length);
        const bucket: Array<LinearNode<K, V>> = this.buckets[index];

        return bucket.find((node: LinearNode<K, V>): boolean => node.item.is(key));
    }

    /**
     * Doubles the bucket array and rehashes every record when the load factor exceeds 0.75.
     * @example
     * this.ensureCapacity();
     * @returns Nothing.
     */
    private ensureCapacity(): void {
        if (this.count <= this.buckets.length * LoadFactor) {
            return;
        }

        this.buckets = createBuckets<K, V>(this.buckets.length * 2);

        this.nodes.forEach((node: LinearNode<K, V>): void => {
            const index: number = bucketOf(node.item.hash, this.buckets.length);

            this.buckets[index].push(node);
        });
    }
}

export default UnorderedMap;
