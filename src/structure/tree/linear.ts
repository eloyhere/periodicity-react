import { useHash as computeHash } from "../hash/hash";
import type { Hash } from "../hash/hash";
import { LinearNode, Node } from "../node";

const InitialCapacity: number = 8;
const LoadFactor: number = 0.75;
const Mask32: Hash = 0xffffffffn;

/**
 * Creates an empty bucket array with `capacity` buckets.
 * @param capacity - Number of buckets; must be a power of two.
 * @example
 * const buckets = createBuckets(8);
 * @returns An array of empty buckets.
 */
const createBuckets: <K, V>(capacity: number) => Array<Array<LinearNode<K, V>>> = <K, V>(
    capacity: number,
): Array<Array<LinearNode<K, V>>> =>
    Array.from({ length: capacity }, (): Array<LinearNode<K, V>> => []);

/**
 * Mixes the high and low halves of a hash into one 32-bit number.
 * @param hash - Hash to mix.
 * @example
 * const mixed: number = mixHash(1n);
 * @returns The mixed unsigned 32-bit value.
 */
const mixHash: (hash: Hash) => number = (hash: Hash): number => {
    const low: number = Number(hash & Mask32);
    const high: number = Number((hash >> 32n) & Mask32);
    let mixed: number = (low ^ high) >>> 0;

    mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b) >>> 0;
    mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35) >>> 0;

    return (mixed ^ (mixed >>> 16)) >>> 0;
};

/**
 * Maps a hash to one bucket of a power-of-two bucket array.
 * @param hash - Hash to place.
 * @param capacity - Number of buckets; must be a power of two.
 * @example
 * const index = bucketOf(1n, 8);
 * @returns The zero-based bucket index.
 */
const bucketOf: (hash: Hash, capacity: number) => number = (hash: Hash, capacity: number): number =>
    mixHash(hash) & (capacity - 1);

/**
 * Insertion-ordered key/value tree backed by a doubly linked list and a custom hash index.
 * Type: class.
 * @example
 * const tree: LinearTree<string, number> = new LinearTree<string, number>();
 * tree.append("a", 1);
 */
export class LinearTree<K, V> {
    private buckets: Array<Array<LinearNode<K, V>>>;
    private head: LinearNode<K, V> | void;
    private tail: LinearNode<K, V> | void;
    private count: number;

    /**
     * Creates an empty LinearTree.
     * @example
     * const tree = new LinearTree<string, number>();
     * @returns A new LinearTree.
     */
    constructor() {
        this.buckets = createBuckets<K, V>(InitialCapacity);
        this.head = (void 0);
        this.tail = (void 0);
        this.count = 0;
    }

    /**
     * Number of stored entries.
     * @example
     * const size: number = tree.size;
     * @returns Number of stored entries.
     */
    public get size(): number {
        return this.count;
    }

    /**
     * First node in insertion order.
     * @example
     * const node = tree.first;
     * @returns The first node, or (void 0) when the tree is empty.
     */
    public get first(): LinearNode<K, V> | void {
        return this.head;
    }

    /**
     * Last node in insertion order.
     * @example
     * const node = tree.last;
     * @returns The last node, or (void 0) when the tree is empty.
     */
    public get last(): LinearNode<K, V> | void {
        return this.tail;
    }

    /**
     * Appends a new entry at the tail.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * const node = tree.append("a", 1);
     * @returns The created node.
     */
    public append(key: K, value: V): LinearNode<K, V> {
        const node: LinearNode<K, V> = new LinearNode<K, V>(new Node<K, V>(key, value));

        if (this.tail === (void 0)) {
            this.head = node;
            this.tail = node;
        } else {
            node.previous = this.tail;
            this.tail.next = node;
            this.tail = node;
        }

        this.attach(node);
        this.count += 1;
        this.ensureCapacity();

        return node;
    }

    /**
     * Prepends a new entry at the head.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * const node = tree.prepend("a", 1);
     * @returns The created node.
     */
    public prepend(key: K, value: V): LinearNode<K, V> {
        const node: LinearNode<K, V> = new LinearNode<K, V>(new Node<K, V>(key, value));

        if (this.head === (void 0)) {
            this.head = node;
            this.tail = node;
        } else {
            node.next = this.head;
            this.head.previous = node;
            this.head = node;
        }

        this.attach(node);
        this.count += 1;
        this.ensureCapacity();

        return node;
    }

    /**
     * Inserts a new entry directly after `node`.
     * @param node - Existing node to insert after.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * const created = tree.insertAfter(node, "b", 2);
     * @returns The created node.
     */
    public insertAfter(node: LinearNode<K, V>, key: K, value: V): LinearNode<K, V> {
        const created: LinearNode<K, V> = new LinearNode<K, V>(new Node<K, V>(key, value));

        created.previous = node;
        created.next = node.next;

        if (node.next === (void 0)) {
            this.tail = created;
        } else {
            node.next.previous = created;
        }

        node.next = created;
        this.attach(created);
        this.count += 1;
        this.ensureCapacity();

        return created;
    }

