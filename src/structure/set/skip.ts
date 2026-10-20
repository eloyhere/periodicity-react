import { compare } from "../compare";
import type { Comparator } from "../compare";
import { Mutex } from "../mutex";
import { OrderedSkipMap } from "../map/skip";

/**
 * Copies an ordered skip set into an independent draft with the same configuration.
 * @param source - Set to copy.
 * @param comparator - Element comparator of the copy.
 * @param probability - Promotion probability of the copy.
 * @param maxLevel - Maximum node height of the copy.
 * @example
 * const draft: OrderedSkipSet<number> = copySet(set, compare, 0.5, 32);
 * @returns An independent copy.
 */
const copySet: <E>(
    source: OrderedSkipSet<E>,
    comparator: Comparator<E>,
    probability: number,
    maxLevel: number,
) => OrderedSkipSet<E> = <E>(
    source: OrderedSkipSet<E>,
    comparator: Comparator<E>,
    probability: number,
    maxLevel: number,
): OrderedSkipSet<E> => {
    const copy: OrderedSkipSet<E> = new OrderedSkipSet<E>(comparator, probability, maxLevel);

    source.forEach((value: E): void => {
        copy.add(value);
    });

    return copy;
};

/**
 * Key-ordered set with positional slices, backed by an ordered skip map.
 * Type: class.
 * @param comparator - Element comparator; defaults to `compare`.
 * @param probability - Chance of promoting a new node one level; defaults to 0.5.
 * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
 * @example
 * const set: OrderedSkipSet<number> = new OrderedSkipSet<number>();
 * set.add(2);
 */
export class OrderedSkipSet<E> {
    private readonly source: OrderedSkipMap<E, true>;

    /**
     * Creates an empty ordered skip set.
     * @param comparator - Element comparator; defaults to `compare`.
     * @param probability - Chance of promoting a new node one level; defaults to 0.5.
     * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
     * @example
     * const set: OrderedSkipSet<number> = new OrderedSkipSet<number>();
     * @returns A new OrderedSkipSet.
     */
    constructor(comparator?: Comparator<E>, probability?: number, maxLevel?: number) {
        this.source = new OrderedSkipMap<E, true>(comparator, probability, maxLevel);
    }

    /**
     * Number of elements.
     * @example
     * const size: number = set.size;
     * @returns Number of elements.
     */
    public get size(): number {
        return this.source.size;
    }

    /**
     * Checks whether `value` is present.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.has(2);
     * @returns True when the element is present.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds `value` in comparator order.
     * @param value - Element to add.
     * @example
     * set.add(2);
     * @returns This instance, for chaining.
     */
    public add(value: E): this {
        this.source.set(value, true);

        return this;
    }

    /**
     * Removes `value`.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = set.delete(2);
     * @returns True when the element was removed.
     */
    public delete(value: E): boolean {
        return this.source.delete(value);
    }

    /**
     * Removes every element.
     * @example
     * set.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
    }

    /**
     * Returns elements in comparator order.
     * @example
     * const values: number[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.keys();
    }

    /**
     * Visits each element in comparator order.
     * @param callback - Called with each element.
     * @example
     * const collected: number[] = [];
     * set.forEach((value: number): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.source.keys().forEach((value: E): void => {
            callback(value);
        });
    }

    /**
     * Iterates elements in comparator order.
     * @example
     * const collected: number[] = [];
     * for (const value of set) {
     *     collected.push(value);
     * }
     * @returns An iterator over elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.source.keys().values();
    }

    /**
     * Returns a positional slice of elements within `[start, end)`.
     * @param start - Zero-based start index.
     * @param end - Zero-based end index, exclusive.
     * @example
     * const page: number[] = set.slice(0, 10);
     * @returns A snapshot of elements.
     */
    public slice(start: number, end: number): E[] {
        return this.source.slice(start, end).map((entry: readonly [E, true]): E => entry[0]);
    }
}

/**
 * Concurrent key-ordered skip set whose asynchronous writes are serialised by a mutex.
 * Synchronous methods are atomic within one event-loop turn; use `runExclusive` or the
 * `*Async` methods when writes may interleave at `await` points.
 * Type: class.
 * @param comparator - Element comparator; defaults to `compare`.
 * @param probability - Chance of promoting a new node one level; defaults to 0.5.
 * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
 * @example
 * const set: ConcurrentUnorderedSkipSet<number> = new ConcurrentUnorderedSkipSet<number>();
 * await set.addAsync(2);
 */
export class ConcurrentUnorderedSkipSet<E> {
    private source: OrderedSkipSet<E>;
    private readonly mutex: Mutex;
    private revisionValue: bigint;
    private readonly comparator: Comparator<E>;
    private readonly probability: number;
    private readonly maxLevel: number;

