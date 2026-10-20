import { SynchronizeCollectionSymbol } from "../collection";
import type { SynchronizeCollection } from "../collection";
import type { BiConsumer, Consumer, Predicate } from "../functional";
import { SynchronizeIterableSymbol } from "../iterable";
import { SynchronizeStream } from "../stream/stream";

/**
 * Last-in-first-out collection backed by a dynamic array.
 * Type: class.
 * @example
 * const stack: Stack<string> = new Stack<string>();
 * stack.push("a");
 * const top: string = stack.peek();
 */
export class Stack<E> implements SynchronizeCollection<E> {
    private readonly elements: Array<E>;

    /**
     * Creates an empty stack.
     * @example
     * const stack: Stack<string> = new Stack<string>();
     * @returns A new Stack.
     */
    public constructor() {
        this.elements = [];
    }

    /**
     * Pushes `element` onto the top of the stack.
     * @param element - Element to push.
     * @example
     * stack.push("a");
     * @returns Nothing.
     */
    public push(element: E): void {
        this.elements.push(element);
    }

    /**
     * Removes and returns the top element; throws `RangeError` when the stack is empty.
     * @example
     * const top: string = stack.pop();
     * @returns The former top element.
     */
    public pop(): E {
        if (this.elements.length === 0) {
            throw new RangeError("Stack is empty.");
        }

        return this.elements.pop() as E;
    }

    /**
     * Reads the top element without removing it; throws `RangeError` when the stack is empty.
     * @example
     * const top: string = stack.peek();
     * @returns The current top element.
     */
    public peek(): E {
        if (this.elements.length === 0) {
            throw new RangeError("Stack is empty.");
        }

        return this.elements[this.elements.length - 1];
    }

    /**
     * Pushes `element`; equivalent to {@link push}.
     * @param element - Element to add.
     * @example
     * const added: boolean = stack.add("a");
     * @returns True, because a stack accepts every element.
     */
    public add(element: E): boolean {
        this.push(element);

        return true;
    }

    /**
     * Pushes every element of `c` in iteration order.
     * @param c - Elements to push.
     * @example
     * const added: boolean = stack.addAll(["a", "b"]);
     * @returns True when at least one element was pushed.
     */
    public addAll(c: Iterable<E>): boolean {
        const additions: Array<E> = Array.from<E>(c);

        additions.forEach((element: E): void => {
            this.push(element);
        });

        return additions.length > 0;
    }

    /**
     * Removes every element.
     * @example
     * stack.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.elements.length = 0;
    }

    /**
     * Checks whether an element that is the same value as `e` is present.
     * @param e - Element to look up.
     * @example
     * const present: boolean = stack.contains("a");
     * @returns True when the element is present.
     */
    public contains(e: E): boolean {
        return this.elements.some((element: E): boolean => Object.is(element, e));
    }

    /**
     * Checks whether every element of `c` is present.
     * @param c - Elements to look up.
     * @example
     * const present: boolean = stack.containsAll(["a", "b"]);
     * @returns True when every element is present; true for an empty iterable.
     */
    public containsAll(c: Iterable<E>): boolean {
        const candidates: Array<E> = Array.from<E>(c);

        return candidates.every((element: E): boolean => this.contains(element));
    }

    /**
     * Visits each element from bottom to top.
     * @param action - Called with the element, or with the index and the element.
     * @example
     * const collected: string[] = [];
     * stack.forEach((element: string): void => {
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

        this.elements.forEach((element: E): void => {
            if (indexed) {
                (action as BiConsumer<bigint, E>)(index, element);
            } else {
                (action as Consumer<E>)(element);
            }

            index += 1n;
        });
    }

    /**
     * Checks whether the stack holds no elements.
     * @example
     * const empty: boolean = stack.isEmpty();
     * @returns True when the stack is empty.
     */
    public isEmpty(): boolean {
        return this.elements.length === 0;
    }

