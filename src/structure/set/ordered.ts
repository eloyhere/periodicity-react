import { OrderedMap } from "../map/ordered";

/**
 * Insertion-ordered set backed by an ordered map.
 * Type: class.
 * @example
 * const set: OrderedSet<string> = new OrderedSet<string>();
 * set.add("a");
 */
export class OrderedSet<E> {
    private readonly source: OrderedMap<E, true>;

    /**
     * Creates an empty ordered set.
     * @example
     * const set: OrderedSet<string> = new OrderedSet<string>();
     * @returns A new OrderedSet.
     */
    constructor() {
        this.source = new OrderedMap<E, true>();
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
     * Adds `value`, keeping first-insertion order.
     * @param value - Element to add.
     * @example
     * set.add("a");
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
     * const removed: boolean = set.delete("a");
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
     * Returns elements in insertion order.
     * @example
     * const values: string[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.keys();
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
        this.source.keys().forEach((value: E): void => {
            callback(value);
        });
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
        return this.source.keys().values();
    }
}

export default OrderedSet;
