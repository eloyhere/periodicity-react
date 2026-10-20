import { Mutex } from "../mutex";
import { OrderedMap } from "./ordered";
import { UnorderedMap } from "./unordered";

/**
 * Copies an ordered map into an independent draft.
 * @param source - Map to copy.
 * @example
 * const draft: OrderedMap<string, number> = cloneOrdered(source);
 * @returns An independent copy.
 */
const cloneOrdered: <K, V>(source: OrderedMap<K, V>) => OrderedMap<K, V> = <K, V>(
    source: OrderedMap<K, V>,
): OrderedMap<K, V> => {
    const copy: OrderedMap<K, V> = new OrderedMap<K, V>();

    source.forEach((value: V, key: K): void => {
        copy.set(key, value);
    });

    return copy;
};

/**
 * Copies an unordered map into an independent draft.
 * @param source - Map to copy.
 * @example
 * const draft: UnorderedMap<string, number> = cloneUnordered(source);
 * @returns An independent copy.
 */
const cloneUnordered: <K, V>(source: UnorderedMap<K, V>) => UnorderedMap<K, V> = <K, V>(
    source: UnorderedMap<K, V>,
): UnorderedMap<K, V> => {
    const copy: UnorderedMap<K, V> = new UnorderedMap<K, V>();

    source.forEach((value: V, key: K): void => {
        copy.set(key, value);
    });

    return copy;
};

/**
 * Insertion-ordered map whose asynchronous writes are serialised by a mutex.
 * Synchronous methods are atomic within one event-loop turn; use `runExclusive`
 * or the `*Async` methods when writes may interleave at `await` points.
 * Type: class.
 * @example
 * const map: ConcurrentOrderedMap<string, number> = new ConcurrentOrderedMap<string, number>();
 * await map.setAsync("a", 1);
 */
export class ConcurrentOrderedMap<K, V> {
    private source: OrderedMap<K, V>;
    private readonly mutex: Mutex;
    private revisionValue: bigint;

