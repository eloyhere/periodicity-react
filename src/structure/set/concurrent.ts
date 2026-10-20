import { Mutex } from "../mutex";
import { OrderedSet } from "./ordered";
import { UnorderedSet } from "./unordered";

/**
 * Copies an ordered set into an independent draft.
 * @param source - Set to copy.
 * @example
 * const draft: OrderedSet<string> = cloneOrderedSet(source);
 * @returns An independent copy.
 */
const cloneOrderedSet: <E>(source: OrderedSet<E>) => OrderedSet<E> = <E>(
    source: OrderedSet<E>,
): OrderedSet<E> => {
    const copy: OrderedSet<E> = new OrderedSet<E>();

    source.forEach((value: E): void => {
        copy.add(value);
    });

    return copy;
};

/**
 * Copies an unordered set into an independent draft.
 * @param source - Set to copy.
 * @example
 * const draft: UnorderedSet<string> = cloneUnorderedSet(source);
 * @returns An independent copy.
 */
const cloneUnorderedSet: <E>(source: UnorderedSet<E>) => UnorderedSet<E> = <E>(
    source: UnorderedSet<E>,
): UnorderedSet<E> => {
    const copy: UnorderedSet<E> = new UnorderedSet<E>();

    source.forEach((value: E): void => {
        copy.add(value);
    });

    return copy;
};

/**
 * Ordered set whose asynchronous writes are serialised by a mutex.
 * Synchronous methods are atomic within one event-loop turn; use `runExclusive`
 * or the `*Async` methods when writes may interleave at `await` points.
 * Type: class.
 * @example
 * const set: ConcurrentOrderedSet<string> = new ConcurrentOrderedSet<string>();
 * await set.addAsync("a");
 */
export class ConcurrentOrderedSet<E> {
    private source: OrderedSet<E>;
    private readonly mutex: Mutex;
    private revisionValue: bigint;

