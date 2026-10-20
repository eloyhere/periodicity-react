import { LeastRarelyUsageUnorderedMap } from "../map/unordered";

/**
 * Capacity-bounded least-recently-used set without an iteration-order guarantee.
 *
 * Membership is delegated to a {@link LeastRarelyUsageUnorderedMap} whose values are always `true`. A successful `has`
 * and every `add` refresh recency, while `delete` and `shift` remove the expected element and the least recently used
 * element respectively. `keys`, `values`, `entries`, `at`, `forEach` and `[Symbol.iterator]` expose the underlying
 * index order, which is unspecified; `entries` pairs each element with itself to mirror `Set.entries`, and `contains`
 * is the non-touching membership probe.
 * Type: class.
 * @param capacity - Maximum number of elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const set: LeastRarelyUsageUnorderedSet<string> = new LeastRarelyUsageUnorderedSet<string>(2);
 * set.add("a");
 * set.add("b");
 * set.has("a");
 * set.add("c");
 * const size: number = set.size();
 */
export class LeastRarelyUsageUnorderedSet<E> {
    private readonly source: LeastRarelyUsageUnorderedMap<E, true>;

    /**
     * Creates an empty unordered cache.
     * @param capacity - Maximum number of elements; must be a positive whole number or `Infinity`.
     * @example
     * const set: LeastRarelyUsageUnorderedSet<string> = new LeastRarelyUsageUnorderedSet<string>(16);
     * @returns A new LeastRarelyUsageUnorderedSet instance.
     */
    public constructor(capacity: number) {
        this.source = new LeastRarelyUsageUnorderedMap<E, true>(capacity);
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
     * Checks whether an element is present and refreshes its recency without promising an iteration position.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.has("a");
     * @returns True when the element is cached.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds an element, or refreshes it when already present, then evicts the least recently used element if the
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
     * Returns elements in the index order; the order is unspecified.
     * @example
     * const keys: string[] = set.keys();
     * @returns A snapshot of elements in an unspecified order.
     */
    public keys(): E[] {
        return this.source.keys();
    }

    /**
     * Returns elements in the index order; the order is unspecified.
     * @example
     * const values: string[] = set.values();
     * @returns A snapshot of elements in an unspecified order.
     */
    public values(): E[] {
        return this.source.keys();
    }

    /**
     * Returns element pairs in the index order, mirroring `Set.entries`; the order is unspecified.
     * @example
     * const entries: Array<readonly [string, string]> = set.entries();
     * @returns A snapshot in which each pair holds the same element twice.
     */
    public entries(): Array<readonly [E, E]> {
        return this.source.keys().map((value: E): readonly [E, E] => [value, value] as const);
    }

    /**
     * Reads the element at an index position without changing recency; the position follows the unspecified index
     * order.
     * @param position - Zero-based position in the index order.
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
     * Visits every element in the index order without changing recency; the order is unspecified.
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
     * Iterates elements in the index order without changing recency; the order is unspecified.
     * @example
     * const values: string[] = [...set];
     * @returns An iterator over a snapshot of the elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }
}

export default LeastRarelyUsageUnorderedSet;
