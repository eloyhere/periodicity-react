import { compare } from "../compare";
import type { Comparator } from "../compare";
import { BalanceNode } from "../node/balance";
import { Node } from "../node/node";

/**
 * AVL search tree ordered by a comparator, with parent links and height-based rebalancing.
 * Type: class.
 * @param comparator - Ordering function for keys; defaults to `compare`.
 * @example
 * const tree: BalanceTree<string, number> = new BalanceTree<string, number>();
 * tree.set("a", 1);
 */
export class BalanceTree<K, V> {
    private readonly comparator: Comparator<K>;
    private root: BalanceNode<K, V> | void;
    private count: number;

    /**
     * Creates an empty BalanceTree.
     * @param comparator - Ordering function for keys; defaults to `compare`.
     * @example
     * const tree: BalanceTree<string, number> = new BalanceTree<string, number>();
     * @returns A new BalanceTree instance.
     */
    constructor(comparator?: Comparator<K>) {
        this.comparator = comparator ?? compare;
        this.root = (void 0);
        this.count = 0;
    }

    /**
     * Number of stored entries.
     * @example
     * const size: number = tree.size;
     * @returns Number of stored entries.
     */
    public get size(): number {
        return this.count;
    }

    /**
     * Checks whether `key` is present.
     * @param key - Key to look up.
     * @example
     * const present: boolean = tree.has("a");
     * @returns True when the key is present.
     */
    public has(key: K): boolean {
        return this.lookup(key) !== (void 0);
    }

    /**
     * Reads the value stored for `key`.
     * @param key - Key to look up.
     * @example
     * const value: number | void = tree.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const node: BalanceNode<K, V> | void = this.lookup(key);

        return node === (void 0) ? (void 0) : node.item.value;
    }

    /**
     * Updates the value for `key`, or inserts a new entry and rebalances the tree.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * tree.set("a", 1);
     * @returns This tree, for chaining.
     */
    public set(key: K, value: V): this {
        const existing: BalanceNode<K, V> | void = this.lookup(key);

        if (existing !== (void 0)) {
            existing.item.value = value;

            return this;
        }

        const created: BalanceNode<K, V> = new BalanceNode<K, V>(new Node<K, V>(key, value));

        if (this.root === (void 0)) {
            this.root = created;
            this.count += 1;

            return this;
        }

        let current: BalanceNode<K, V> = this.root;

        while (true) {
            const order: number = this.comparator(key, current.item.key);

            if (order < 0) {
                if (current.left === (void 0)) {
                    current.left = created;
                    created.parent = current;
                    break;
                }

                current = current.left;
            } else {
                if (current.right === (void 0)) {
                    current.right = created;
                    created.parent = current;
                    break;
                }

                current = current.right;
            }
        }

        this.count += 1;
        this.rebalance(created.parent);

        return this;
    }

    /**
     * Removes `key` and its value, then rebalances the affected path.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = tree.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const node: BalanceNode<K, V> | void = this.lookup(key);

        if (node === (void 0)) {
            return false;
        }

        this.removeNode(node);
        this.count -= 1;

        return true;
    }

    /**
     * Removes every entry.
     * @example
     * tree.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.root = (void 0);
        this.count = 0;
    }

    /**
     * Smallest entry.
     * @example
     * const entry: readonly [string, number] | void = tree.min();
     * @returns The smallest key-value pair, or (void 0) when the tree is empty.
     */
    public min(): readonly [K, V] | void {
        if (this.root === (void 0)) {
            return (void 0);
        }

        return this.minimum(this.root).item.toEntry();
    }

    /**
     * Largest entry.
     * @example
     * const entry: readonly [string, number] | void = tree.max();
     * @returns The largest key-value pair, or (void 0) when the tree is empty.
     */
    public max(): readonly [K, V] | void {
        if (this.root === (void 0)) {
            return (void 0);
        }

        return this.maximum(this.root).item.toEntry();
    }

    /**
     * Returns keys in ascending order.
     * @example
     * const keys: string[] = tree.keys();
     * @returns A snapshot of keys.
     */
    public keys(): K[] {
        return this.entries().map((entry: readonly [K, V]): K => entry[0]);
    }

