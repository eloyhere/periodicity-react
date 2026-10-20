import { LeastRarelyUsageOrderedMap } from "../map/ordered";

/**
 * Capacity-bounded least-recently-used set with deterministic recency-ordered iteration.
 *
 * Membership is delegated to a {@link LeastRarelyUsageOrderedMap} whose values are always `true`. A successful `has`
 * and every `add` promote an element to the most-recent position; an insertion that overflows the capacity evicts the
 * least recently used element. `keys` and `values` are aliases that return the same snapshot, `entries` pairs each
 * element with itself (matching `Set.entries`) and all snapshots run from the next eviction victim to the most recently
 * used element. `contains` is the non-touching membership probe.
 * Type: class.
 * @param capacity - Maximum number of elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const set: LeastRarelyUsageOrderedSet<string> = new LeastRarelyUsageOrderedSet<string>(2);
 * set.add("a");
 * set.add("b");
 * set.has("a");
 * set.add("c");
 * const values: string[] = set.values();
 */
export class LeastRarelyUsageOrderedSet<E> {
    private readonly source: LeastRarelyUsageOrderedMap<E, true>;

    /**
     * Creates an empty recency-ordered set.
     * @param capacity - Maximum number of elements; must be a positive whole number or `Infinity`.
     * @example
     * const set: LeastRarelyUsageOrderedSet<string> = new LeastRarelyUsageOrderedSet<string>(16);
     * @returns A new LeastRarelyUsageOrderedSet instance.
     */
    public constructor(capacity: number) {
        this.source = new LeastRarelyUsageOrderedMap<E, true>(capacity);
    }

    /**
     * Number of cached elements.
     * @example
     * const size: number = set.size();
     * @returns The current element count.
     */
    public size(): number {
        return this.source.size();
    }

    /**
     * Maximum number of elements the set may retain.
     * @example
     * const capacity: number = set.capacity();
     * @returns The configured capacity, or `Infinity` when unbounded.
     */
    public capacity(): number {
        return this.source.capacity();
    }

    /**
     * Checks whether the set has reached its capacity.
     * @example
     * const full: boolean = set.isFull();
     * @returns True when no further element can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.source.isFull();
    }

    /**
     * Checks whether an element is present without changing its recency.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.contains("a");
     * @returns True when the element is cached.
     */
    public contains(value: E): boolean {
        return this.source.contains(value);
    }

    /**
     * Checks whether an element is present and promotes it to the most-recent position.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.has("a");
     * @returns True when the element is cached.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds an element, or promotes it when already present, then evicts the least recently used element if the
     * capacity has been exceeded.
     * @param value - Element to cache.
     * @example
     * set.add("a");
     * @returns This instance, for chaining.
     */
    public add(value: E): this {
        this.source.set(value, true);

        return this;
    }

    /**
     * Removes an element.
     * @param value - Element to remove.
     * @example
     * const removed: boolean = set.delete("a");
     * @returns True when the element was cached.
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
     * Changes the capacity and evicts the least recently used elements until the new bound is satisfied.
     * @param capacity - New maximum number of elements; must be a positive whole number or `Infinity`.
     * @example
     * set.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.source.resize(capacity);

        return this;
    }

    /**
     * Returns elements ordered from least to most recently used.
     * @example
     * const keys: string[] = set.keys();
     * @returns A snapshot of elements; the first element is the next eviction victim.
     */
    public keys(): E[] {
        return this.source.keys();
    }

    /**
     * Returns elements ordered from least to most recently used; equivalent to {@link keys}.
     * @example
     * const values: string[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.keys();
    }

    /**
     * Returns element pairs ordered from least to most recently used, mirroring `Set.entries`.
     * @example
     * const entries: Array<readonly [string, string]> = set.entries();
     * @returns A snapshot in which each pair holds the same element twice.
     */
    public entries(): Array<readonly [E, E]> {
        return this.source.keys().map((value: E): readonly [E, E] => [value, value] as const);
    }

    /**
     * Reads the element at a recency position without changing recency.
     * @param position - Zero-based position; `0` is the least recently used element.
     * @example
     * const value: string | void = set.at(0);
     * @returns The element, or (void 0) when the position is out of range.
     */
    public at(position: number): E | void {
        const entry: readonly [E, true] | void = this.source.at(position);

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Removes and returns the least recently used element.
     * @example
     * const evicted: string | void = set.shift();
     * @returns The evicted element, or (void 0) when the set is empty.
     */
    public shift(): E | void {
        const entry: readonly [E, true] | void = this.source.shift();

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Visits every element from least to most recently used without changing recency.
     * @param callback - Called with each element.
     * @example
     * set.forEach((value: string): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.values().forEach((value: E): void => callback(value));
    }

    /**
     * Iterates elements from least to most recently used without changing recency.
     * @example
     * const values: string[] = [...set];
     * @returns An iterator over a snapshot of the elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }
}

export default LeastRarelyUsageOrderedSet;
