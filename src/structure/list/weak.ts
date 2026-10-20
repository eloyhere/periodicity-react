/**
 * Insertion-ordered list of weakly held objects.
 *
 * Membership is answered by a `WeakSet`, while order is kept by an array of `WeakRef`s, so the list never keeps a
 * collected element alive. `values`, `entries`, `at`, `indexOf`, `forEach`, `size` and iteration prune cleared
 * references first and therefore observe only elements that are still reachable; a returned snapshot temporarily
 * retains those elements for as long as the caller keeps it. Because elements are unique by identity, adding an element
 * that is already present is a no-op. Type: class.
 * @example
 * const list: WeakList<object> = new WeakList<object>();
 * const element: object = {};
 * list.add(element);
 * const present: boolean = list.has(element);
 */
export class WeakList<E extends object> {
    private members: WeakSet<E>;
    private references: Array<WeakRef<E>>;

    /**
     * Creates an empty weakly held list.
     * @example
     * const list: WeakList<object> = new WeakList<object>();
     * @returns A new WeakList instance.
     */
    public constructor() {
        this.members = new WeakSet<E>();
        this.references = [];
    }

    /**
     * Number of live elements after pruning collected weak references.
     * @example
     * const size: number = list.size();
     * @returns The current live element count.
     */
    public size(): number {
        this.prune();

        return this.references.length;
    }

    /**
     * Checks whether the list holds no live elements.
     * @example
     * const empty: boolean = list.isEmpty();
     * @returns True when no live element remains.
     */
    public isEmpty(): boolean {
        return this.size() === 0;
    }

    /**
     * Checks whether `element` is present.
     * @param element - Element to look up.
     * @example
     * const present: boolean = list.has(target);
     * @returns True when the element is held.
     */
    public has(element: E): boolean {
        return this.members.has(element);
    }

    /**
     * Appends `element` when it is not already present.
     * @param element - Element to append.
     * @example
     * list.add(target);
     * @returns This instance, for chaining.
     */
    public add(element: E): this {
        if (this.members.has(element)) {
            return this;
        }

        this.members.add(element);
        this.references.push(new WeakRef<E>(element));

        return this;
    }

    /**
     * Appends every element of `elements` in iteration order, skipping duplicates.
     * @param elements - Elements to append.
     * @example
     * list.addAll([first, second]);
     * @returns This instance, for chaining.
     */
    public addAll(elements: Iterable<E>): this {
        for (const element of elements) {
            this.add(element);
        }

        return this;
    }

    /**
     * Removes `element` and its weak reference.
     * @param element - Element to remove.
     * @example
     * const removed: boolean = list.delete(target);
     * @returns True when the element was held.
     */
    public delete(element: E): boolean {
        if (!this.members.has(element)) {
            return false;
        }

        this.members.delete(element);

        const position: number = this.references.findIndex(
            (reference: WeakRef<E>): boolean => reference.deref() === element,
        );

        if (position >= 0) {
            this.references.splice(position, 1);
        }

        return true;
    }

    /**
     * Removes every element. The old `WeakSet` is replaced because weak sets have no `clear` method.
     * @example
     * list.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.members = new WeakSet<E>();
        this.references = [];
    }

    /**
     * Returns positional keys for the live elements.
     * @example
     * const keys: number[] = list.keys();
     * @returns A snapshot such as `[0, 1, 2]`.
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
     * Returns the live elements in insertion order.
     * @example
     * const values: object[] = list.values();
     * @returns A snapshot of live elements.
     */
    public values(): E[] {
        this.prune();

        return this.references.map((reference: WeakRef<E>): E => reference.deref() as E);
    }

    /**
     * Returns positional key-element pairs for the live elements in insertion order.
     * @example
     * const entries: Array<readonly [number, object]> = list.entries();
     * @returns A snapshot of live positional entries.
     */
    public entries(): Array<readonly [number, E]> {
        return this.values().map((element: E, position: number): readonly [number, E] => [position, element] as const);
    }

    /**
     * Returns the live element at `position`.
     * @param position - Zero-based position in insertion order.
     * @example
     * const element: object | void = list.at(0);
     * @returns The element, or (void 0) when the position is out of range.
     */
    public at(position: number): E | void {
        const values: E[] = this.values();

        if (!Number.isInteger(position) || position < 0 || position >= values.length) {
            return (void 0);
        }

        return values[position];
    }

    /**
     * Finds the position of `element` among the live elements.
     * @param element - Element to search for.
     * @example
     * const position: number = list.indexOf(target);
     * @returns The zero-based position, or `-1` when absent.
     */
    public indexOf(element: E): number {
        return this.values().findIndex((candidate: E): boolean => Object.is(candidate, element));
    }

    /**
     * Visits every live element in insertion order.
     * @param callback - Called with the element and its position.
     * @example
     * list.forEach((element: object, position: number): void => {
     *     collected.push(`${position}:${element}`);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (element: E, position: number) => void): void {
        this.values().forEach((element: E, position: number): void => {
            callback(element, position);
        });
    }

    /**
     * Iterates the live elements in insertion order.
     * @example
     * const values: object[] = [...list];
     * @returns An iterator over a snapshot of live elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }

    /**
     * Drops references whose target has been collected.
     * @example
     * this.prune();
     * @returns Nothing.
     */
    private prune(): void {
        this.references = this.references.filter(
            (reference: WeakRef<E>): boolean => reference.deref() !== (void 0),
        );
    }
}

export default WeakList;
