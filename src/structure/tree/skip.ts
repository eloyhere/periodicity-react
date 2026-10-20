import { compare } from "../compare";
import type { Comparator } from "../compare";
import { SkipNode } from "../node/skip";
import { Node } from "../node/node";

/**
 * Probabilistic skip list whose level-0 chain keeps every entry in comparator order.
 * Lookup, insertion and removal descend through the express lanes, so the expected
 * cost is logarithmic without rebalancing.
 * Type: class.
 * @param comparator - Key comparator; defaults to `compare`.
 * @param probability - Chance of promoting a new node one level; defaults to 0.5 and falls back to 0.5 outside `(0, 1)`.
 * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
 * @example
 * const tree: SkipTree<string, number> = new SkipTree<string, number>();
 * tree.set("a", 1);
 */
export class SkipTree<K, V> {
    private readonly comparator: Comparator<K>;
    private readonly probability: number;
    private readonly maxLevel: number;
    private readonly head: Array<SkipNode<K, V> | void>;
    private levelValue: number;
    private count: number;

    /**
     * Creates an empty skip list with a head tower of `maxLevel` forward links.
     * @param comparator - Key comparator; defaults to `compare`.
     * @param probability - Chance of promoting a new node one level; defaults to 0.5 and falls back to 0.5 outside `(0, 1)`.
     * @param maxLevel - Maximum node height; defaults to 32 and is clamped to the range 1–32.
     * @example
     * const tree: SkipTree<string, number> = new SkipTree<string, number>(compare, 0.5, 32);
     * @returns A new SkipTree instance.
     */
    constructor(comparator?: Comparator<K>, probability?: number, maxLevel?: number) {
        const requestedProbability: number = probability ?? 0.5;
        const requestedLevel: number = maxLevel ?? 32;
        const normalizedLevel: number = Number.isFinite(requestedLevel) ? Math.floor(requestedLevel) : 32;

        this.comparator = comparator ?? compare;
        this.probability =
            Number.isFinite(requestedProbability) && requestedProbability > 0 && requestedProbability < 1
                ? requestedProbability
                : 0.5;
        this.maxLevel = Math.min(32, Math.max(1, normalizedLevel));
        this.head = new Array<SkipNode<K, V> | void>(this.maxLevel).fill((void 0));
        this.levelValue = 1;
        this.count = 0;
    }

    /**
     * Number of stored entries.
     * @example
     * const size: number = tree.size;
     * @returns Number of entries.
     */
    public get size(): number {
        return this.count;
    }

    /**
     * Checks whether `key` is present.
     * @param key - Key to look up.
     * @example
     * const present: boolean = tree.has("a");
     * @returns True when the key is stored.
     */
    public has(key: K): boolean {
        const found: SkipNode<K, V> | void = this.locate(key);

        return found !== (void 0) && this.comparator(found.item.key, key) === 0;
    }

    /**
     * Reads the value stored under `key`.
     * @param key - Key to look up.
     * @example
     * const value: number | void = tree.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const found: SkipNode<K, V> | void = this.locate(key);

        if (found === (void 0) || this.comparator(found.item.key, key) !== 0) {
            return (void 0);
        }

        return found.item.value;
    }

    /**
     * Stores `value` under `key`; an existing key is updated in place.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * tree.set("a", 1);
     * @returns This instance, for chaining.
     */
    public set(key: K, value: V): this {
        const update: Array<SkipNode<K, V> | void> = new Array<SkipNode<K, V> | void>(this.maxLevel).fill((void 0));
        const found: SkipNode<K, V> | void = this.locate(key, update);

        if (found !== (void 0) && this.comparator(found.item.key, key) === 0) {
            found.item.value = value;

            return this;
        }

        const level: number = this.randomLevel();
        const born: SkipNode<K, V> = new SkipNode<K, V>(new Node<K, V>(key, value), level);

        for (let index: number = 0; index < level; index += 1) {
            const predecessor: SkipNode<K, V> | void = update[index];
            const links: Array<SkipNode<K, V> | void> = predecessor === (void 0) ? this.head : predecessor.next;

            born.next[index] = links[index];
            links[index] = born;
        }

        if (level > this.levelValue) {
            this.levelValue = level;
        }

        this.count += 1;

        return this;
    }

