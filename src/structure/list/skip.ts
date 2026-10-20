const ListSkipProbability: number = 0.5;
const ListSkipMaxLevel: number = 32;

/**
 * One node of the positional skip list.
 *
 * A node carries an element, one forward link per level and one width per level. `width[level]` is the distance, in
 * level-`0` positions, from this node to `next[level]`; the head tower stores the same widths separately. Type: class.
 * @param element - Element carried by the node.
 * @param level - Number of forward links; determines the node height.
 * @example
 * const node: ListSkipNode<string> = new ListSkipNode<string>("a", 2);
 */
class ListSkipNode<E> {
    public element: E;
    public readonly next: Array<ListSkipNode<E> | void>;
    public readonly width: number[];

    /**
     * Creates a node whose forward links and widths are all empty.
     * @param element - Element carried by the node.
     * @param level - Number of forward links; determines the node height.
     * @example
     * const node: ListSkipNode<string> = new ListSkipNode<string>("a", 2);
     * @returns A new ListSkipNode instance.
     */
    public constructor(element: E, level: number) {
        this.element = element;
        this.next = new Array<ListSkipNode<E> | void>(level).fill((void 0));
        this.width = new Array<number>(level).fill(0);
    }

    /**
     * Number of levels spanned by the node.
     * @example
     * const level: number = node.level;
     * @returns The forward-link count.
     */
    public get level(): number {
        return this.next.length;
    }
}

/**
 * Indexed list backed by a genuine positional skip list with per-level width counters.
 *
 * Unlike the key-ordered {@link SkipTree}, this structure preserves insertion order and exposes constant-expected-time
 * access by zero-based position. Each node stores the number of level-`0` steps to its forward link at every level, so
 * `get`, `set`, `addAt` and `removeAt` can descend the express lanes while tracking the current index. Duplicates are
 * allowed; `indexOf` and `delete` operate on the first matching element and `lastIndexOf` reports the last one.
 * Type: class.
 * @example
 * const list: SkipList<string> = new SkipList<string>();
 * list.add("a");
 * list.addAt(0, "b");
 * const first: string = list.get(0);
 */
export class SkipList<E> {
    private readonly headNext: Array<ListSkipNode<E> | void>;
    private readonly headWidth: number[];
    private levelValue: number;
    private countValue: number;

    /**
     * Creates an empty positional skip list with a head tower of `ListSkipMaxLevel` levels.
     * @example
     * const list: SkipList<string> = new SkipList<string>();
     * @returns A new SkipList instance.
     */
    public constructor() {
        this.headNext = new Array<ListSkipNode<E> | void>(ListSkipMaxLevel).fill((void 0));
        this.headWidth = new Array<number>(ListSkipMaxLevel).fill(0);
        this.levelValue = 1;
        this.countValue = 0;
    }

    /**
     * Number of elements.
     * @example
     * const size: number = list.size();
     * @returns The current element count.
     */
    public size(): number {
        return this.countValue;
    }

    /**
     * Checks whether the list holds no elements.
     * @example
     * const empty: boolean = list.isEmpty();
     * @returns True when the list is empty.
     */
    public isEmpty(): boolean {
        return this.countValue === 0;
    }

    /**
     * Reads the element at `index`; throws `RangeError` when the index is outside `[0, size())`.
     * @param index - Zero-based position.
     * @example
     * const first: string = list.get(0);
     * @returns The element stored at `index`.
     */
    public get(index: number): E {
        return this.requireNode(index).element;
    }

    /**
     * Reads the element at `index` without throwing.
     * @param index - Zero-based position.
     * @example
     * const first: string | void = list.at(0);
     * @returns The element, or (void 0) when the index is out of range.
     */
    public at(index: number): E | void {
        const node: ListSkipNode<E> | void = this.nodeAt(index);

        return node === (void 0) ? (void 0) : node.element;
    }

    /**
     * Replaces the element at `index`; throws `RangeError` when the index is outside `[0, size())`.
     * @param index - Zero-based position.
     * @param element - Replacement element.
     * @example
     * const previous: string = list.set(0, "b");
     * @returns The element that was replaced.
     */
    public set(index: number, element: E): E {
        const node: ListSkipNode<E> = this.requireNode(index);
        const previous: E = node.element;

        node.element = element;

        return previous;
    }

