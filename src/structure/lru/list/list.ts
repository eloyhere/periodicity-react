import { normaliseCapacity } from "../internal";

/**
 * Capacity-bounded least-recently-used cache of values.
 *
 * The element itself is the key, so membership and lookup use `Object.is` semantics. Recency is tracked by the order
 * of the backing array: index `0` is the least recently used element (the next eviction victim) and the final index is
 * the most recently used element. `get`, `has` and `set` promote an existing element to the most-recent position;
 * `contains` and `peek` inspect without changing recency; `keys`, `values`, `entries` and iteration return snapshots
 * ordered from least to most recently used.
 * Type: class.
 * @param capacity - Maximum number of elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const cache: LeastRarelyUsageList<string> = new LeastRarelyUsageList<string>(2);
 * cache.set("a");
 * cache.set("b");
 * cache.get("a");
 * cache.set("c");
 * const values: string[] = cache.values();
 */
export class LeastRarelyUsageList<E> {
    private readonly elements: Array<E>;
    private capacityValue: number;

    /**
     * Creates an empty cache.
     * @param capacity - Maximum number of elements; must be a positive whole number or `Infinity`.
     * @example
     * const cache: LeastRarelyUsageList<string> = new LeastRarelyUsageList<string>(16);
     * @returns A new LeastRarelyUsageList instance.
     */
    public constructor(capacity: number) {
        this.elements = [];
        this.capacityValue = normaliseCapacity(capacity);
    }

    /**
     * Number of cached elements.
     * @example
     * const size: number = cache.size();
     * @returns The current element count.
     */
    public size(): number {
        return this.elements.length;
    }

    /**
     * Maximum number of elements the cache may retain.
     * @example
     * const capacity: number = cache.capacity();
     * @returns The configured capacity, or `Infinity` when unbounded.
     */
    public capacity(): number {
        return this.capacityValue;
    }

    /**
     * Checks whether the cache has reached its capacity.
     * @example
     * const full: boolean = cache.isFull();
     * @returns True when no further element can be inserted without eviction.
     */
    public isFull(): boolean {
        return this.elements.length >= this.capacityValue;
    }

    /**
     * Checks whether an element is present without changing its recency.
     * @param element - Element to look up.
     * @example
     * const present: boolean = cache.contains("a");
     * @returns True when an element equal to `element` is cached.
     */
    public contains(element: E): boolean {
        return this.positionOf(element) >= 0;
    }

    /**
     * Reads an element without changing its recency.
     * @param element - Element to look up.
     * @example
     * const found: string | void = cache.peek("a");
     * @returns The cached element, or (void 0) when absent.
     */
    public peek(element: E): E | void {
        const position: number = this.positionOf(element);

        return position < 0 ? (void 0) : this.elements[position];
    }

    /**
     * Checks whether an element is present and promotes it to the most-recent position.
     * @param element - Element to look up.
     * @example
     * const present: boolean = cache.has("a");
     * @returns True when an element equal to `element` is cached.
     */
    public has(element: E): boolean {
        const position: number = this.positionOf(element);

        if (position < 0) {
            return false;
        }

        this.promote(position);

        return true;
    }

    /**
     * Reads an element and promotes it to the most-recent position.
     * @param element - Element to look up.
     * @example
     * const found: string | void = cache.get("a");
     * @returns The cached element, or (void 0) when absent.
     */
    public get(element: E): E | void {
        const position: number = this.positionOf(element);

        if (position < 0) {
            return (void 0);
        }

        this.promote(position);

        return element;
    }

    /**
     * Inserts an element, or promotes it when already present, then evicts the least recently used element if the
     * capacity has been exceeded.
     * @param element - Element to cache.
     * @example
     * cache.set("a");
     * @returns This instance, for chaining.
     */
    public set(element: E): this {
        const position: number = this.positionOf(element);

        if (position >= 0) {
            this.promote(position);

            return this;
        }

        this.elements.push(element);
        this.trim();

        return this;
    }

    /**
     * Inserts an element; equivalent to {@link set}.
     * @param element - Element to cache.
     * @example
     * cache.add("a");
     * @returns This instance, for chaining.
     */
    public add(element: E): this {
        return this.set(element);
    }

