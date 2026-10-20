import { compare } from "../compare";
import type { Comparator } from "../compare";
import { Mutex } from "../mutex";
import { SkipTree } from "../tree/skip";

/**
 * Copies a skip tree into an independent draft with the same configuration.
 * @param source - Tree to copy.
 * @param comparator - Key comparator of the copy.
 * @param probability - Promotion probability of the copy.
 * @param maxLevel - Maximum node height of the copy.
 * @example
 * const draft: SkipTree<string, number> = copyTree(tree, compare, 0.5, 32);
 * @returns An independent copy.
 */
const copyTree: <K, V>(
    source: SkipTree<K, V>,
    comparator: Comparator<K>,
    probability: number,
    maxLevel: number,
) => SkipTree<K, V> = <K, V>(
    source: SkipTree<K, V>,
    comparator: Comparator<K>,
    probability: number,
    maxLevel: number,
): SkipTree<K, V> => {
    const copy: SkipTree<K, V> = new SkipTree<K, V>(comparator, probability, maxLevel);

    source.entries().forEach((entry: readonly [K, V]): void => {
        copy.set(entry[0], entry[1]);
    });

    return copy;
};

/**
 * Key-ordered map with positional slices, backed by a genuine skip tree.
 * Type: class.
 * @param comparator - Key comparator; defaults to `compare`.
 * @param probability - Chance of promoting a new node one level; defaults to 0.5.
 * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
 * @example
 * const map: OrderedSkipMap<string, number> = new OrderedSkipMap<string, number>();
 * map.set("b", 2);
 */
export class OrderedSkipMap<K, V> {
    private readonly source: SkipTree<K, V>;

    /**
     * Creates an empty skip map.
     * @param comparator - Key comparator; defaults to `compare`.
     * @param probability - Chance of promoting a new node one level; defaults to 0.5.
     * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
     * @example
     * const map: OrderedSkipMap<string, number> = new OrderedSkipMap<string, number>();
     * @returns A new OrderedSkipMap.
     */
    constructor(comparator?: Comparator<K>, probability?: number, maxLevel?: number) {
        this.source = new SkipTree<K, V>(comparator, probability, maxLevel);
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
     * Stores `value` under `key` in comparator order.
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
     * Returns keys in comparator order.
     * @example
     * const keys: string[] = map.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.source.keys();
    }

    /**
     * Returns values in comparator order.
     * @example
     * const values: number[] = map.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.source.values();
    }

    /**
     * Returns key-value pairs in comparator order.
     * @example
     * const entries: Array<readonly [string, number]> = map.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.source.entries();
    }

    /**
     * Visits each entry in comparator order.
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
     * Iterates key-value pairs in comparator order.
     * @example
     * for (const entry of map) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.source[Symbol.iterator]();
    }

    /**
     * Returns a slice of entries within `[start, end)`.
     * @param start - Zero-based start index.
     * @param end - Zero-based end index, exclusive.
     * @example
     * const page: Array<readonly [string, number]> = map.slice(0, 10);
     * @returns A snapshot of key-value pairs.
     */
    public slice(start: number, end: number): Array<readonly [K, V]> {
        return this.source.entries().slice(start, end);
    }
}

/**
 * Concurrent key-ordered skip map whose asynchronous writes are serialised by a mutex.
 * Synchronous methods are atomic within one event-loop turn; use `runExclusive` or the
 * `*Async` methods when writes may interleave at `await` points.
 * Type: class.
 * @param comparator - Key comparator; defaults to `compare`.
 * @param probability - Chance of promoting a new node one level; defaults to 0.5.
 * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
 * @example
 * const map: ConcurrentUnorderedSkipMap<string, number> = new ConcurrentUnorderedSkipMap<string, number>();
 * await map.setAsync("b", 2);
 */
export class ConcurrentUnorderedSkipMap<K, V> {
    private source: SkipTree<K, V>;
    private readonly mutex: Mutex;
    private revisionValue: bigint;
    private readonly comparator: Comparator<K>;
    private readonly probability: number;
    private readonly maxLevel: number;