    /**
     * Creates an empty concurrent skip set.
     * @param comparator - Element comparator; defaults to `compare`.
     * @param probability - Chance of promoting a new node one level; defaults to 0.5.
     * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
     * @example
     * const set: ConcurrentUnorderedSkipSet<number> = new ConcurrentUnorderedSkipSet<number>();
     * @returns A new ConcurrentUnorderedSkipSet.
     */
    constructor(comparator?: Comparator<E>, probability?: number, maxLevel?: number) {
        this.comparator = comparator ?? compare;
        this.probability = probability ?? 0.5;
        this.maxLevel = maxLevel ?? 32;
        this.source = new OrderedSkipSet<E>(this.comparator, this.probability, this.maxLevel);
        this.mutex = new Mutex();
        this.revisionValue = 0n;
    }

    /**
     * Monotonic revision, incremented after every committed write.
     * @example
     * const revision: bigint = set.revision;
     * @returns The current revision.
     */
    public get revision(): bigint {
        return this.revisionValue;
    }

    /**
     * Number of elements.
     * @example
     * const size: number = set.size;
     * @returns Number of elements.
     */
    public get size(): number {
        return this.source.size;
    }

    /**
     * Checks whether `value` is present.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.has(2);
     * @returns True when the element is present.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds `value` and advances the revision.
     * @param value - Element to add.
     * @example
     * set.add(2);
     * @returns This instance, for chaining.
     */
    public add(value: E): this {
        this.source.add(value);
        this.revisionValue += 1n;

        return this;
    }

    /**
     * Removes `value` and advances the revision when it existed.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = set.delete(2);
     * @returns True when the element was removed.
     */
    public delete(value: E): boolean {
        const deleted: boolean = this.source.delete(value);

        if (deleted) {
            this.revisionValue += 1n;
        }

        return deleted;
    }

    /**
     * Removes every element and advances the revision.
     * @example
     * set.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
        this.revisionValue += 1n;
    }

    /**
     * Returns elements in comparator order.
     * @example
     * const values: number[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.values();
    }

    /**
     * Visits each element in comparator order.
     * @param callback - Called with each element.
     * @example
     * const collected: number[] = [];
     * set.forEach((value: number): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.source.forEach(callback);
    }

    /**
     * Iterates elements in comparator order.
     * @example
     * const collected: number[] = [];
     * for (const value of set) {
     *     collected.push(value);
     * }
     * @returns An iterator over elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.source[Symbol.iterator]();
    }

    /**
     * Returns a positional slice of elements within `[start, end)`.
     * @param start - Zero-based start index.
     * @param end - Zero-based end index, exclusive.
     * @example
     * const page: number[] = set.slice(0, 10);
     * @returns A snapshot of elements.
     */
    public slice(start: number, end: number): E[] {
        return this.source.slice(start, end);
    }

    /**
     * Runs a write action under the mutex and commits the draft atomically.
     * @param action - Receives the draft set; resolve to commit, throw to discard.
     * @example
     * await set.runExclusive((draft: OrderedSkipSet<number>): void => {
     *     draft.add(2);
     * });
     * @returns The action result after the commit.
     */
    public runExclusive<R>(action: (draft: OrderedSkipSet<E>) => R | Promise<R>): Promise<R> {
        return this.mutex.runExclusive(async (): Promise<R> => {
            const draft: OrderedSkipSet<E> = copySet(this.source, this.comparator, this.probability, this.maxLevel);
            const result: R = await action(draft);

            this.source = draft;
            this.revisionValue += 1n;

            return result;
        });
    }

    /**
     * Adds `value` inside an exclusive transaction.
     * @param value - Element to add.
     * @example
     * await set.addAsync(2);
     * @returns This instance.
     */
    public addAsync(value: E): Promise<this> {
        return this.runExclusive((draft: OrderedSkipSet<E>): this => {
            draft.add(value);

            return this;
        });
    }

    /**
     * Removes `value` inside an exclusive transaction.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = await set.deleteAsync(2);
     * @returns True when the element was removed.
     */
    public deleteAsync(value: E): Promise<boolean> {
        return this.runExclusive((draft: OrderedSkipSet<E>): boolean => draft.delete(value));
    }

    /**
     * Waits for pending writes and copies the committed set.
     * @example
     * const view: OrderedSkipSet<number> = await set.snapshotAsync();
     * @returns An independent snapshot.
     */
    public snapshotAsync(): Promise<OrderedSkipSet<E>> {
        return this.mutex.runExclusive(
            (): OrderedSkipSet<E> => copySet(this.source, this.comparator, this.probability, this.maxLevel),
        );
    }

    /**
     * Returns a shallow copy of the committed set.
     * @example
     * const view: OrderedSkipSet<number> = set.snapshot();
     * @returns An independent OrderedSkipSet.
     */
    public snapshot(): OrderedSkipSet<E> {
        return copySet(this.source, this.comparator, this.probability, this.maxLevel);
    }
}

export default OrderedSkipSet;
