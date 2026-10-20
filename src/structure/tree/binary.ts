import { compare } from "../compare";
import type { Comparator } from "../compare";
import { BinaryNode, Node } from "../node";

/**
 * Unbalanced binary search tree ordered by a comparator.
 * Type: class.
 * @param comparator - Ordering function for keys; defaults to `compare`.
 * @example
 * const tree: BinarySearchTree<string, number> = new BinarySearchTree<string, number>();
 * tree.set("a", 1);
 */
export class BinarySearchTree<K, V> {
    private readonly comparator: Comparator<K>;
    private root: BinaryNode<K, V> | void;
    private count: number;

    /**
     * Creates an empty BinarySearchTree.
     * @param comparator - Ordering function for keys; defaults to `compare`.
     * @example
     * const tree = new BinarySearchTree<string, number>();
     * @returns A new BinarySearchTree.
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
     * const value = tree.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const node: BinaryNode<K, V> | void = this.lookup(key);

        return node === (void 0) ? (void 0) : node.item.value;
    }

    /**
     * Updates the value for `key`, or inserts a new entry when the key is absent.
     * @param key - Key to store.
     * @param value - Value to store.
     * @example
     * tree.set("a", 1);
     * @returns This tree, for chaining.
     */
    public set(key: K, value: V): this {
        const existing: BinaryNode<K, V> | void = this.lookup(key);

        if (existing !== (void 0)) {
            existing.item.value = value;

            return this;
        }

        const created: BinaryNode<K, V> = new BinaryNode<K, V>(new Node<K, V>(key, value));

        if (this.root === (void 0)) {
            this.root = created;
            this.count += 1;

            return this;
        }

        let current: BinaryNode<K, V> = this.root;

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

        return this;
    }

    /**
     * Removes `key` and its value.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = tree.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const node: BinaryNode<K, V> | void = this.lookup(key);

        if (node === (void 0)) {
            return false;
        }

        this.remove(node);
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
     * const entry = tree.min();
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
     * const entry = tree.max();
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
     * const entries = tree.entries();
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
     * @returns Key-value pairs in ascending key order.
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
     *     const key = entry[0];
     * }
     * @returns An iterator over key-value pairs.
     */
    public *[Symbol.iterator](): IterableIterator<[K, V]> {
        const stack: Array<BinaryNode<K, V>> = [];
        let current: BinaryNode<K, V> | void = this.root;

        while (current !== (void 0) || stack.length > 0) {
            while (current !== (void 0)) {
                stack.push(current);
                current = current.left;
            }

            const node: BinaryNode<K, V> = stack[stack.length - 1];
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
    private lookup(key: K): BinaryNode<K, V> | void {
        let current: BinaryNode<K, V> | void = this.root;

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
     * this.remove(node);
     * @returns Nothing.
     */
    private remove(node: BinaryNode<K, V>): void {
        if (node.left === (void 0)) {
            this.transplant(node, node.right);
        } else if (node.right === (void 0)) {
            this.transplant(node, node.left);
        } else {
            const successor: BinaryNode<K, V> = this.minimum(node.right);

            if (successor.parent !== node) {
                this.transplant(successor, successor.right);
                successor.right = node.right;

                if (successor.right !== (void 0)) {
                    successor.right.parent = successor;
                }
            }

            this.transplant(node, successor);
            successor.left = node.left;

            if (successor.left !== (void 0)) {
                successor.left.parent = successor;
            }
        }

        node.left = (void 0);
        node.right = (void 0);
        node.parent = (void 0);
    }

    /**
     * Replaces the `target` subtree with the `replacement` subtree.
     * @param target - Node to detach.
     * @param replacement - Node that takes the target's place.
     * @example
     * this.transplant(node, node.left);
     * @returns Nothing.
     */
    private transplant(target: BinaryNode<K, V>, replacement: BinaryNode<K, V> | void): void {
        const parent: BinaryNode<K, V> | void = target.parent;

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
    private minimum(node: BinaryNode<K, V>): BinaryNode<K, V> {
        let current: BinaryNode<K, V> = node;

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
    private maximum(node: BinaryNode<K, V>): BinaryNode<K, V> {
        let current: BinaryNode<K, V> = node;

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
        node: BinaryNode<K, V> | void,
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
}

export default BinarySearchTree;