    /**
     * Removes an element.
     * @param element - Element to remove.
     * @example
     * const removed: boolean = cache.delete("a");
     * @returns True when an element equal to `element` was cached.
     */
    public delete(element: E): boolean {
        const position: number = this.positionOf(element);

        if (position < 0) {
            return false;
        }

        this.elements.splice(position, 1);

        return true;
    }

    /**
     * Removes every element.
     * @example
     * cache.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.elements.length = 0;
    }

    /**
     * Changes the capacity and evicts the least recently used elements until the new bound is satisfied.
     * @param capacity - New maximum number of elements; must be a positive whole number or `Infinity`.
     * @example
     * cache.resize(8);
     * @returns This instance, for chaining.
     */
    public resize(capacity: number): this {
        this.capacityValue = normaliseCapacity(capacity);
        this.trim();

        return this;
    }

    /**
     * Returns positional keys ordered from least to most recently used.
     * @example
     * const keys: number[] = cache.keys();
     * @returns A snapshot such as `[0, 1, 2]`.
     */
    public keys(): number[] {
        const result: number[] = [];

        for (let position: number = 0; position < this.elements.length; position += 1) {
            result.push(position);
        }

        return result;
    }

    /**
     * Returns elements ordered from least to most recently used.
     * @example
     * const values: string[] = cache.values();
     * @returns A snapshot of the cached elements.
     */
    public values(): E[] {
        return this.elements.slice();
    }

    /**
     * Returns positional key-element pairs ordered from least to most recently used.
     * @example
     * const entries: Array<readonly [number, string]> = cache.entries();
     * @returns A snapshot of the positional entries.
     */
    public entries(): Array<readonly [number, E]> {
        const result: Array<readonly [number, E]> = [];

        for (let position: number = 0; position < this.elements.length; position += 1) {
            result.push([position, this.elements[position]] as const);
        }

        return result;
    }

    /**
     * Reads the element at a recency position without changing recency.
     * @param position - Zero-based position; `0` is the least recently used element.
     * @example
     * const element: string | void = cache.at(0);
     * @returns The element, or (void 0) when the position is out of range.
     */
    public at(position: number): E | void {
        if (!Number.isInteger(position) || position < 0 || position >= this.elements.length) {
            return (void 0);
        }

        return this.elements[position];
    }

    /**
     * Removes and returns the least recently used element.
     * @example
     * const evicted: string | void = cache.shift();
     * @returns The evicted element, or (void 0) when the cache is empty.
     */
    public shift(): E | void {
        if (this.elements.length === 0) {
            return (void 0);
        }

        return this.elements.shift() as E;
    }

    /**
     * Visits every element from least to most recently used without changing recency.
     * @param callback - Called with the element and its recency position.
     * @example
     * cache.forEach((element: string, position: number): void => {
     *     collected.push(`${position}:${element}`);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (element: E, position: number) => void): void {
        this.elements.forEach((element: E, position: number): void => {
            callback(element, position);
        });
    }

    /**
     * Iterates elements from least to most recently used without changing recency.
     * @example
     * const values: string[] = [...cache];
     * @returns An iterator over a snapshot of the elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }

    /**
     * Finds the position of an element using `Object.is` equality.
     * @param element - Element to look up.
     * @example
     * const position: number = this.positionOf("a");
     * @returns The zero-based position, or `-1` when absent.
     */
    private positionOf(element: E): number {
        return this.elements.findIndex((candidate: E): boolean => Object.is(candidate, element));
    }

    /**
     * Moves the element at `position` to the most-recent end of the array.
     * @param position - Zero-based position of the element to promote.
     * @example
     * this.promote(0);
     * @returns Nothing.
     */
    private promote(position: number): void {
        const element: E = this.elements.splice(position, 1)[0];

        this.elements.push(element);
    }

    /**
     * Evicts least recently used elements until the configured capacity is satisfied.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        while (this.elements.length > this.capacityValue) {
            this.elements.shift();
        }
    }
}

export default LeastRarelyUsageList;