    /**
     * Appends `element`.
     * @param element - Element to append.
     * @example
     * const added: boolean = list.add("a");
     * @returns True, because a list accepts every element.
     */
    public add(element: E): boolean {
        this.addAt(this.countValue, element);

        return true;
    }

    /**
     * Inserts `element` at `index`, shifting later elements to the right; throws `RangeError` when the index is outside
     * `[0, size()]`.
     * @param index - Zero-based insertion position.
     * @param element - Element to insert.
     * @example
     * list.addAt(0, "a");
     * @returns Nothing.
     */
    public addAt(index: number, element: E): void {
        if (!Number.isInteger(index) || index < 0 || index > this.countValue) {
            throw new RangeError("Index out of range.");
        }

        const update: Array<ListSkipNode<E> | void> = this.createUpdate();
        const positions: number[] = this.createPositions();

        this.locateBefore(index, update, positions);

        const level: number = this.randomLevel();
        const node: ListSkipNode<E> = new ListSkipNode<E>(element, level);
        const previousLevel: number = this.levelValue;

        for (let currentLevel: number = 0; currentLevel < level; currentLevel += 1) {
            if (currentLevel >= previousLevel) {
                node.next[currentLevel] = (void 0);
                node.width[currentLevel] = 0;
                this.headNext[currentLevel] = node;
                this.headWidth[currentLevel] = index + 1;

                continue;
            }

            const predecessor: ListSkipNode<E> | void = update[currentLevel];
            const offset: number = positions[currentLevel];
            const step: number = index - offset;
            const next: ListSkipNode<E> | void =
                predecessor === (void 0) ? this.headNext[currentLevel] : predecessor.next[currentLevel];
            const oldWidth: number =
                predecessor === (void 0) ? this.headWidth[currentLevel] : predecessor.width[currentLevel];

            node.next[currentLevel] = next;
            node.width[currentLevel] = next === (void 0) ? 0 : oldWidth + 1 - step;

            if (predecessor === (void 0)) {
                this.headNext[currentLevel] = node;
                this.headWidth[currentLevel] = step;
            } else {
                predecessor.next[currentLevel] = node;
                predecessor.width[currentLevel] = step;
            }
        }

        for (let currentLevel: number = level; currentLevel < previousLevel; currentLevel += 1) {
            const predecessor: ListSkipNode<E> | void = update[currentLevel];
            const next: ListSkipNode<E> | void =
                predecessor === (void 0) ? this.headNext[currentLevel] : predecessor.next[currentLevel];

            if (next === (void 0)) {
                continue;
            }

            if (predecessor === (void 0)) {
                this.headWidth[currentLevel] += 1;
            } else {
                predecessor.width[currentLevel] += 1;
            }
        }

        if (level > this.levelValue) {
            this.levelValue = level;
        }

        this.countValue += 1;
    }

    /**
     * Removes and returns the element at `index`; throws `RangeError` when the index is outside `[0, size())`.
     * @param index - Zero-based position.
     * @example
     * const removed: string = list.removeAt(0);
     * @returns The removed element.
     */
    public removeAt(index: number): E {
        if (!Number.isInteger(index) || index < 0 || index >= this.countValue) {
            throw new RangeError("Index out of range.");
        }

        const update: Array<ListSkipNode<E> | void> = this.createUpdate();
        const positions: number[] = this.createPositions();

        this.locateBefore(index, update, positions);

        const predecessor: ListSkipNode<E> | void = update[0];
        const victim: ListSkipNode<E> | void =
            predecessor === (void 0) ? this.headNext[0] : predecessor.next[0];

        if (victim === (void 0)) {
            throw new RangeError("Index out of range.");
        }

        for (let currentLevel: number = 0; currentLevel < victim.level; currentLevel += 1) {
            const before: ListSkipNode<E> | void = update[currentLevel];
            const next: ListSkipNode<E> | void = victim.next[currentLevel];
            const oldWidth: number =
                before === (void 0) ? this.headWidth[currentLevel] : before.width[currentLevel];
            const width: number = next === (void 0) ? 0 : oldWidth + victim.width[currentLevel] - 1;

            if (before === (void 0)) {
                this.headNext[currentLevel] = next;
                this.headWidth[currentLevel] = width;
            } else {
                before.next[currentLevel] = next;
                before.width[currentLevel] = width;
            }
        }

        for (let currentLevel: number = victim.level; currentLevel < this.levelValue; currentLevel += 1) {
            const before: ListSkipNode<E> | void = update[currentLevel];
            const next: ListSkipNode<E> | void =
                before === (void 0) ? this.headNext[currentLevel] : before.next[currentLevel];

            if (next === (void 0)) {
                continue;
            }

            if (before === (void 0)) {
                this.headWidth[currentLevel] -= 1;
            } else {
                before.width[currentLevel] -= 1;
            }
        }

        while (this.levelValue > 1 && this.headNext[this.levelValue - 1] === (void 0)) {
            this.levelValue -= 1;
        }

        this.countValue -= 1;

        return victim.element;
    }