    /**
     * Removes the first element that is the same value as `e`, searching from bottom to top.
     * @param e - Element to remove.
     * @example
     * const removed: boolean = stack.remove("a");
     * @returns True when an element was removed.
     */
    public remove(e: E): boolean {
        const position: number = this.elements.findIndex((element: E): boolean => Object.is(element, e));

        if (position < 0) {
            return false;
        }

        this.elements.splice(position, 1);

        return true;
    }

    /**
     * Removes every element that is the same value as an element of `c`.
     * @param c - Elements to remove.
     * @example
     * const removed: boolean = stack.removeAll(["a", "b"]);
     * @returns True when at least one element was removed.
     */
    public removeAll(c: Iterable<E>): boolean {
        const removals: Array<E> = Array.from<E>(c);
        let changed: boolean = false;
        let position: number = 0;

        while (position < this.elements.length) {
            const element: E = this.elements[position];

            if (removals.some((removal: E): boolean => Object.is(removal, element))) {
                this.elements.splice(position, 1);
                changed = true;
            } else {
                position += 1;
            }
        }

        return changed;
    }

    /**
     * Removes every element accepted by `filter`.
     * @param filter - Predicate selecting the elements to remove.
     * @example
     * const removed: boolean = stack.removeIf((element: string): boolean => element.length === 0);
     * @returns True when at least one element was removed.
     */
    public removeIf(filter: Predicate<E>): boolean {
        let changed: boolean = false;
        let position: number = 0;

        while (position < this.elements.length) {
            if (filter(this.elements[position])) {
                this.elements.splice(position, 1);
                changed = true;
            } else {
                position += 1;
            }
        }

        return changed;
    }

    /**
     * Removes every element that is not the same value as an element of `c`.
     * @param c - Elements to keep.
     * @example
     * const removed: boolean = stack.retainAll(["a", "b"]);
     * @returns True when at least one element was removed.
     */
    public retainAll(c: Iterable<E>): boolean {
        const retained: Array<E> = Array.from<E>(c);
        const kept: Array<E> = this.elements.filter((element: E): boolean =>
            retained.some((candidate: E): boolean => Object.is(candidate, element)),
        );

        if (kept.length === this.elements.length) {
            return false;
        }

        this.elements.splice(0, this.elements.length, ...kept);

        return true;
    }

    /**
     * Number of elements currently stored.
     * @example
     * const size: bigint = stack.size();
     * @returns Number of elements as a bigint.
     */
    public size(): bigint {
        return BigInt(this.elements.length);
    }

    /**
     * Returns a stream over the elements from bottom to top.
     * @example
     * const stream: SynchronizeStream<string> = stack.stream();
     * @returns A new stream over the elements.
     */
    public stream(): SynchronizeStream<E> {
        return SynchronizeStream.iterate<E>(this);
    }

    /**
     * Returns a snapshot of the elements from bottom to top.
     * @example
     * const elements: string[] = stack.toArray();
     * @returns A new array of the elements.
     */
    public toArray(): E[] {
        return this.elements.slice();
    }

    /**
     * Iterates the elements from bottom to top.
     * @example
     * const iterator: Generator<string, void, unknown> = stack[SynchronizeCollectionSymbol]();
     * @returns A generator over the elements.
     */
    public *[SynchronizeCollectionSymbol](): Generator<E, void, unknown> {
        yield* this.elements;
    }

    /**
     * Iterates the elements from bottom to top.
     * @example
     * const iterator: Generator<string, void, unknown> = stack[SynchronizeIterableSymbol]();
     * @returns A generator over the elements.
     */
    public *[SynchronizeIterableSymbol](): Generator<E, void, unknown> {
        yield* this[SynchronizeCollectionSymbol]();
    }

    /**
     * Iterates the elements from bottom to top.
     * @example
     * const elements: string[] = [...stack];
     * @returns A generator over the elements.
     */
    public *[Symbol.iterator](): Generator<E, void, unknown> {
        yield* this[SynchronizeCollectionSymbol]();
    }
}

export default Stack;
