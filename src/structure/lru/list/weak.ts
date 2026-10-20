import { WeakLeastRarelyUsageOrderedMap } from "../map/weak";

/**
 * Weakly held capacity-bounded least-recently-used cache of values.
 *
 * The element is its own key and must be an object so it can be held through a `WeakRef`; storage and recency live in a
 * {@link WeakLeastRarelyUsageOrderedMap} that maps each element to itself. A successful `get` or `has` and every `set`
 * promote an element, while `contains` and `peek` do not. `size` prunes collected references and can shrink without an
 * explicit `delete`; snapshots enumerate only elements that are still reachable and run from least to most recently
 * used, so they never pretend to reveal a collected element.
 * Type: class.
 * @param capacity - Maximum number of live elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const cache: WeakLeastRarelyUsageList<object> = new WeakLeastRarelyUsageList<object>(2);
 * const element: object = {};
 * cache.set(element);
 * const found: object | void = cache.get(element);
 */
export class WeakLeastRarelyUsageList<E extends object> {
    private readonly source: WeakLeastRarelyUsageOrderedMap<E, E>;

    /**
     * Creates an empty weakly held cache.
     * @param capacity - Maximum number of live elements; must be a positive whole number or `Infinity`.
     * @example
     * const cache: WeakLeastRarelyUsageList<object> = new WeakLeastRarelyUsageList<object>(16);
     * @returns A new WeakLeastRarelyUsageList instance.
     */
    public constructor(capacity: number) {
        this.source = new WeakLeastRarelyUsageOrderedMap<E, E>(capacity);
    }

    /**
     * Number of live elements after pruning collected weak references.
     * @example
     * const size: number = cache.size();
     * @returns The current live element count.
     */
    public size(): number {
        return this.source.size();
    }

    /**
     * Maximum number of live elements the cache may retain.
     * @example
     * const capacity: number = cache.capacity();
     * @returns The configured capacity, or `Infinity` when unbounded.
     */
    public capacity(): number {
        return this.source.capacity();
    }

    /**
     * Checks whether the cache has reached its capacity.
     * @example
     * const full: boolean = cache.isFull();
     * @returns True when no further live element can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.source.isFull();
    }

    /**
     * Checks whether an element is present without changing its recency.
     * @param element - Element to look up.
     * @example
     * const present: boolean = cache.contains(target);
     * @returns True when the element is cached.
     */
    public contains(element: E): boolean {
        return this.source.contains(element);
    }

    /**
     * Reads an element without changing its recency.
     * @param element - Element to look up.
     * @example
     * const found: object | void = cache.peek(target);
     * @returns The cached element, or (void 0) when absent.
     */
    public peek(element: E): E | void {
        return this.source.peek(element);
    }

    /**
     * Checks whether an element is present and promotes it to the most-recent position.
     * @param element - Element to look up.
     * @example
     * const present: boolean = cache.has(target);
     * @returns True when the element is cached.
     */
    public has(element: E): boolean {
        return this.source.has(element);
    }

    /**
     * Reads an element and promotes it to the most-recent position.
     * @param element - Element to look up.
     * @example
     * const found: object | void = cache.get(target);
     * @returns The cached element, or (void 0) when absent.
     */
    public get(element: E): E | void {
        return this.source.get(element);
    }

    /**
     * Inserts an element, or promotes it when already present, then evicts the least recently used live element if the
     * capacity has been exceeded.
     * @param element - Element to cache.
     * @example
     * cache.set(target);
     * @returns This instance, for chaining.
     */
    public set(element: E): this {
        this.source.set(element, element);

        return this;
    }

    /**
     * Inserts an element; equivalent to {@link set}.
     * @param element - Element to cache.
     * @example
     * cache.add(target);
     * @returns This instance, for chaining.
     */
    public add(element: E): this {
        return this.set(element);
    }

    /**
     * Removes an element.
     * @param element - Element to remove.
     * @example
     * const removed: boolean = cache.delete(target);
     * @returns True when the element was cached.
     */
    public delete(element: E): boolean {
        return this.source.delete(element);
    }

    /**
     * Removes every element.
     * @example
     * cache.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.source.clear();
    }

    /**
     * Changes the capacity and evicts the least recently used live elements until the new bound is satisfied.
     * @param capacity - New maximum number of live elements; must be a positive whole number or `Infinity`.
     * @example
     * cache.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.source.resize(capacity);

        return this;
    }

    /**
     * Returns positional keys ordered from least to most recently used.
     * @example
     * const keys: number[] = cache.keys();
     * @returns A snapshot such as `[0, 1, 2]` over the live elements.
     */
    public keys(): number[] {
        const result: number[] = [];
        const values: E[] = this.values();

        for (let position: number = 0; position < values.length; position += 1) {
            result.push(position);
        }

        return result;
    }

    /**
     * Returns live elements ordered from least to most recently used.
     * @example
     * const values: object[] = cache.values();
     * @returns A snapshot of live elements.
     */
    public values(): E[] {
        return this.source.keys();
    }

    /**
     * Returns positional key-element pairs ordered from least to most recently used.
     * @example
     * const entries: Array<readonly [number, object]> = cache.entries();
     * @returns A snapshot of live positional entries.
     */
    public entries(): Array<readonly [number, E]> {
        return this.values().map((element: E, position: number): readonly [number, E] => [position, element] as const);
    }

    /**
     * Reads the live element at a recency position without changing recency.
     * @param position - Zero-based position; `0` is the least recently used live element.
     * @example
     * const element: object | void = cache.at(0);
     * @returns The element, or (void 0) when the position is out of range.
     */
    public at(position: number): E | void {
        const entry: readonly [E, E] | void = this.source.at(position);

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Removes and returns the least recently used live element.
     * @example
     * const evicted: object | void = cache.shift();
     * @returns The evicted element, or (void 0) when no live element remains.
     */
    public shift(): E | void {
        const entry: readonly [E, E] | void = this.source.shift();

        return entry === (void 0) ? (void 0) : entry[0];
    }

    /**
     * Visits every live element from least to most recently used without changing recency.
     * @param callback - Called with the element and its recency position.
     * @example
     * cache.forEach((element: object, position: number): void => {
     *     collected.push(`${position}:${element}`);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (element: E, position: number) => void): void {
        this.values().forEach((element: E, position: number): void => callback(element, position));
    }

    /**
     * Iterates live elements from least to most recently used without changing recency.
     * @example
     * const values: object[] = [...cache];
     * @returns An iterator over a snapshot of live elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }
}

export default WeakLeastRarelyUsageList;
