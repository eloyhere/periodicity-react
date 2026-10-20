import {
    WeakLeastRarelyUsageOrderedMap,
    WeakLeastRarelyUsageUnorderedMap,
} from "../map/weak";

/**
 * Weakly held least-recently-used set with recency-ordered live iteration.
 *
 * Elements must be objects so they can be held through `WeakRef`s; membership and values live in a
 * {@link WeakLeastRarelyUsageOrderedMap} whose values are always `true`. A successful `has` and every `add` promote an
 * element, while `contains` is the non-touching probe. `size` prunes collected references and can shrink without an
 * explicit `delete`; snapshots enumerate only elements that are still reachable and run from least to most recently
 * used, so they never pretend to reveal a collected element.
 * Type: class.
 * @param capacity - Maximum number of live elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const set: WeakLeastRarelyUsageOrderedSet<object> = new WeakLeastRarelyUsageOrderedSet<object>(2);
 * const element: object = {};
 * set.add(element);
 * const present: boolean = set.has(element);
 */
export class WeakLeastRarelyUsageOrderedSet<E extends object> {
    private readonly source: WeakLeastRarelyUsageOrderedMap<E, true>;

    /**
     * Creates an empty weakly held recency-ordered set.
     * @param capacity - Maximum number of live elements; must be a positive whole number or `Infinity`.
     * @example
     * const set: WeakLeastRarelyUsageOrderedSet<object> = new WeakLeastRarelyUsageOrderedSet<object>(16);
     * @returns A new WeakLeastRarelyUsageOrderedSet instance.
     */
    public constructor(capacity: number) {
        this.source = new WeakLeastRarelyUsageOrderedMap<E, true>(capacity);
    }

    /**
     * Number of live elements after pruning collected weak references.
     * @example
     * const size: number = set.size();
     * @returns The current live element count.
     */
    public size(): number {
        return this.source.size();
    }

    /**
     * Maximum number of live elements the set may retain.
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
     * @returns True when no further live element can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.source.isFull();
    }

    /**
     * Checks whether an element is present without changing its recency.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.contains(element);
     * @returns True when the element is cached.
     */
    public contains(value: E): boolean {
        return this.source.contains(value);
    }

    /**
     * Checks whether an element is present and promotes it to the most-recent position.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.has(element);
     * @returns True when the element is cached.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds an element, or promotes it when already present, then evicts the least recently used live element if the
     * capacity has been exceeded.
     * @param value - Element to cache.
     * @example
     * set.add(element);
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
     * const removed: boolean = set.delete(element);
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
     * Changes the capacity and evicts the least recently used live elements until the new bound is satisfied.
     * @param capacity - New maximum number of live elements; must be a positive whole number or `Infinity`.
     * @example
     * set.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.source.resize(capacity);

        return this;
    }

    /**
     * Returns live elements ordered from least to most recently used.
     * @example
     * const keys: object[] = set.keys();
     * @returns A snapshot of live elements.
     */
    public keys(): E[] {
        return this.source.keys();
    }

    /**
     * Returns live elements ordered from least to most recently used; equivalent to {@link keys}.
     * @example
     * const values: object[] = set.values();
     * @returns A snapshot of live elements.
     */
    public values(): E[] {
        return this.source.keys();
    }

    /**
     * Returns live element pairs ordered from least to most recently used, mirroring `Set.entries`.
     * @example
     * const entries: Array<readonly [object, object]> = set.entries();
     * @returns A snapshot in which each pair holds the same element twice.
     */
    public entries(): Array<readonly [E, E]> {
        return this.source.keys().map((value: E): readonly [E, E] => [value, value] as const);
    }