    /**
     * Inserts a new entry directly before `node`.
     * @param node - Existing node to insert before.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * const created = tree.insertBefore(node, "b", 2);
     * @returns The created node.
     */
    public insertBefore(node: LinearNode<K, V>, key: K, value: V): LinearNode<K, V> {
        const created: LinearNode<K, V> = new LinearNode<K, V>(new Node<K, V>(key, value));

        created.previous = node.previous;
        created.next = node;

        if (node.previous === (void 0)) {
            this.head = created;
        } else {
            node.previous.next = created;
        }

        node.previous = created;
        this.attach(created);
        this.count += 1;
        this.ensureCapacity();

        return created;
    }

    /**
     * Removes `node` from both the linked list and the hash index.
     * @param node - Node to remove.
     * @example
     * const removed: boolean = tree.remove(node);
     * @returns True when the node belonged to this tree.
     */
    public remove(node: LinearNode<K, V>): boolean {
        const index: number = bucketOf(node.item.hash, this.buckets.length);
        const bucket: Array<LinearNode<K, V>> = this.buckets[index];
        const position: number = bucket.indexOf(node);

        if (position < 0) {
            return false;
        }

        const previous: LinearNode<K, V> | void = node.previous;
        const next: LinearNode<K, V> | void = node.next;

        bucket.splice(position, 1);

        if (node === this.head) {
            this.head = next;
        }

        if (node === this.tail) {
            this.tail = previous;
        }

        node.unlink();
        this.count -= 1;

        return true;
    }

    /**
     * Finds the node stored for `key`.
     * @param key - Key to look up.
     * @example
     * const node = tree.find("a");
     * @returns The matching node, or (void 0) when absent.
     */
    public find(key: K): LinearNode<K, V> | void {
        return this.lookup(key);
    }

    /**
     * Checks whether `key` is present.
     * @param key - Key to look up.
     * @example
     * const present: boolean = tree.has("a");
     * @returns True when the key is present.
     */
    public has(key: K): boolean {
        return this.lookup(key) !== (void 0);
    }

    /**
     * Reads the value stored for `key`.
     * @param key - Key to look up.
     * @example
     * const value = tree.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const node: LinearNode<K, V> | void = this.lookup(key);

        return node === (void 0) ? (void 0) : node.item.value;
    }

    /**
     * Updates the value for `key`, or appends a new entry when the key is absent.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * tree.set("a", 1);
     * @returns This tree, for chaining.
     */
    public set(key: K, value: V): this {
        const node: LinearNode<K, V> | void = this.lookup(key);

        if (node === (void 0)) {
            this.append(key, value);
        } else {
            node.item.value = value;
        }

        return this;
    }

    /**
     * Removes `key` and its value.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = tree.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const node: LinearNode<K, V> | void = this.lookup(key);

        if (node === (void 0)) {
            return false;
        }

        return this.remove(node);
    }

    /**
     * Removes every entry and resets the hash index.
     * @example
     * tree.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.buckets = createBuckets<K, V>(InitialCapacity);
        this.head = (void 0);
        this.tail = (void 0);
        this.count = 0;
    }

    /**
     * Returns key-value pairs in insertion order.
     * @example
     * const entries = tree.entries();
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
     * Returns keys in insertion order.
     * @example
     * const keys: string[] = tree.keys();
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
     * Returns values in insertion order.
     * @example
     * const values: number[] = tree.values();
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
     * Iterates key-value pairs in insertion order.
     * @example
     * const iterator: IterableIterator<[string, number]> = tree[Symbol.iterator]();
     * const first = iterator.next();
     * @returns An iterator over key-value pairs.
     */
    public *[Symbol.iterator](): IterableIterator<[K, V]> {
        let current: LinearNode<K, V> | void = this.head;

        while (current !== (void 0)) {
            yield [current.item.key, current.item.value];
            current = current.next;
        }
    }

    /**
     * Finds the node stored for `key`.
     * @param key - Key to look up.
     * @example
     * const node = this.lookup("a");
     * @returns The matching node, or (void 0) when absent.
     */
    private lookup(key: K): LinearNode<K, V> | void {
        const hash: Hash = computeHash(key);
        const index: number = bucketOf(hash, this.buckets.length);
        const bucket: Array<LinearNode<K, V>> = this.buckets[index];

        return bucket.find((node: LinearNode<K, V>): boolean => node.item.is(key));
    }

    /**
     * Adds `node` to the bucket selected by its cached hash.
     * @param node - Node to index.
     * @example
     * this.attach(node);
     * @returns Nothing.
     */
    private attach(node: LinearNode<K, V>): void {
        const index: number = bucketOf(node.item.hash, this.buckets.length);
        this.buckets[index].push(node);
    }

    /**
     * Doubles the bucket array when the load factor exceeds 0.75.
     * @example
     * this.ensureCapacity();
     * @returns Nothing.
     */
    private ensureCapacity(): void {
        if (this.count > this.buckets.length * LoadFactor) {
            this.rebuild(this.buckets.length * 2);
        }
    }

    /**
     * Rebuilds the hash index with `capacity` buckets.
     * @param capacity - Number of buckets; must be a power of two.
     * @example
     * this.rebuild(16);
     * @returns Nothing.
     */
    private rebuild(capacity: number): void {
        const buckets: Array<Array<LinearNode<K, V>>> = createBuckets<K, V>(capacity);
        let current: LinearNode<K, V> | void = this.head;

        while (current !== (void 0)) {
            const index: number = bucketOf(current.item.hash, capacity);
            buckets[index].push(current);
            current = current.next;
        }

        this.buckets = buckets;
    }
}

export default LinearTree;