    /**
     * Creates an empty concurrent ordered set.
     * @example
     * const set: ConcurrentOrderedSet<string> = new ConcurrentOrderedSet<string>();
     * @returns A new ConcurrentOrderedSet.
     */
    constructor() {
        this.source = new OrderedSet<E>();
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
     * const present: boolean = set.has("a");
     * @returns True when the element is present.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds `value`.
     * @param value - Element to add.
     * @example
     * set.add("a");
     * @returns This instance, for chaining.
     */
    public add(value: E): this {
        this.source.add(value);
        this.revisionValue += 1n;

        return this;
    }

    /**
     * Removes `value`.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = set.delete("a");
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
     * Removes every element.
     * @example
     * set.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
        this.revisionValue += 1n;
    }

    /**
     * Returns elements in insertion order.
     * @example
     * const values: string[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.values();
    }

    /**
     * Visits each element in insertion order.
     * @param callback - Called with each element.
     * @example
     * const collected: string[] = [];
     * set.forEach((value: string): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.source.forEach(callback);
    }

    /**
     * Iterates elements in insertion order.
     * @example
     * const collected: string[] = [];
     * for (const value of set) {
     *     collected.push(value);
     * }
     * @returns An iterator over elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.source[Symbol.iterator]();
    }

    /**
     * Runs a write action under the mutex and commits the draft atomically.
     * @param action - Receives the draft set; resolve to commit, throw to discard.
     * @example
     * await set.runExclusive((draft: OrderedSet<string>): void => {
     *     draft.add("a");
     * });
     * @returns The action result after the commit.
     */
    public runExclusive<R>(action: (draft: OrderedSet<E>) => R | Promise<R>): Promise<R> {
        return this.mutex.runExclusive(async (): Promise<R> => {
            const draft: OrderedSet<E> = cloneOrderedSet(this.source);
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
     * await set.addAsync("a");
     * @returns This instance.
     */
    public addAsync(value: E): Promise<this> {
        return this.runExclusive((draft: OrderedSet<E>): this => {
            draft.add(value);

            return this;
        });
    }

    /**
     * Removes `value` inside an exclusive transaction.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = await set.deleteAsync("a");
     * @returns True when the element was removed.
     */
    public deleteAsync(value: E): Promise<boolean> {
        return this.runExclusive((draft: OrderedSet<E>): boolean => draft.delete(value));
    }

    /**
     * Waits for pending writes and copies the committed elements.
     * @example
     * const view: OrderedSet<string> = await set.snapshotAsync();
     * @returns An independent snapshot.
     */
    public snapshotAsync(): Promise<OrderedSet<E>> {
        return this.mutex.runExclusive((): OrderedSet<E> => cloneOrderedSet(this.source));
    }

    /**
     * Returns a shallow copy of the current elements.
     * @example
     * const view: OrderedSet<string> = set.snapshot();
     * @returns An independent OrderedSet.
     */
    public snapshot(): OrderedSet<E> {
        return cloneOrderedSet(this.source);
    }
}

/**
 * Unordered set whose asynchronous writes are serialised by a mutex.
 * Synchronous methods are atomic within one event-loop turn; use `runExclusive`
 * or the `*Async` methods when writes may interleave at `await` points.
 * Type: class.
 * @example
 * const set: ConcurrentUnorderedSet<string> = new ConcurrentUnorderedSet<string>();
 * await set.addAsync("a");
 */
export class ConcurrentUnorderedSet<E> {
    private source: UnorderedSet<E>;
    private readonly mutex: Mutex;
    private revisionValue: bigint;

    /**
     * Creates an empty concurrent unordered set.
     * @example
     * const set: ConcurrentUnorderedSet<string> = new ConcurrentUnorderedSet<string>();
     * @returns A new ConcurrentUnorderedSet.
     */
    constructor() {
        this.source = new UnorderedSet<E>();
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
     * const present: boolean = set.has("a");
     * @returns True when the element is present.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds `value`.
     * @param value - Element to add.
     * @example
     * set.add("a");
     * @returns This instance, for chaining.
     */
    public add(value: E): this {
        this.source.add(value);
        this.revisionValue += 1n;

        return this;
    }

    /**
     * Removes `value`.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = set.delete("a");
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
     * Removes every element.
     * @example
     * set.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
        this.revisionValue += 1n;
    }

    /**
     * Returns elements; order is unspecified.
     * @example
     * const values: string[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.values();
    }

    /**
     * Visits each element; order is unspecified.
     * @param callback - Called with each element.
     * @example
     * const collected: string[] = [];
     * set.forEach((value: string): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.source.forEach(callback);
    }

    /**
     * Iterates elements; order is unspecified.
     * @example
     * const collected: string[] = [];
     * for (const value of set) {
     *     collected.push(value);
     * }
     * @returns An iterator over elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.source[Symbol.iterator]();
    }

    /**
     * Runs a write action under the mutex and commits the draft atomically.
     * @param action - Receives the draft set; resolve to commit, throw to discard.
     * @example
     * await set.runExclusive((draft: UnorderedSet<string>): void => {
     *     draft.add("a");
     * });
     * @returns The action result after the commit.
     */
    public runExclusive<R>(action: (draft: UnorderedSet<E>) => R | Promise<R>): Promise<R> {
        return this.mutex.runExclusive(async (): Promise<R> => {
            const draft: UnorderedSet<E> = cloneUnorderedSet(this.source);
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
     * await set.addAsync("a");
     * @returns This instance.
     */
    public addAsync(value: E): Promise<this> {
        return this.runExclusive((draft: UnorderedSet<E>): this => {
            draft.add(value);

            return this;
        });
    }

    /**
     * Removes `value` inside an exclusive transaction.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = await set.deleteAsync("a");
     * @returns True when the element was removed.
     */
    public deleteAsync(value: E): Promise<boolean> {
        return this.runExclusive((draft: UnorderedSet<E>): boolean => draft.delete(value));
    }

    /**
     * Waits for pending writes and copies the committed elements.
     * @example
     * const view: UnorderedSet<string> = await set.snapshotAsync();
     * @returns An independent snapshot.
     */
    public snapshotAsync(): Promise<UnorderedSet<E>> {
        return this.mutex.runExclusive((): UnorderedSet<E> => cloneUnorderedSet(this.source));
    }

    /**
     * Returns a shallow copy of the current elements.
     * @example
     * const view: UnorderedSet<string> = set.snapshot();
     * @returns An independent UnorderedSet.
     */
    public snapshot(): UnorderedSet<E> {
        return cloneUnorderedSet(this.source);
    }
}

export default ConcurrentOrderedSet;
