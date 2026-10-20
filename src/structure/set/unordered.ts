import { UnorderedMap } from "../map/unordered";

/**
 * Set without an iteration-order guarantee, backed by an unordered map.
 * Type: class.
 * @example
 * const set: UnorderedSet<string> = new UnorderedSet<string>();
 * set.add("a");
 */
export class UnorderedSet<E> {
    private readonly source: UnorderedMap<E, true>;

    /**
     * Creates an empty unordered set.
     * @example
     * const set: UnorderedSet<string> = new UnorderedSet<string>();
     * @returns A new UnorderedSet.
     */
    constructor() {
        this.source = new UnorderedMap<E, true>();
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
     * Adds `value`; iteration order is not guaranteed.
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
     * Returns elements; order is unspecified.
     * @example
     * const values: string[] = set.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        return this.source.keys();
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
        this.source.keys().forEach((value: E): void => {
            callback(value);
        });
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
        return this.source.keys().values();
    }
}

export default UnorderedSet;
