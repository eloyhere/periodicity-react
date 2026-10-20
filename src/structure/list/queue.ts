import { SynchronizeCollectionSymbol } from "../collection";
import type { SynchronizeCollection } from "../collection";
import type { BiConsumer, Consumer, Predicate } from "../functional";
import { SynchronizeIterableSymbol } from "../iterable";
import { SynchronizeStream } from "../stream/stream";

const MinimumCompactionHead: number = 32;

/**
 * First-in-first-out collection backed by a dynamic array and a head index.
 * Type: class.
 * @example
 * const queue: Queue<string> = new Queue<string>();
 * queue.enqueue("a");
 * const front: string = queue.peek();
 */
export class Queue<E> implements SynchronizeCollection<E> {
    private elements: Array<E>;
    private head: number;

    /**
     * Creates an empty queue.
     * @example
     * const queue: Queue<string> = new Queue<string>();
     * @returns A new Queue.
     */
    public constructor() {
        this.elements = [];
        this.head = 0;
    }

    /**
     * Appends `element` at the back of the queue.
     * @param element - Element to enqueue.
     * @example
     * queue.enqueue("a");
     * @returns Nothing.
     */
    public enqueue(element: E): void {
        this.elements.push(element);
    }

    /**
     * Removes and returns the front element; throws `RangeError` when the queue is empty.
     * @example
     * const front: string = queue.dequeue();
     * @returns The former front element.
     */
    public dequeue(): E {
        if (this.isEmpty()) {
            throw new RangeError("Queue is empty.");
        }

        const element: E = this.elements[this.head];

        this.head += 1;
        this.compact();

        return element;
    }

    /**
     * Reads the front element without removing it; throws `RangeError` when the queue is empty.
     * @example
     * const front: string = queue.peek();
     * @returns The current front element.
     */
    public peek(): E {
        if (this.isEmpty()) {
            throw new RangeError("Queue is empty.");
        }

        return this.elements[this.head];
    }

    /**
     * Appends `element`; equivalent to {@link enqueue}.
     * @param element - Element to add.
     * @example
     * const added: boolean = queue.add("a");
     * @returns True, because a queue accepts every element.
     */
    public add(element: E): boolean {
        this.enqueue(element);

        return true;
    }

    /**
     * Appends every element of `c` in iteration order.
     * @param c - Elements to enqueue.
     * @example
     * const added: boolean = queue.addAll(["a", "b"]);
     * @returns True when at least one element was appended.
     */
    public addAll(c: Iterable<E>): boolean {
        const additions: Array<E> = Array.from<E>(c);

        additions.forEach((element: E): void => {
            this.enqueue(element);
        });

        return additions.length > 0;
    }

