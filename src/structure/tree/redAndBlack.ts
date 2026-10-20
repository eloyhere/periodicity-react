import { compare } from "../compare";
import type { Comparator } from "../compare";
import { Node, RedAndBlackNode } from "../node";

/**
 * Balanced red-black search tree ordered by a comparator.
 * Type: class.
 * @param comparator - Ordering function for keys; defaults to `compare`.
 * @example
 * const tree: RedBlackTree<string, number> = new RedBlackTree<string, number>();
 * tree.set("a", 1);
 */
export class RedBlackTree<K, V> {
    private readonly comparator: Comparator<K>;
    private root: RedAndBlackNode<K, V> | void;
    private count: number;

    /**
     * Creates an empty RedBlackTree.
     * @param comparator - Ordering function for keys; defaults to `compare`.
     * @example
     * const tree = new RedBlackTree<string, number>();
     * @returns A new RedBlackTree.
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
        const node: RedAndBlackNode<K, V> | void = this.lookup(key);

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
        const existing: RedAndBlackNode<K, V> | void = this.lookup(key);

        if (existing !== (void 0)) {
            existing.item.value = value;

            return this;
        }

        const created: RedAndBlackNode<K, V> = new RedAndBlackNode<K, V>(new Node<K, V>(key, value));

        if (this.root === (void 0)) {
            created.red = false;
            this.root = created;
            this.count += 1;

            return this;
        }

        let current: RedAndBlackNode<K, V> = this.root;

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
        this.fixInsert(created);

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
        const node: RedAndBlackNode<K, V> | void = this.lookup(key);

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
        const stack: Array<RedAndBlackNode<K, V>> = [];
        let current: RedAndBlackNode<K, V> | void = this.root;

        while (current !== (void 0) || stack.length > 0) {
            while (current !== (void 0)) {
                stack.push(current);
                current = current.left;
            }

            const node: RedAndBlackNode<K, V> = stack[stack.length - 1];
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
    private lookup(key: K): RedAndBlackNode<K, V> | void {
        let current: RedAndBlackNode<K, V> | void = this.root;

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
     * Reports whether `node` exists and carries a red colour.
     * @param node - Node to inspect.
     * @example
     * const red: boolean = this.isRed(node);
     * @returns True when the node is red.
     */
    private isRed(node: RedAndBlackNode<K, V> | void): boolean {
        return node !== (void 0) && node.red;
    }

    /**
     * Rotates the subtree rooted at `node` to the left.
     * @param node - Subtree root to rotate.
     * @example
     * this.rotateLeft(node);
     * @returns Nothing.
     */
    private rotateLeft(node: RedAndBlackNode<K, V>): void {
        const pivot: RedAndBlackNode<K, V> | void = node.right;

        if (pivot === (void 0)) {
            return;
        }

        node.right = pivot.left;

        if (node.right !== (void 0)) {
            node.right.parent = node;
        }

        const parent: RedAndBlackNode<K, V> | void = node.parent;
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
    }

    /**
     * Rotates the subtree rooted at `node` to the right.
     * @param node - Subtree root to rotate.
     * @example
     * this.rotateRight(node);
     * @returns Nothing.
     */
    private rotateRight(node: RedAndBlackNode<K, V>): void {
        const pivot: RedAndBlackNode<K, V> | void = node.left;

        if (pivot === (void 0)) {
            return;
        }

        node.left = pivot.right;

        if (node.left !== (void 0)) {
            node.left.parent = node;
        }

        const parent: RedAndBlackNode<K, V> | void = node.parent;
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
    }

    /**
     * Restores the red-black invariants after an insertion.
     * @param start - Newly inserted red node.
     * @example
     * this.fixInsert(created);
     * @returns Nothing.
     */
    private fixInsert(start: RedAndBlackNode<K, V>): void {
        let node: RedAndBlackNode<K, V> = start;

        while (true) {
            const parent: RedAndBlackNode<K, V> | void = node.parent;

            if (parent === (void 0) || !parent.red) {
                break;
            }

            const grandparent: RedAndBlackNode<K, V> | void = parent.parent;

            if (grandparent === (void 0)) {
                break;
            }

            if (parent === grandparent.left) {
                const uncle: RedAndBlackNode<K, V> | void = grandparent.right;

                if (uncle !== (void 0) && uncle.red) {
                    parent.red = false;
                    uncle.red = false;
                    grandparent.red = true;
                    node = grandparent;
                } else {
                    if (node === parent.right) {
                        node = parent;
                        this.rotateLeft(node);
                    }

                    const nextParent: RedAndBlackNode<K, V> | void = node.parent;

                    if (nextParent === (void 0)) {
                        break;
                    }

                    nextParent.red = false;

                    const nextGrandparent: RedAndBlackNode<K, V> | void = nextParent.parent;

                    if (nextGrandparent === (void 0)) {
                        break;
                    }

                    nextGrandparent.red = true;
                    this.rotateRight(nextGrandparent);
                }
            } else {
                const uncle: RedAndBlackNode<K, V> | void = grandparent.left;

                if (uncle !== (void 0) && uncle.red) {
                    parent.red = false;
                    uncle.red = false;
                    grandparent.red = true;
                    node = grandparent;
                } else {
                    if (node === parent.left) {
                        node = parent;
                        this.rotateRight(node);
                    }

                    const nextParent: RedAndBlackNode<K, V> | void = node.parent;

                    if (nextParent === (void 0)) {
                        break;
                    }

                    nextParent.red = false;

                    const nextGrandparent: RedAndBlackNode<K, V> | void = nextParent.parent;

                    if (nextGrandparent === (void 0)) {
                        break;
                    }

                    nextGrandparent.red = true;
                    this.rotateLeft(nextGrandparent);
                }
            }
        }

        if (this.root !== (void 0)) {
            this.root.red = false;
        }
    }