    /**
     * Reads the live element at a recency position without changing recency.
     * @param position - Zero-based position; `0` is the least recently used live element.
     * @example
     * const value: object | void = set.at(0);
     * @returns The element, or (void 0) when the position is out of range.
     */
    public at(position: number): E | void {
        const entry: readonly [E, true] | void = this.source.at(position);

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Removes and returns the least recently used live element.
     * @example
     * const evicted: object | void = set.shift();
     * @returns The evicted element, or (void 0) when no live element remains.
     */
    public shift(): E | void {
        const entry: readonly [E, true] | void = this.source.shift();

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Visits every live element from least to most recently used without changing recency.
     * @param callback - Called with each element.
     * @example
     * set.forEach((value: object): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.values().forEach((value: E): void => callback(value));
    }

    /**
     * Iterates live elements from least to most recently used without changing recency.
     * @example
     * const values: object[] = [...set];
     * @returns An iterator over a snapshot of live elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }
}

/**
 * Weakly held least-recently-used set without an iteration-order guarantee.
 *
 * Elements must be objects so they can be held through `WeakRef`s; membership and values live in a
 * {@link WeakLeastRarelyUsageUnorderedMap} whose values are always `true`. Eviction, membership and value access behave
 * like {@link WeakLeastRarelyUsageOrderedSet}, but snapshots are returned newest first and callers must not rely on any
 * particular order. Collected elements are pruned rather than reported.
 * Type: class.
 * @param capacity - Maximum number of live elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const set: WeakLeastRarelyUsageUnorderedSet<object> = new WeakLeastRarelyUsageUnorderedSet<object>(2);
 * const element: object = {};
 * set.add(element);
 * const size: number = set.size();
 */
export class WeakLeastRarelyUsageUnorderedSet<E extends object> {
    private readonly source: WeakLeastRarelyUsageUnorderedMap<E, true>;

    /**
     * Creates an empty weakly held unordered set.
     * @param capacity - Maximum number of live elements; must be a positive whole number or `Infinity`.
     * @example
     * const set: WeakLeastRarelyUsageUnorderedSet<object> = new WeakLeastRarelyUsageUnorderedSet<object>(16);
     * @returns A new WeakLeastRarelyUsageUnorderedSet instance.
     */
    public constructor(capacity: number) {
        this.source = new WeakLeastRarelyUsageUnorderedMap<E, true>(capacity);
    }

    /**
     * Number of live elements after pruning collected weak references.
     * @example
     * const size: number = set.size();
     * @returns The current live element count.
     */
    public size(): number {
        return this.source.size();
    }

    /**
     * Maximum number of live elements the set may retain.
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
     * @returns True when no further live element can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.source.isFull();
    }

    /**
     * Checks whether an element is present without changing its recency.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.contains(element);
     * @returns True when the element is cached.
     */
    public contains(value: E): boolean {
        return this.source.contains(value);
    }

    /**
     * Checks whether an element is present and refreshes its recency without promising an iteration position.
     * @param value - Element to look up.
     * @example
     * const present: boolean = set.has(element);
     * @returns True when the element is cached.
     */
    public has(value: E): boolean {
        return this.source.has(value);
    }

    /**
     * Adds an element, or refreshes it when already present, then evicts the least recently used live element if the
     * capacity has been exceeded.
     * @param value - Element to cache.
     * @example
     * set.add(element);
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
     * const removed: boolean = set.delete(element);
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
     * Changes the capacity and evicts the least recently used live elements until the new bound is satisfied.
     * @param capacity - New maximum number of live elements; must be a positive whole number or `Infinity`.
     * @example
     * set.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.source.resize(capacity);

        return this;
    }

    /**
     * Returns live elements in the snapshot order; the order is unspecified.
     * @example
     * const keys: object[] = set.keys();
     * @returns A snapshot of live elements in an unspecified order.
     */
    public keys(): E[] {
        return this.source.keys();
    }

    /**
     * Returns live elements in the snapshot order; the order is unspecified.
     * @example
     * const values: object[] = set.values();
     * @returns A snapshot of live elements in an unspecified order.
     */
    public values(): E[] {
        return this.source.keys();
    }

    /**
     * Returns live element pairs in the snapshot order, mirroring `Set.entries`; the order is unspecified.
     * @example
     * const entries: Array<readonly [object, object]> = set.entries();
     * @returns A snapshot in which each pair holds the same element twice.
     */
    public entries(): Array<readonly [E, E]> {
        return this.source.keys().map((value: E): readonly [E, E] => [value, value] as const);
    }

    /**
     * Reads the live element at a snapshot position without changing recency; the order is unspecified.
     * @param position - Zero-based position in the snapshot order.
     * @example
     * const value: object | void = set.at(0);
     * @returns The element, or (void 0) when the position is out of range.
     */
    public at(position: number): E | void {
        const entry: readonly [E, true] | void = this.source.at(position);

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Removes and returns the least recently used live element.
     * @example
     * const evicted: object | void = set.shift();
     * @returns The evicted element, or (void 0) when no live element remains.
     */
    public shift(): E | void {
        const entry: readonly [E, true] | void = this.source.shift();

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Visits every live element in the snapshot order without changing recency; the order is unspecified.
     * @param callback - Called with each element.
     * @example
     * set.forEach((value: object): void => {
     *     collected.push(value);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (value: E) => void): void {
        this.values().forEach((value: E): void => callback(value));
    }

    /**
     * Iterates live elements in the snapshot order without changing recency; the order is unspecified.
     * @example
     * const values: object[] = [...set];
     * @returns An iterator over a snapshot of live elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }
}

export default WeakLeastRarelyUsageOrderedSet;
