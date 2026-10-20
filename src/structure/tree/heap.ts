import { compare } from "../compare";
import type { Comparator } from "../compare";

/**
 * Array-backed binary heap used as a priority queue.
 * Type: class.
 * @param comparator - Ordering function; defaults to `compare`, which gives a minimum heap.
 * @example
 * const heap: Heap<number> = new Heap<number>();
 * heap.push(2);
 */
export class Heap<T> {
    private readonly comparator: Comparator<T>;
    private items: T[];

    /**
     * Creates an empty heap.
     * @param comparator - Ordering function; defaults to `compare`, which gives a minimum heap.
     * @example
     * const heap: Heap<number> = new Heap<number>();
     * @returns A new Heap instance.
     */
    constructor(comparator?: Comparator<T>) {
        this.comparator = comparator ?? compare;
        this.items = [];
    }

    /**
     * Number of stored values.
     * @example
     * const size: number = heap.size;
     * @returns Number of stored values.
     */
    public get size(): number {
        return this.items.length;
    }

    /**
     * Checks whether the heap holds no values.
     * @example
     * const empty: boolean = heap.isEmpty();
     * @returns True when the heap is empty.
     */
    public isEmpty(): boolean {
        return this.items.length === 0;
    }

    /**
     * Reads the highest-priority value without removing it.
     * @example
     * const top: number | void = heap.peek();
     * @returns The current top value, or (void 0) when the heap is empty.
     */
    public peek(): T | void {
        return this.items.length === 0 ? (void 0) : this.items[0];
    }

    /**
     * Inserts `value` and restores the heap property.
     * @param value - Value to insert.
     * @example
     * heap.push(3);
     * @returns This heap, for chaining.
     */
    public push(value: T): this {
        this.items.push(value);
        this.siftUp(this.items.length - 1);

        return this;
    }

    /**
     * Removes and returns the highest-priority value.
     * @example
     * const top: number | void = heap.pop();
     * @returns The removed top value, or (void 0) when the heap is empty.
     */
    public pop(): T | void {
        if (this.items.length === 0) {
            return (void 0);
        }

        const top: T = this.items[0];
        const last: T = this.items[this.items.length - 1];
        this.items.length -= 1;

        if (this.items.length > 0) {
            this.items[0] = last;
            this.siftDown(0);
        }

        return top;
    }

    /**
     * Removes the top value and inserts `value` in its place.
     * @param value - Value to insert.
     * @example
     * const previous: number | void = heap.replace(4);
     * @returns The previous top value, or (void 0) when the heap was empty.
     */
    public replace(value: T): T | void {
        if (this.items.length === 0) {
            this.items.push(value);

            return (void 0);
        }

        const top: T = this.items[0];
        this.items[0] = value;
        this.siftDown(0);

        return top;
    }

    /**
     * Removes every value.
     * @example
     * heap.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.items = [];
    }

    /**
     * Returns a copy of the internal array.
     * @example
     * const values: number[] = heap.values();
     * @returns A copy in heap order, which is not globally sorted.
     */
    public values(): T[] {
        return this.items.slice();
    }

    /**
     * Iterates values in the internal array order.
     * @example
     * for (const value of heap) {
     *     const current: number = value;
     * }
     * @returns An iterator in heap order, which is not globally sorted.
     */
    public *[Symbol.iterator](): IterableIterator<T> {
        yield* this.items;
    }

    /**
     * Moves the value at `start` upwards until its parent takes priority.
     * @param start - Index of the value to move.
     * @example
     * this.siftUp(this.items.length - 1);
     * @returns Nothing.
     */
    private siftUp(start: number): void {
        let index: number = start;

        while (index > 0) {
            const parent: number = Math.floor((index - 1) / 2);

            if (this.comparator(this.items[index], this.items[parent]) >= 0) {
                return;
            }

            this.swap(index, parent);
            index = parent;
        }
    }

    /**
     * Moves the value at `start` downwards until its children take lower priority.
     * @param start - Index of the value to move.
     * @example
     * this.siftDown(0);
     * @returns Nothing.
     */
    private siftDown(start: number): void {
        let index: number = start;
        const length: number = this.items.length;

        while (true) {
            const left: number = index * 2 + 1;
            const right: number = left + 1;
            let best: number = index;

            if (left < length && this.comparator(this.items[left], this.items[best]) < 0) {
                best = left;
            }

            if (right < length && this.comparator(this.items[right], this.items[best]) < 0) {
                best = right;
            }

            if (best === index) {
                return;
            }

            this.swap(index, best);
            index = best;
        }
    }

    /**
     * Exchanges the values at two indices.
     * @param first - First index.
     * @param second - Second index.
     * @example
     * this.swap(0, 1);
     * @returns Nothing.
     */
    private swap(first: number, second: number): void {
        const temporary: T = this.items[first];
        this.items[first] = this.items[second];
        this.items[second] = temporary;
    }
}

export default Heap;