    /**
     * Creates an empty concurrent skip map.
     * @param comparator - Key comparator; defaults to `compare`.
     * @param probability - Chance of promoting a new node one level; defaults to 0.5.
     * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
     * @example
     * const map: ConcurrentUnorderedSkipMap<string, number> = new ConcurrentUnorderedSkipMap<string, number>();
     * @returns A new ConcurrentUnorderedSkipMap.
     */
    constructor(comparator?: Comparator<K>, probability?: number, maxLevel?: number) {
        this.comparator = comparator ?? compare;
        this.probability = probability ?? 0.5;
        this.maxLevel = maxLevel ?? 32;
        this.source = new SkipTree<K, V>(this.comparator, this.probability, this.maxLevel);
        this.mutex = new Mutex();
        this.revisionValue = 0n;
    }

    /**
     * Monotonic revision, incremented after every committed write.
     * @example
     * const revision: bigint = map.revision;
     * @returns The current revision.
     */
    public get revision(): bigint {
        return this.revisionValue;
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
     * Stores `value` under `key` and advances the revision.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * map.set("a", 1);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        this.source.set(key, value);
        this.revisionValue += 1n;

        return this;
    }

    /**
     * Removes `key` and advances the revision when it existed.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = map.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const deleted: boolean = this.source.delete(key);

        if (deleted) {
            this.revisionValue += 1n;
        }

        return deleted;
    }

    /**
     * Removes every entry and advances the revision.
     * @example
     * map.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
        this.revisionValue += 1n;
    }

    /**
     * Returns keys in comparator order.
     * @example
     * const keys: string[] = map.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.source.keys();
    }

    /**
     * Returns values in comparator order.
     * @example
     * const values: number[] = map.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.source.values();
    }

    /**
     * Returns key-value pairs in comparator order.
     * @example
     * const entries: Array<readonly [string, number]> = map.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.source.entries();
    }

    /**
     * Visits each entry in comparator order.
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
     * Iterates key-value pairs in comparator order.
     * @example
     * for (const entry of map) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.source[Symbol.iterator]();
    }

    /**
     * Returns a slice of entries within `[start, end)`.
     * @param start - Zero-based start index.
     * @param end - Zero-based end index, exclusive.
     * @example
     * const page: Array<readonly [string, number]> = map.slice(0, 10);
     * @returns A snapshot of key-value pairs.
     */
    public slice(start: number, end: number): Array<readonly [K, V]> {
        return this.source.entries().slice(start, end);
    }

    /**
     * Runs a write action under the mutex and commits the draft atomically.
     * @param action - Receives the draft tree; resolve to commit, throw to discard.
     * @example
     * await map.runExclusive((draft: SkipTree<string, number>): void => {
     *     draft.set("a", 1);
     * });
     * @returns The action result after the commit.
     */
    public runExclusive<R>(action: (draft: SkipTree<K, V>) => R | Promise<R>): Promise<R> {
        return this.mutex.runExclusive(async (): Promise<R> => {
            const draft: SkipTree<K, V> = copyTree(this.source, this.comparator, this.probability, this.maxLevel);
            const result: R = await action(draft);

            this.source = draft;
            this.revisionValue += 1n;

            return result;
        });
    }

    /**
     * Stores `value` under `key` inside an exclusive transaction.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * await map.setAsync("a", 1);
     * @returns This instance.
     */
    public setAsync(key: K, value: V): Promise<this> {
        return this.runExclusive((draft: SkipTree<K, V>): this => {
            draft.set(key, value);

            return this;
        });
    }

    /**
     * Removes `key` inside an exclusive transaction.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = await map.deleteAsync("a");
     * @returns True when the key was removed.
     */
    public deleteAsync(key: K): Promise<boolean> {
        return this.runExclusive((draft: SkipTree<K, V>): boolean => draft.delete(key));
    }

    /**
     * Waits for pending writes and copies the committed tree.
     * @example
     * const view: SkipTree<string, number> = await map.snapshotAsync();
     * @returns An independent snapshot.
     */
    public snapshotAsync(): Promise<SkipTree<K, V>> {
        return this.mutex.runExclusive(
            (): SkipTree<K, V> => copyTree(this.source, this.comparator, this.probability, this.maxLevel),
        );
    }

    /**
     * Returns a shallow copy of the committed tree.
     * @example
     * const view: SkipTree<string, number> = map.snapshot();
     * @returns An independent SkipTree.
     */
    public snapshot(): SkipTree<K, V> {
        return copyTree(this.source, this.comparator, this.probability, this.maxLevel);
    }
}

export default OrderedSkipMap;