    /**
     * Removes every element.
     * @example
     * queue.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.elements.length = 0;
        this.head = 0;
    }

    /**
     * Checks whether an element that is the same value as `e` is present.
     * @param e - Element to look up.
     * @example
     * const present: boolean = queue.contains("a");
     * @returns True when the element is present.
     */
    public contains(e: E): boolean {
        for (let position: number = this.head; position < this.elements.length; position += 1) {
            if (Object.is(this.elements[position], e)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks whether every element of `c` is present.
     * @param c - Elements to look up.
     * @example
     * const present: boolean = queue.containsAll(["a", "b"]);
     * @returns True when every element is present; true for an empty iterable.
     */
    public containsAll(c: Iterable<E>): boolean {
        const candidates: Array<E> = Array.from<E>(c);

        return candidates.every((element: E): boolean => this.contains(element));
    }

    /**
     * Visits each element from front to back.
     * @param action - Called with the element, or with the index and the element.
     * @example
     * const collected: string[] = [];
     * queue.forEach((element: string): void => {
     *     collected.push(element);
     * });
     * @returns Nothing.
     */
    public forEach(action: Consumer<E>): void;
    public forEach(action: BiConsumer<bigint, E>): void;
    public forEach(action: Consumer<E> | BiConsumer<bigint, E>): void {
        const arity: number = (action as Consumer<E> & { length: number }).length;
        const indexed: boolean = arity >= 2;
        let index: bigint = 0n;

        for (let position: number = this.head; position < this.elements.length; position += 1) {
            const element: E = this.elements[position];

            if (indexed) {
                (action as BiConsumer<bigint, E>)(index, element);
            } else {
                (action as Consumer<E>)(element);
            }

            index += 1n;
        }
    }

    /**
     * Checks whether the queue holds no elements.
     * @example
     * const empty: boolean = queue.isEmpty();
     * @returns True when the queue is empty.
     */
    public isEmpty(): boolean {
        return this.head >= this.elements.length;
    }

    /**
     * Removes the first element that is the same value as `e`, searching from front to back.
     * @param e - Element to remove.
     * @example
     * const removed: boolean = queue.remove("a");
     * @returns True when an element was removed.
     */
    public remove(e: E): boolean {
        for (let position: number = this.head; position < this.elements.length; position += 1) {
            if (Object.is(this.elements[position], e)) {
                this.elements.splice(position, 1);
                this.compact();

                return true;
            }
        }

        return false;
    }

    /**
     * Removes every element that is the same value as an element of `c`.
     * @param c - Elements to remove.
     * @example
     * const removed: boolean = queue.removeAll(["a", "b"]);
     * @returns True when at least one element was removed.
     */
    public removeAll(c: Iterable<E>): boolean {
        const removals: Array<E> = Array.from<E>(c);
        let changed: boolean = false;
        let position: number = this.head;

        while (position < this.elements.length) {
            const element: E = this.elements[position];

            if (removals.some((removal: E): boolean => Object.is(removal, element))) {
                this.elements.splice(position, 1);
                changed = true;
            } else {
                position += 1;
            }
        }

        this.compact();

        return changed;
    }

    /**
     * Removes every element accepted by `filter`.
     * @param filter - Predicate selecting the elements to remove.
     * @example
     * const removed: boolean = queue.removeIf((element: string): boolean => element.length === 0);
     * @returns True when at least one element was removed.
     */
    public removeIf(filter: Predicate<E>): boolean {
        let changed: boolean = false;
        let position: number = this.head;

        while (position < this.elements.length) {
            if (filter(this.elements[position])) {
                this.elements.splice(position, 1);
                changed = true;
            } else {
                position += 1;
            }
        }

        this.compact();

        return changed;
    }

    /**
     * Removes every element that is not the same value as an element of `c`.
     * @param c - Elements to keep.
     * @example
     * const removed: boolean = queue.retainAll(["a", "b"]);
     * @returns True when at least one element was removed.
     */
    public retainAll(c: Iterable<E>): boolean {
        const retained: Array<E> = Array.from<E>(c);
        const kept: Array<E> = this.elements
            .slice(this.head)
            .filter((element: E): boolean => retained.some((candidate: E): boolean => Object.is(candidate, element)));

        if (kept.length === this.elements.length - this.head) {
            return false;
        }

        this.elements = kept;
        this.head = 0;

        return true;
    }

    /**
     * Number of elements currently stored.
     * @example
     * const size: bigint = queue.size();
     * @returns Number of elements as a bigint.
     */
    public size(): bigint {
        return BigInt(this.elements.length - this.head);
    }

    /**
     * Returns a stream over the elements from front to back.
     * @example
     * const stream: SynchronizeStream<string> = queue.stream();
     * @returns A new stream over the elements.
     */
    public stream(): SynchronizeStream<E> {
        return SynchronizeStream.iterate<E>(this);
    }

    /**
     * Returns a snapshot of the elements from front to back.
     * @example
     * const elements: string[] = queue.toArray();
     * @returns A new array of the elements.
     */
    public toArray(): E[] {
        return this.elements.slice(this.head);
    }

    /**
     * Iterates the elements from front to back.
     * @example
     * const iterator: Generator<string, void, unknown> = queue[SynchronizeCollectionSymbol]();
     * @returns A generator over the elements.
     */
    public *[SynchronizeCollectionSymbol](): Generator<E, void, unknown> {
        for (let position: number = this.head; position < this.elements.length; position += 1) {
            yield this.elements[position];
        }
    }

    /**
     * Iterates the elements from front to back.
     * @example
     * const iterator: Generator<string, void, unknown> = queue[SynchronizeIterableSymbol]();
     * @returns A generator over the elements.
     */
    public *[SynchronizeIterableSymbol](): Generator<E, void, unknown> {
        yield* this[SynchronizeCollectionSymbol]();
    }

    /**
     * Iterates the elements from front to back.
     * @example
     * const elements: string[] = [...queue];
     * @returns A generator over the elements.
     */
    public *[Symbol.iterator](): Generator<E, void, unknown> {
        yield* this[SynchronizeCollectionSymbol]();
    }

    /**
     * Drops consumed slots once the head index grows large enough to matter.
     * @example
     * this.compact();
     * @returns Nothing.
     */
    private compact(): void {
        const consumed: number = this.head;

        if (consumed >= MinimumCompactionHead && consumed * 2 >= this.elements.length) {
            this.elements = this.elements.slice(consumed);
            this.head = 0;
        }
    }
}

export default Queue;