    /**
     * Removes `key` and its value, relinking every level the node occupied.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = tree.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const update: Array<SkipNode<K, V> | void> = new Array<SkipNode<K, V> | void>(this.maxLevel).fill((void 0));
        const found: SkipNode<K, V> | void = this.locate(key, update);

        if (found === (void 0) || this.comparator(found.item.key, key) !== 0) {
            return false;
        }

        for (let index: number = 0; index < found.level; index += 1) {
            const predecessor: SkipNode<K, V> | void = update[index];
            const links: Array<SkipNode<K, V> | void> = predecessor === (void 0) ? this.head : predecessor.next;

            links[index] = found.next[index];
        }

        while (this.levelValue > 1 && this.head[this.levelValue - 1] === (void 0)) {
            this.levelValue -= 1;
        }

        this.count -= 1;

        return true;
    }

    /**
     * Removes every entry and collapses the list to one level.
     * @example
     * tree.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.head.fill((void 0));
        this.levelValue = 1;
        this.count = 0;
    }

    /**
     * Returns the smallest entry in comparator order.
     * @example
     * const first: readonly [string, number] | void = tree.min();
     * @returns The smallest key-value pair, or (void 0) when empty.
     */
    public min(): readonly [K, V] | void {
        const first: SkipNode<K, V> | void = this.head[0];

        return first === (void 0) ? (void 0) : first.item.toEntry();
    }

    /**
     * Returns the largest entry in comparator order.
     * @example
     * const last: readonly [string, number] | void = tree.max();
     * @returns The largest key-value pair, or (void 0) when empty.
     */
    public max(): readonly [K, V] | void {
        let current: SkipNode<K, V> | void = this.head[0];
        let last: SkipNode<K, V> | void = (void 0);

        while (current !== (void 0)) {
            last = current;
            current = current.next[0];
        }

        return last === (void 0) ? (void 0) : last.item.toEntry();
    }

    /**
     * Returns keys in comparator order.
     * @example
     * const keys: string[] = tree.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.entries().map((entry: readonly [K, V]): K => entry[0]);
    }

    /**
     * Returns values in comparator order.
     * @example
     * const values: number[] = tree.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.entries().map((entry: readonly [K, V]): V => entry[1]);
    }

    /**
     * Returns key-value pairs in comparator order.
     * @example
     * const entries: Array<readonly [string, number]> = tree.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];
        let current: SkipNode<K, V> | void = this.head[0];

        while (current !== (void 0)) {
            result.push(current.item.toEntry());
            current = current.next[0];
        }

        return result;
    }

    /**
     * Returns entries whose keys fall in the closed interval `[start, end]`.
     * @param start - First key of the interval.
     * @param end - Last key of the interval.
     * @example
     * const entries: Array<readonly [string, number]> = tree.range("b", "d");
     * @returns Matching entries in comparator order; empty when `start` sorts after `end`.
     */
    public range(start: K, end: K): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];

        if (this.comparator(start, end) > 0) {
            return result;
        }

        let current: SkipNode<K, V> | void = this.locate(start);

        while (current !== (void 0) && this.comparator(current.item.key, end) <= 0) {
            result.push(current.item.toEntry());
            current = current.next[0];
        }

        return result;
    }

    /**
     * Iterates key-value pairs in comparator order.
     * @example
     * for (const entry of tree) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over mutable key-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[K, V]> {
        const result: Array<[K, V]> = this.entries().map(
            (entry: readonly [K, V]): [K, V] => [entry[0], entry[1]],
        );

        return result[Symbol.iterator]();
    }

    /**
     * Descends from the head tower to the first node whose key is not below `key`.
     * @param key - Key to locate.
     * @param update - Optional per-level predecessor slots; (void 0) records the head tower.
     * @example
     * const first: SkipNode<string, number> | void = this.locate("a");
     * @returns The first node not below `key`, or (void 0) when every key sorts before it.
     */
    private locate(key: K, update?: Array<SkipNode<K, V> | void>): SkipNode<K, V> | void {
        let links: Array<SkipNode<K, V> | void> = this.head;
        let previous: SkipNode<K, V> | void = (void 0);

        for (let level: number = this.levelValue - 1; level >= 0; level -= 1) {
            let next: SkipNode<K, V> | void = links[level];

            while (next !== (void 0) && this.comparator(next.item.key, key) < 0) {
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
     * Draws a node height by repeated promotion.
     * @example
     * const level: number = this.randomLevel();
     * @returns A height in `[1, maxLevel]`.
     */
    private randomLevel(): number {
        let level: number = 1;

        while (level < this.maxLevel && Math.random() < this.probability) {
            level += 1;
        }

        return level;
    }
}

export default SkipTree;