    /**
     * Removes the first element that is the same value as `element`.
     * @param element - Element to remove.
     * @example
     * const removed: boolean = list.delete("a");
     * @returns True when an element was removed.
     */
    public delete(element: E): boolean {
        const position: number = this.indexOf(element);

        if (position < 0) {
            return false;
        }

        this.removeAt(position);

        return true;
    }

    /**
     * Finds the first position holding an element that is the same value as `element`.
     * @param element - Element to search for.
     * @example
     * const found: number = list.indexOf("a");
     * @returns The zero-based position, or `-1` when the element is absent.
     */
    public indexOf(element: E): number {
        let current: ListSkipNode<E> | void = this.headNext[0];
        let position: number = 0;

        while (current !== (void 0)) {
            if (Object.is(current.element, element)) {
                return position;
            }

            current = current.next[0];
            position += 1;
        }

        return -1;
    }

    /**
     * Finds the last position holding an element that is the same value as `element`.
     * @param element - Element to search for.
     * @example
     * const found: number = list.lastIndexOf("a");
     * @returns The zero-based position, or `-1` when the element is absent.
     */
    public lastIndexOf(element: E): number {
        let current: ListSkipNode<E> | void = this.headNext[0];
        let position: number = 0;
        let found: number = -1;

        while (current !== (void 0)) {
            if (Object.is(current.element, element)) {
                found = position;
            }

            current = current.next[0];
            position += 1;
        }

        return found;
    }

    /**
     * Checks whether an element that is the same value as `element` is present.
     * @param element - Element to look up.
     * @example
     * const present: boolean = list.contains("a");
     * @returns True when the element is present.
     */
    public contains(element: E): boolean {
        return this.indexOf(element) >= 0;
    }

    /**
     * Removes every element and collapses the list to one level.
     * @example
     * list.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.headNext.fill((void 0));
        this.headWidth.fill(0);
        this.levelValue = 1;
        this.countValue = 0;
    }

    /**
     * Returns positional keys in list order.
     * @example
     * const keys: number[] = list.keys();
     * @returns A snapshot such as `[0, 1, 2]`.
     */
    public keys(): number[] {
        const result: number[] = [];

        for (let position: number = 0; position < this.countValue; position += 1) {
            result.push(position);
        }

        return result;
    }

    /**
     * Returns elements in list order.
     * @example
     * const values: string[] = list.values();
     * @returns A snapshot of elements.
     */
    public values(): E[] {
        const result: E[] = [];
        let current: ListSkipNode<E> | void = this.headNext[0];

        while (current !== (void 0)) {
            result.push(current.element);
            current = current.next[0];
        }

        return result;
    }

    /**
     * Returns positional key-element pairs in list order.
     * @example
     * const entries: Array<readonly [number, string]> = list.entries();
     * @returns A snapshot of positional entries.
     */
    public entries(): Array<readonly [number, E]> {
        const result: Array<readonly [number, E]> = [];
        let current: ListSkipNode<E> | void = this.headNext[0];
        let position: number = 0;

        while (current !== (void 0)) {
            result.push([position, current.element] as const);
            current = current.next[0];
            position += 1;
        }

        return result;
    }