    /**
     * Creates an empty concurrent ordered map.
     * @example
     * const map: ConcurrentOrderedMap<string, number> = new ConcurrentOrderedMap<string, number>();
     * @returns A new ConcurrentOrderedMap.
     */
    constructor() {
        this.source = new OrderedMap<K, V>();
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
     * Stores `value` under `key`.
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
     * Removes `key` and its value.
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
     * Removes every entry.
     * @example
     * map.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
        this.revisionValue += 1n;
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
        this.source.forEach(callback);
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

    /**
     * Runs a write action under the mutex and commits the draft atomically.
     * @param action - Receives the draft map; resolve to commit, throw to discard.
     * @example
     * await map.runExclusive((draft: OrderedMap<string, number>): void => {
     *     draft.set("a", 1);
     * });
     * @returns The action result after the commit.
     */
    public runExclusive<R>(action: (draft: OrderedMap<K, V>) => R | Promise<R>): Promise<R> {
        return this.mutex.runExclusive(async (): Promise<R> => {
            const draft: OrderedMap<K, V> = cloneOrdered(this.source);
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
        return this.runExclusive((draft: OrderedMap<K, V>): this => {
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
        return this.runExclusive((draft: OrderedMap<K, V>): boolean => draft.delete(key));
    }

    /**
     * Updates `key` inside an exclusive transaction.
     * @param key - Key to update.
     * @param updater - Computes the next value from the current one.
     * @example
     * const next: number = await map.updateAsync("a", (previous: number | void): number => (previous ?? 0) + 1);
     * @returns The committed value.
     */
    public updateAsync(key: K, updater: (previous: V | void) => V): Promise<V> {
        return this.runExclusive((draft: OrderedMap<K, V>): V => {
            const next: V = updater(draft.get(key));

            draft.set(key, next);

            return next;
        });
    }

    /**
     * Waits for pending writes and copies the committed entries.
     * @example
     * const view: OrderedMap<string, number> = await map.snapshotAsync();
     * @returns An independent snapshot.
     */
    public snapshotAsync(): Promise<OrderedMap<K, V>> {
        return this.mutex.runExclusive((): OrderedMap<K, V> => cloneOrdered(this.source));
    }

    /**
     * Returns a shallow copy of the current entries.
     * @example
     * const view: OrderedMap<string, number> = map.snapshot();
     * @returns An independent OrderedMap.
     */
    public snapshot(): OrderedMap<K, V> {
        return cloneOrdered(this.source);
    }
}

/**
 * Unordered map whose asynchronous writes are serialised by a mutex.
 * Synchronous methods are atomic within one event-loop turn; use `runExclusive`
 * or the `*Async` methods when writes may interleave at `await` points.
 * Type: class.
 * @example
 * const map: ConcurrentUnorderedMap<string, number> = new ConcurrentUnorderedMap<string, number>();
 * await map.setAsync("a", 1);
 */
export class ConcurrentUnorderedMap<K, V> {
    private source: UnorderedMap<K, V>;
    private readonly mutex: Mutex;
    private revisionValue: bigint;

    /**
     * Creates an empty concurrent unordered map.
     * @example
     * const map: ConcurrentUnorderedMap<string, number> = new ConcurrentUnorderedMap<string, number>();
     * @returns A new ConcurrentUnorderedMap.
     */
    constructor() {
        this.source = new UnorderedMap<K, V>();
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
     * Stores `value` under `key`.
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
     * Removes `key` and its value.
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
     * Removes every entry.
     * @example
     * map.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
        this.revisionValue += 1n;
    }

    /**
     * Returns keys; order is unspecified.
     * @example
     * const keys: string[] = map.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.source.keys();
    }

    /**
     * Returns values; order is unspecified.
     * @example
     * const values: number[] = map.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.source.values();
    }

    /**
     * Returns key-value pairs; order is unspecified.
     * @example
     * const entries: Array<readonly [string, number]> = map.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        return this.source.entries();
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
        this.source.forEach(callback);
    }

    /**
     * Iterates key-value pairs; order is unspecified.
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
     * Runs a write action under the mutex and commits the draft atomically.
     * @param action - Receives the draft map; resolve to commit, throw to discard.
     * @example
     * await map.runExclusive((draft: UnorderedMap<string, number>): void => {
     *     draft.set("a", 1);
     * });
     * @returns The action result after the commit.
     */
    public runExclusive<R>(action: (draft: UnorderedMap<K, V>) => R | Promise<R>): Promise<R> {
        return this.mutex.runExclusive(async (): Promise<R> => {
            const draft: UnorderedMap<K, V> = cloneUnordered(this.source);
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
        return this.runExclusive((draft: UnorderedMap<K, V>): this => {
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
        return this.runExclusive((draft: UnorderedMap<K, V>): boolean => draft.delete(key));
    }

    /**
     * Updates `key` inside an exclusive transaction.
     * @param key - Key to update.
     * @param updater - Computes the next value from the current one.
     * @example
     * const next: number = await map.updateAsync("a", (previous: number | void): number => (previous ?? 0) + 1);
     * @returns The committed value.
     */
    public updateAsync(key: K, updater: (previous: V | void) => V): Promise<V> {
        return this.runExclusive((draft: UnorderedMap<K, V>): V => {
            const next: V = updater(draft.get(key));

            draft.set(key, next);

            return next;
        });
    }

    /**
     * Waits for pending writes and copies the committed entries.
     * @example
     * const view: UnorderedMap<string, number> = await map.snapshotAsync();
     * @returns An independent snapshot.
     */
    public snapshotAsync(): Promise<UnorderedMap<K, V>> {
        return this.mutex.runExclusive((): UnorderedMap<K, V> => cloneUnordered(this.source));
    }

    /**
     * Returns a shallow copy of the current entries.
     * @example
     * const view: UnorderedMap<string, number> = map.snapshot();
     * @returns An independent UnorderedMap.
     */
    public snapshot(): UnorderedMap<K, V> {
        return cloneUnordered(this.source);
    }
}

export default ConcurrentOrderedMap;