    /**
     * Returns values in ascending key order.
     * @example
     * const values: number[] = tree.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.entries().map((entry: readonly [K, V]): V => entry[1]);
    }

    /**
     * Returns key-value pairs in ascending key order.
     * @example
     * const entries: Array<readonly [string, number]> = tree.entries();
     * @returns A snapshot of key-value pairs.
     */
    public entries(): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];
        const iterator: IterableIterator<[K, V]> = this[Symbol.iterator]();
        let step: IteratorResult<[K, V]> = iterator.next();

        while (step.done !== true) {
            const entry: [K, V] = step.value;
            result.push([entry[0], entry[1]] as const);
            step = iterator.next();
        }

        return result;
    }

    /**
     * Returns entries whose keys lie in the closed interval `[start, end]`.
     * @param start - Inclusive lower bound.
     * @param end - Inclusive upper bound.
     * @example
     * const entries = tree.range("b", "d");
     * @returns Key-value pairs in ascending key order, or an empty array when `start` exceeds `end`.
     */
    public range(start: K, end: K): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];

        if (this.comparator(start, end) > 0) {
            return result;
        }

        this.collectRange(this.root, start, end, result);

        return result;
    }

    /**
     * Iterates key-value pairs in ascending key order.
     * @example
     * for (const entry of tree) {
     *     const key: string = entry[0];
     * }
     * @returns An iterator over key-value pairs.
     */
    public *[Symbol.iterator](): IterableIterator<[K, V]> {
        const stack: Array<BalanceNode<K, V>> = [];
        let current: BalanceNode<K, V> | void = this.root;

        while (current !== (void 0) || stack.length > 0) {
            while (current !== (void 0)) {
                stack.push(current);
                current = current.left;
            }

            const node: BalanceNode<K, V> = stack[stack.length - 1];
            stack.length -= 1;
            yield [node.item.key, node.item.value];
            current = node.right;
        }
    }

    /**
     * Finds the node stored for `key`.
     * @param key - Key to look up.
     * @example
     * const node = this.lookup("a");
     * @returns The matching node, or (void 0) when absent.
     */
    private lookup(key: K): BalanceNode<K, V> | void {
        let current: BalanceNode<K, V> | void = this.root;

        while (current !== (void 0)) {
            const order: number = this.comparator(key, current.item.key);

            if (order === 0) {
                return current;
            }

            current = order < 0 ? current.left : current.right;
        }

        return (void 0);
    }

    /**
     * Detaches `node` while preserving the binary search property.
     * @param node - Node to remove.
     * @example
     * this.removeNode(node);
     * @returns Nothing.
     */
    private removeNode(node: BalanceNode<K, V>): void {
        let start: BalanceNode<K, V> | void;

        if (node.left === (void 0)) {
            start = node.parent;
            this.transplant(node, node.right);
        } else if (node.right === (void 0)) {
            start = node.parent;
            this.transplant(node, node.left);
        } else {
            const right: BalanceNode<K, V> = node.right;
            const left: BalanceNode<K, V> = node.left;
            const successor: BalanceNode<K, V> = this.minimum(right);

            if (successor.parent !== node) {
                start = successor.parent;
                this.transplant(successor, successor.right);
                successor.right = right;
                right.parent = successor;
            } else {
                start = successor;
            }

            this.transplant(node, successor);
            successor.left = left;
            left.parent = successor;
            successor.updateHeight();
        }

        node.left = (void 0);
        node.right = (void 0);
        node.parent = (void 0);

        this.rebalance(start);
    }

    /**
     * Replaces the `target` subtree with the `replacement` subtree.
     * @param target - Node to detach.
     * @param replacement - Node that takes the target's place.
     * @example
     * this.transplant(node, node.left);
     * @returns Nothing.
     */
    private transplant(target: BalanceNode<K, V>, replacement: BalanceNode<K, V> | void): void {
        const parent: BalanceNode<K, V> | void = target.parent;

        if (parent === (void 0)) {
            this.root = replacement;
        } else if (parent.left === target) {
            parent.left = replacement;
        } else {
            parent.right = replacement;
        }

        if (replacement !== (void 0)) {
            replacement.parent = parent;
        }
    }

    /**
     * Finds the leftmost node of the subtree rooted at `node`.
     * @param node - Subtree root.
     * @example
     * const node = this.minimum(this.root);
     * @returns The leftmost node.
     */
    private minimum(node: BalanceNode<K, V>): BalanceNode<K, V> {
        let current: BalanceNode<K, V> = node;

        while (current.left !== (void 0)) {
            current = current.left;
        }

        return current;
    }

    /**
     * Finds the rightmost node of the subtree rooted at `node`.
     * @param node - Subtree root.
     * @example
     * const node = this.maximum(this.root);
     * @returns The rightmost node.
     */
    private maximum(node: BalanceNode<K, V>): BalanceNode<K, V> {
        let current: BalanceNode<K, V> = node;

        while (current.right !== (void 0)) {
            current = current.right;
        }

        return current;
    }

    /**
     * Collects entries whose keys lie in the closed interval `[start, end]`.
     * @param node - Subtree root to inspect.
     * @param start - Inclusive lower bound.
     * @param end - Inclusive upper bound.
     * @param result - Array receiving matching entries.
     * @example
     * this.collectRange(this.root, "b", "d", result);
     * @returns Nothing.
     */
    private collectRange(
        node: BalanceNode<K, V> | void,
        start: K,
        end: K,
        result: Array<readonly [K, V]>,
    ): void {
        if (node === (void 0)) {
            return;
        }

        const aboveStart: number = this.comparator(node.item.key, start);
        const belowEnd: number = this.comparator(node.item.key, end);

        if (aboveStart > 0) {
            this.collectRange(node.left, start, end, result);
        }

        if (aboveStart >= 0 && belowEnd <= 0) {
            result.push(node.item.toEntry());
        }

        if (belowEnd < 0) {
            this.collectRange(node.right, start, end, result);
        }
    }

    /**
     * Updates heights and rotates from `start` up to the root.
     * @param start - Lowest node whose height may have changed, or (void 0).
     * @example
     * this.rebalance(created.parent);
     * @returns Nothing.
     */
    private rebalance(start: BalanceNode<K, V> | void): void {
        let current: BalanceNode<K, V> | void = start;

        while (current !== (void 0)) {
            current.updateHeight();

            const factor: number = current.balanceFactor();

            if (factor > 1) {
                const left: BalanceNode<K, V> | void = current.left;

                if (left === (void 0)) {
                    current = current.parent;
                    continue;
                }

                if (left.balanceFactor() < 0) {
                    this.rotateLeft(left);
                }

                const rotated: BalanceNode<K, V> = this.rotateRight(current);
                current = rotated.parent;
            } else if (factor < -1) {
                const right: BalanceNode<K, V> | void = current.right;

                if (right === (void 0)) {
                    current = current.parent;
                    continue;
                }

                if (right.balanceFactor() > 0) {
                    this.rotateRight(right);
                }

                const rotated: BalanceNode<K, V> = this.rotateLeft(current);
                current = rotated.parent;
            } else {
                current = current.parent;
            }
        }
    }

    /**
     * Rotates the subtree rooted at `node` to the left around its right child.
     * @param node - Subtree root to rotate.
     * @example
     * const root = this.rotateLeft(node);
     * @returns The new subtree root.
     */
    private rotateLeft(node: BalanceNode<K, V>): BalanceNode<K, V> {
        const pivot: BalanceNode<K, V> | void = node.right;

        if (pivot === (void 0)) {
            return node;
        }

        node.right = pivot.left;

        if (node.right !== (void 0)) {
            node.right.parent = node;
        }

        const parent: BalanceNode<K, V> | void = node.parent;
        pivot.parent = parent;

        if (parent === (void 0)) {
            this.root = pivot;
        } else if (parent.left === node) {
            parent.left = pivot;
        } else {
            parent.right = pivot;
        }

        pivot.left = node;
        node.parent = pivot;
        node.updateHeight();
        pivot.updateHeight();

        return pivot;
    }

    /**
     * Rotates the subtree rooted at `node` to the right around its left child.
     * @param node - Subtree root to rotate.
     * @example
     * const root = this.rotateRight(node);
     * @returns The new subtree root.
     */
    private rotateRight(node: BalanceNode<K, V>): BalanceNode<K, V> {
        const pivot: BalanceNode<K, V> | void = node.left;

        if (pivot === (void 0)) {
            return node;
        }

        node.left = pivot.right;

        if (node.left !== (void 0)) {
            node.left.parent = node;
        }

        const parent: BalanceNode<K, V> | void = node.parent;
        pivot.parent = parent;

        if (parent === (void 0)) {
            this.root = pivot;
        } else if (parent.right === node) {
            parent.right = pivot;
        } else {
            parent.left = pivot;
        }

        pivot.right = node;
        node.parent = pivot;
        node.updateHeight();
        pivot.updateHeight();

        return pivot;
    }
}

export default BalanceTree;