    /**
     * Detaches `node` while preserving the binary search property.
     * @param node - Node to remove.
     * @example
     * this.removeNode(node);
     * @returns Nothing.
     */
    private removeNode(node: RedAndBlackNode<K, V>): void {
        let moved: RedAndBlackNode<K, V> = node;
        let movedRed: boolean = moved.red;
        let replacement: RedAndBlackNode<K, V> | void;
        let replacementParent: RedAndBlackNode<K, V> | void;

        if (node.left === (void 0)) {
            replacement = node.right;
            replacementParent = node.parent;
            this.transplant(node, node.right);
        } else if (node.right === (void 0)) {
            replacement = node.left;
            replacementParent = node.parent;
            this.transplant(node, node.left);
        } else {
            moved = this.minimum(node.right);
            movedRed = moved.red;
            replacement = moved.right;

            if (moved.parent === node) {
                replacementParent = moved;

                if (replacement !== (void 0)) {
                    replacement.parent = moved;
                }
            } else {
                const movedParent: RedAndBlackNode<K, V> | void = moved.parent;
                this.transplant(moved, moved.right);
                replacementParent = movedParent;
                moved.right = node.right;

                if (moved.right !== (void 0)) {
                    moved.right.parent = moved;
                }
            }

            this.transplant(node, moved);
            moved.left = node.left;

            if (moved.left !== (void 0)) {
                moved.left.parent = moved;
            }

            moved.red = node.red;
        }

        if (!movedRed) {
            this.fixRemove(replacement, replacementParent);
        }

        node.left = (void 0);
        node.right = (void 0);
        node.parent = (void 0);
    }

    /**
     * Restores the red-black invariants after a removal.
     * @param start - Node that replaced the removed node, if any.
     * @param startParent - Parent of `start` when `start` is empty.
     * @example
     * this.fixRemove(replacement, replacementParent);
     * @returns Nothing.
     */
    private fixRemove(
        start: RedAndBlackNode<K, V> | void,
        startParent: RedAndBlackNode<K, V> | void,
    ): void {
        let node: RedAndBlackNode<K, V> | void = start;
        let parent: RedAndBlackNode<K, V> | void = startParent;

        while (node !== this.root && !this.isRed(node)) {
            if (parent === (void 0)) {
                break;
            }

            if (node === parent.left) {
                let sibling: RedAndBlackNode<K, V> | void = parent.right;

                if (sibling === (void 0)) {
                    break;
                }

                if (sibling.red) {
                    sibling.red = false;
                    parent.red = true;
                    this.rotateLeft(parent);
                    sibling = parent.right;
                }

                if (sibling === (void 0)) {
                    break;
                }

                const leftNephew: RedAndBlackNode<K, V> | void = sibling.left;
                const rightNephew: RedAndBlackNode<K, V> | void = sibling.right;

                if (!this.isRed(leftNephew) && !this.isRed(rightNephew)) {
                    sibling.red = true;
                    node = parent;
                    parent = node.parent;
                } else {
                    if (!this.isRed(rightNephew)) {
                        if (leftNephew !== (void 0)) {
                            leftNephew.red = false;
                        }

                        sibling.red = true;
                        this.rotateRight(sibling);
                        sibling = parent.right;
                    }

                    if (sibling === (void 0)) {
                        break;
                    }

                    sibling.red = parent.red;

                    if (sibling.right !== (void 0)) {
                        sibling.right.red = false;
                    }

                    parent.red = false;
                    this.rotateLeft(parent);
                    node = this.root;
                    parent = (void 0);
                }
            } else {
                let sibling: RedAndBlackNode<K, V> | void = parent.left;

                if (sibling === (void 0)) {
                    break;
                }

                if (sibling.red) {
                    sibling.red = false;
                    parent.red = true;
                    this.rotateRight(parent);
                    sibling = parent.left;
                }

                if (sibling === (void 0)) {
                    break;
                }

                const leftNephew: RedAndBlackNode<K, V> | void = sibling.left;
                const rightNephew: RedAndBlackNode<K, V> | void = sibling.right;

                if (!this.isRed(leftNephew) && !this.isRed(rightNephew)) {
                    sibling.red = true;
                    node = parent;
                    parent = node.parent;
                } else {
                    if (!this.isRed(leftNephew)) {
                        if (rightNephew !== (void 0)) {
                            rightNephew.red = false;
                        }

                        sibling.red = true;
                        this.rotateLeft(sibling);
                        sibling = parent.left;
                    }

                    if (sibling === (void 0)) {
                        break;
                    }

                    sibling.red = parent.red;

                    if (sibling.left !== (void 0)) {
                        sibling.left.red = false;
                    }

                    parent.red = false;
                    this.rotateRight(parent);
                    node = this.root;
                    parent = (void 0);
                }
            }
        }

        if (node !== (void 0)) {
            node.red = false;
        }
    }

    /**
     * Replaces the `target` subtree with the `replacement` subtree.
     * @param target - Node to detach.
     * @param replacement - Node that takes the target's place.
     * @example
     * this.transplant(node, node.left);
     * @returns Nothing.
     */
    private transplant(target: RedAndBlackNode<K, V>, replacement: RedAndBlackNode<K, V> | void): void {
        const parent: RedAndBlackNode<K, V> | void = target.parent;

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
    private minimum(node: RedAndBlackNode<K, V>): RedAndBlackNode<K, V> {
        let current: RedAndBlackNode<K, V> = node;

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
    private maximum(node: RedAndBlackNode<K, V>): RedAndBlackNode<K, V> {
        let current: RedAndBlackNode<K, V> = node;

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
        node: RedAndBlackNode<K, V> | void,
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

export default RedBlackTree;
