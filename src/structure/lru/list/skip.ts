import { normaliseCapacity } from "../internal";

const SkipListProbability: number = 0.5;
const SkipListMaxLevel: number = 32;

/**
 * One node of the least-recently-used skip list.
 *
 * A node carries its cached element, the usage sequence that orders it and one forward link per level. Level `0`
 * threads every node in usage order, while higher levels provide the express lanes used by insertion and removal.
 * Type: class.
 * @param element - Cached element.
 * @param sequence - Usage sequence of the element.
 * @param level - Number of forward links; determines the node height.
 * @example
 * const node: LeastRarelyUsageSkipNode<string> = new LeastRarelyUsageSkipNode<string>("a", 1n, 2);
 */
class LeastRarelyUsageSkipNode<E> {
    public readonly element: E;
    public sequence: bigint;
    public readonly next: Array<LeastRarelyUsageSkipNode<E> | void>;

    /**
     * Creates a node whose forward links are all empty.
     * @param element - Cached element.
     * @param sequence - Usage sequence of the element.
     * @param level - Number of forward links; determines the node height.
     * @example
     * const node: LeastRarelyUsageSkipNode<string> = new LeastRarelyUsageSkipNode<string>("a", 1n, 2);
     * @returns A new LeastRarelyUsageSkipNode instance.
     */
    public constructor(element: E, sequence: bigint, level: number) {
        this.element = element;
        this.sequence = sequence;
        this.next = new Array<LeastRarelyUsageSkipNode<E> | void>(level).fill((void 0));
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
 * Capacity-bounded least-recently-used cache backed by a genuine skip list.
 *
 * Each cached element owns a node whose forward-link array forms the probabilistic levels of a skip list. Level `0`
 * keeps every node ordered by usage sequence, so the head node is always the next eviction victim and ascending
 * iteration is least to most recently used. A side `Map` provides expected constant-time element lookup; because that
 * map is a `Map`, membership follows SameValueZero equality, so `NaN` matches itself and `0`/`-0` are the same
 * element. `get`, `has` and `set` refresh the usage sequence (and therefore the node position); `contains`, `peek`,
 * snapshots and iteration leave recency untouched.
 * Type: class.
 * @param capacity - Maximum number of elements; positive whole numbers are floored and `Infinity` means unbounded.
 * @example
 * const cache: LeastRarelyUsageSkipList<string> = new LeastRarelyUsageSkipList<string>(2);
 * cache.set("a");
 * cache.set("b");
 * cache.get("a");
 * cache.set("c");
 * const values: string[] = cache.values();
 */
export class LeastRarelyUsageSkipList<E> {
    private readonly head: Array<LeastRarelyUsageSkipNode<E> | void>;
    private readonly index: Map<E, LeastRarelyUsageSkipNode<E>>;
    private levelValue: number;
    private sequenceValue: bigint;
    private countValue: number;
    private capacityValue: number;

    /**
     * Creates an empty skip-list cache with a head tower of `SkipListMaxLevel` forward links.
     * @param capacity - Maximum number of elements; must be a positive whole number or `Infinity`.
     * @example
     * const cache: LeastRarelyUsageSkipList<string> = new LeastRarelyUsageSkipList<string>(16);
     * @returns A new LeastRarelyUsageSkipList instance.
     */
    public constructor(capacity: number) {
        this.head = new Array<LeastRarelyUsageSkipNode<E> | void>(SkipListMaxLevel).fill((void 0));
        this.index = new Map<E, LeastRarelyUsageSkipNode<E>>();
        this.levelValue = 1;
        this.sequenceValue = 0n;
        this.countValue = 0;
        this.capacityValue = normaliseCapacity(capacity);
    }

    /**
     * Number of cached elements.
     * @example
     * const size: number = cache.size();
     * @returns The current element count.
     */
    public size(): number {
        return this.countValue;
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
        return this.countValue >= this.capacityValue;
    }

    /**
     * Checks whether an element is present without changing its recency.
     * @param element - Element to look up.
     * @example
     * const present: boolean = cache.contains("a");
     * @returns True when the element is cached.
     */
    public contains(element: E): boolean {
        return this.index.has(element);
    }

    /**
     * Reads an element without changing its recency.
     * @param element - Element to look up.
     * @example
     * const found: string | void = cache.peek("a");
     * @returns The cached element, or (void 0) when absent.
     */
    public peek(element: E): E | void {
        const node: LeastRarelyUsageSkipNode<E> | void = this.index.get(element);

        return node === (void 0) ? (void 0) : node.element;
    }

    /**
     * Checks whether an element is present and promotes it to the most-recent position.
     * @param element - Element to look up.
     * @example
     * const present: boolean = cache.has("a");
     * @returns True when the element is cached.
     */
    public has(element: E): boolean {
        const node: LeastRarelyUsageSkipNode<E> | void = this.index.get(element);

        if (node === (void 0)) {
            return false;
        }

        this.refresh(node);

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
        const node: LeastRarelyUsageSkipNode<E> | void = this.index.get(element);

        if (node === (void 0)) {
            return (void 0);
        }

        this.refresh(node);

        return node.element;
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
        const existing: LeastRarelyUsageSkipNode<E> | void = this.index.get(element);

        if (existing !== (void 0)) {
            this.refresh(existing);

            return this;
        }

        const node: LeastRarelyUsageSkipNode<E> = new LeastRarelyUsageSkipNode<E>(
            element,
            this.tick(),
            this.randomLevel(),
        );

        this.index.set(element, node);
        this.link(node);
        this.countValue += 1;
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
     * Removes an element and unlinks every level its node occupied.
     * @param element - Element to remove.
     * @example
     * const removed: boolean = cache.delete("a");
     * @returns True when the element was cached.
     */
    public delete(element: E): boolean {
        const node: LeastRarelyUsageSkipNode<E> | void = this.index.get(element);

        if (node === (void 0)) {
            return false;
        }

        this.unlink(node);
        this.index.delete(element);
        this.countValue -= 1;

        return true;
    }

    /**
     * Removes every element and collapses the skip list to a single level.
     * @example
     * cache.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.head.fill((void 0));
        this.index.clear();
        this.levelValue = 1;
        this.sequenceValue = 0n;
        this.countValue = 0;
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

        for (let position: number = 0; position < this.countValue; position += 1) {
            result.push(position);
        }

        return result;
    }

    /**
     * Returns elements ordered from least to most recently used by following level `0`.
     * @example
     * const values: string[] = cache.values();
     * @returns A snapshot of the cached elements.
     */
    public values(): E[] {
        const result: E[] = [];
        let current: LeastRarelyUsageSkipNode<E> | void = this.head[0];

        while (current !== (void 0)) {
            result.push(current.element);
            current = current.next[0];
        }

        return result;
    }

    /**
     * Returns positional key-element pairs ordered from least to most recently used.
     * @example
     * const entries: Array<readonly [number, string]> = cache.entries();
     * @returns A snapshot of the positional entries.
     */
    public entries(): Array<readonly [number, E]> {
        const result: Array<readonly [number, E]> = [];
        let current: LeastRarelyUsageSkipNode<E> | void = this.head[0];
        let position: number = 0;

        while (current !== (void 0)) {
            result.push([position, current.element] as const);
            position += 1;
            current = current.next[0];
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
        if (!Number.isInteger(position) || position < 0 || position >= this.countValue) {
            return (void 0);
        }

        let current: LeastRarelyUsageSkipNode<E> | void = this.head[0];
        let cursor: number = 0;

        while (current !== (void 0) && cursor < position) {
            current = current.next[0];
            cursor += 1;
        }

        return current === (void 0) ? (void 0) : current.element;
    }

    /**
     * Removes and returns the least recently used element.
     * @example
     * const evicted: string | void = cache.shift();
     * @returns The evicted element, or (void 0) when the cache is empty.
     */
    public shift(): E | void {
        const victim: LeastRarelyUsageSkipNode<E> | void = this.head[0];

        if (victim === (void 0)) {
            return (void 0);
        }

        this.unlink(victim);
        this.index.delete(victim.element);
        this.countValue -= 1;

        return victim.element;
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
        let current: LeastRarelyUsageSkipNode<E> | void = this.head[0];
        let position: number = 0;

        while (current !== (void 0)) {
            callback(current.element, position);
            position += 1;
            current = current.next[0];
        }
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
     * Descends through the express lanes to the first node whose usage sequence is not below `sequence`.
     * @param sequence - Usage sequence to locate.
     * @param update - Optional per-level predecessor slots; (void 0) records the head tower.
     * @example
     * const node: LeastRarelyUsageSkipNode<string> | void = this.locate(1n);
     * @returns The first node not below `sequence`, or (void 0) when every node sorts before it.
     */
    private locate(
        sequence: bigint,
        update?: Array<LeastRarelyUsageSkipNode<E> | void>,
    ): LeastRarelyUsageSkipNode<E> | void {
        let links: Array<LeastRarelyUsageSkipNode<E> | void> = this.head;
        let previous: LeastRarelyUsageSkipNode<E> | void = (void 0);

        for (let level: number = this.levelValue - 1; level >= 0; level -= 1) {
            let next: LeastRarelyUsageSkipNode<E> | void = links[level];

            while (next !== (void 0) && next.sequence < sequence) {
                previous = next;
                links = next.next;
                next = links[level];
            }

            if (update !== (void 0)) {
                update[level] = previous;
            }
        }

        return links[0];
    }

    /**
     * Links a node into every level it spans.
     * @param node - Node whose usage sequence has already been assigned.
     * @example
     * this.link(node);
     * @returns Nothing.
     */
    private link(node: LeastRarelyUsageSkipNode<E>): void {
        const update: Array<LeastRarelyUsageSkipNode<E> | void> = new Array<
            LeastRarelyUsageSkipNode<E> | void
        >(SkipListMaxLevel).fill((void 0));

        this.locate(node.sequence, update);

        for (let level: number = 0; level < node.level; level += 1) {
            const predecessor: LeastRarelyUsageSkipNode<E> | void = update[level];
            const links: Array<LeastRarelyUsageSkipNode<E> | void> =
                predecessor === (void 0) ? this.head : predecessor.next;

            node.next[level] = links[level];
            links[level] = node;
        }

        if (node.level > this.levelValue) {
            this.levelValue = node.level;
        }
    }

    /**
     * Unlinks a node from every level it spans and collapses empty top levels.
     * @param node - Node to unlink.
     * @example
     * this.unlink(node);
     * @returns Nothing.
     */
    private unlink(node: LeastRarelyUsageSkipNode<E>): void {
        const update: Array<LeastRarelyUsageSkipNode<E> | void> = new Array<
            LeastRarelyUsageSkipNode<E> | void
        >(SkipListMaxLevel).fill((void 0));

        this.locate(node.sequence, update);

        for (let level: number = 0; level < node.level; level += 1) {
            const predecessor: LeastRarelyUsageSkipNode<E> | void = update[level];
            const links: Array<LeastRarelyUsageSkipNode<E> | void> =
                predecessor === (void 0) ? this.head : predecessor.next;

            links[level] = node.next[level];
            node.next[level] = (void 0);
        }

        while (this.levelValue > 1 && this.head[this.levelValue - 1] === (void 0)) {
            this.levelValue -= 1;
        }
    }

    /**
     * Moves a node to the most-recent end by assigning it a fresh usage sequence and relinking it.
     * @param node - Node to promote.
     * @example
     * this.refresh(node);
     * @returns Nothing.
     */
    private refresh(node: LeastRarelyUsageSkipNode<E>): void {
        this.unlink(node);
        node.sequence = this.tick();
        this.link(node);
    }

    /**
     * Draws a node height by repeated promotion.
     * @example
     * const level: number = this.randomLevel();
     * @returns A height in `[1, SkipListMaxLevel]`.
     */
    private randomLevel(): number {
        let level: number = 1;

        while (level < SkipListMaxLevel && Math.random() < SkipListProbability) {
            level += 1;
        }

        return level;
    }

    /**
     * Advances and returns the usage sequence.
     * @example
     * const sequence: bigint = this.tick();
     * @returns The next sequence value.
     */
    private tick(): bigint {
        this.sequenceValue += 1n;

        return this.sequenceValue;
    }

    /**
     * Evicts the least recently used nodes until the configured capacity is satisfied.
     * @example
     * this.trim();
     * @returns Nothing.
     */
    private trim(): void {
        while (this.countValue > this.capacityValue) {
            const victim: LeastRarelyUsageSkipNode<E> | void = this.head[0];

            if (victim === (void 0)) {
                break;
            }

            this.unlink(victim);
            this.index.delete(victim.element);
            this.countValue -= 1;
        }
    }
}

export default LeastRarelyUsageSkipList;