    /**
     * Visits every element in list order.
     * @param callback - Called with the element and its position.
     * @example
     * list.forEach((element: string, position: number): void => {
     *     collected.push(`${position}:${element}`);
     * });
     * @returns Nothing.
     */
    public forEach(callback: (element: E, position: number) => void): void {
        let current: ListSkipNode<E> | void = this.headNext[0];
        let position: number = 0;

        while (current !== (void 0)) {
            callback(current.element, position);
            current = current.next[0];
            position += 1;
        }
    }

    /**
     * Iterates elements in list order.
     * @example
     * const values: string[] = [...list];
     * @returns An iterator over a snapshot of elements.
     */
    public [Symbol.iterator](): IterableIterator<E> {
        return this.values().values();
    }

    /**
     * Returns the node at `index`, or (void 0) when the index is out of range.
     * @param index - Zero-based position.
     * @example
     * const node: ListSkipNode<string> | void = this.nodeAt(0);
     * @returns The matching node, or (void 0) when absent.
     */
    private nodeAt(index: number): ListSkipNode<E> | void {
        if (!Number.isInteger(index) || index < 0 || index >= this.countValue) {
            return (void 0);
        }

        const update: Array<ListSkipNode<E> | void> = this.createUpdate();
        const positions: number[] = this.createPositions();

        this.locateBefore(index, update, positions);

        const predecessor: ListSkipNode<E> | void = update[0];

        return predecessor === (void 0) ? this.headNext[0] : predecessor.next[0];
    }

    /**
     * Returns the node at `index`; throws `RangeError` when the index is out of range.
     * @param index - Zero-based position.
     * @example
     * const node: ListSkipNode<string> = this.requireNode(0);
     * @returns The matching node.
     */
    private requireNode(index: number): ListSkipNode<E> {
        const node: ListSkipNode<E> | void = this.nodeAt(index);

        if (node === (void 0)) {
            throw new RangeError("Index out of range.");
        }

        return node;
    }

    /**
     * Descends to the last node whose position is strictly below `index`, recording the per-level predecessor and its
     * position in the output arrays.
     * @param index - Target position.
     * @param update - Per-level predecessor slots; (void 0) records the head tower.
     * @param positions - Per-level positions of the predecessors.
     * @example
     * this.locateBefore(2, update, positions);
     * @returns Nothing.
     */
    private locateBefore(
        index: number,
        update: Array<ListSkipNode<E> | void>,
        positions: number[],
    ): void {
        let current: ListSkipNode<E> | void = (void 0);
        let position: number = -1;

        for (let level: number = this.levelValue - 1; level >= 0; level -= 1) {
            let next: ListSkipNode<E> | void =
                current === (void 0) ? this.headNext[level] : current.next[level];
            let width: number = current === (void 0) ? this.headWidth[level] : current.width[level];

            while (next !== (void 0) && position + width < index) {
                position += width;
                current = next;
                next = current.next[level];
                width = current.width[level];
            }

            update[level] = current;
            positions[level] = position;
        }
    }

    /**
     * Creates an empty per-level predecessor array.
     * @example
     * const update: Array<ListSkipNode<string> | void> = this.createUpdate();
     * @returns The empty update array.
     */
    private createUpdate(): Array<ListSkipNode<E> | void> {
        return new Array<ListSkipNode<E> | void>(ListSkipMaxLevel).fill((void 0));
    }

    /**
     * Creates a per-level position array initialised to the head position.
     * @example
     * const positions: number[] = this.createPositions();
     * @returns The empty positions array.
     */
    private createPositions(): number[] {
        return new Array<number>(ListSkipMaxLevel).fill(-1);
    }

    /**
     * Draws a node height by repeated promotion.
     * @example
     * const level: number = this.randomLevel();
     * @returns A height in `[1, ListSkipMaxLevel]`.
     */
    private randomLevel(): number {
        let level: number = 1;

        while (level < ListSkipMaxLevel && Math.random() < ListSkipProbability) {
            level += 1;
        }

        return level;
    }
}

export default SkipList;
