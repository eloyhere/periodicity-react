import { compare } from "../compare";
import type { Comparator } from "../compare";
import { BPlusNode, Node } from "../node";

/**
 * B+ tree whose leaves store entries and whose internal nodes store separator keys.
 * Leaves are chained through `next`, so ordered scans never revisit the root.
 * Type: class.
 * @param degree - Maximum number of keys per node; defaults to 4 and is clamped to at least 3.
 * @param comparator - Key comparator; defaults to `compare`.
 * @example
 * const tree: BPlusTree<string, number> = new BPlusTree<string, number>();
 */
export class BPlusTree<K, V> {
    private readonly degree: number;
    private readonly comparator: Comparator<K>;
    private root: BPlusNode<K, V>;
    private count: number;

    /**
     * Creates an empty B+ tree.
     * @param degree - Maximum number of keys per node; defaults to 4 and is clamped to at least 3.
     * @param comparator - Key comparator; defaults to `compare`.
     * @example
     * const tree: BPlusTree<string, number> = new BPlusTree<string, number>(4);
     * @returns A new BPlusTree instance.
     */
    constructor(degree?: number, comparator?: Comparator<K>) {
        const requested: number = degree ?? 4;
        const normalized: number = Number.isFinite(requested) ? Math.floor(requested) : 4;

        this.degree = Math.max(3, normalized);
        this.comparator = comparator ?? compare;
        this.root = new BPlusNode<K, V>(true);
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
        return this.findItem(key) !== (void 0);
    }

    /**
     * Reads the value stored under `key`.
     * @param key - Key to look up.
     * @example
     * const value: number | void = tree.get("a");
     * @returns The stored value, or (void 0) when absent.
     */
    public get(key: K): V | void {
        const item: Node<K, V> | void = this.findItem(key);

        return item === (void 0) ? (void 0) : item.value;
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
        const leaf: BPlusNode<K, V> = this.locateLeaf(key);
        const position: number = this.itemIndex(leaf, key);

        if (position < leaf.items.length && this.comparator(leaf.items[position].key, key) === 0) {
            leaf.items[position].value = value;

            return this;
        }

        leaf.items.splice(position, 0, new Node<K, V>(key, value));
        this.count += 1;

        if (leaf.items.length > this.degree) {
            this.splitLeaf(leaf);
        }

        return this;
    }

    /**
     * Removes `key` and its value, rebalancing underflowed nodes.
     * @param key - Key to remove.
     * @example
     * const removed: boolean = tree.delete("a");
     * @returns True when the key was removed.
     */
    public delete(key: K): boolean {
        const leaf: BPlusNode<K, V> = this.locateLeaf(key);
        const position: number = this.itemIndex(leaf, key);

        if (position >= leaf.items.length || this.comparator(leaf.items[position].key, key) !== 0) {
            return false;
        }

        leaf.items.splice(position, 1);
        this.count -= 1;

        if (this.root !== leaf) {
            this.rebalance(leaf);
            this.collapseRoot();
        }

        return true;
    }

    /**
     * Removes every entry and resets the tree to a single empty leaf.
     * @example
     * tree.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.root = new BPlusNode<K, V>(true);
        this.count = 0;
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
        let leaf: BPlusNode<K, V> | void = this.leftmost();

        while (leaf !== (void 0)) {
            for (let position: number = 0; position < leaf.items.length; position += 1) {
                result.push(leaf.items[position].toEntry());
            }

            leaf = leaf.next;
        }

        return result;
    }

    /**
     * Returns entries whose keys fall in the closed interval `[start, end]`.
     * @param start - First key of the interval.
     * @param end - Last key of the interval.
     * @example
     * const entries: Array<readonly [string, number]> = tree.range("b", "d");
     * @returns Matching entries in ascending key order; empty when `start` sorts after `end`.
     */
    public range(start: K, end: K): Array<readonly [K, V]> {
        const result: Array<readonly [K, V]> = [];

        if (this.comparator(start, end) > 0) {
            return result;
        }

        const first: BPlusNode<K, V> = this.locateLeaf(start);
        let leaf: BPlusNode<K, V> | void = first;
        let position: number = this.itemIndex(first, start);

        while (leaf !== (void 0)) {
            while (position < leaf.items.length) {
                const item: Node<K, V> = leaf.items[position];

                if (this.comparator(item.key, end) > 0) {
                    return result;
                }

                result.push(item.toEntry());
                position += 1;
            }

            leaf = leaf.next;
            position = 0;
        }

        return result;
    }

    /**
     * Iterates key-value pairs in ascending key order.
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
     * Descends to the leaf that would contain `key`.
     * @param key - Key to locate.
     * @example
     * const leaf = this.locateLeaf("a");
     * @returns The target leaf node.
     */
    private locateLeaf(key: K): BPlusNode<K, V> {
        let node: BPlusNode<K, V> = this.root;

        while (!node.isLeaf()) {
            node = node.children[this.childIndex(node, key)];
        }

        return node;
    }

    /**
     * Finds the entry stored under `key`.
     * @param key - Key to look up.
     * @example
     * const item = this.findItem("a");
     * @returns The matching entry, or (void 0) when absent.
     */
    private findItem(key: K): Node<K, V> | void {
        const leaf: BPlusNode<K, V> = this.locateLeaf(key);
        const position: number = this.itemIndex(leaf, key);

        if (position >= leaf.items.length) {
            return (void 0);
        }

        return this.comparator(leaf.items[position].key, key) === 0 ? leaf.items[position] : (void 0);
    }

    /**
     * Returns the child position whose lower bound is the greatest key not above `key`.
     * @param node - Internal node to search.
     * @param key - Key to route.
     * @example
     * const position = this.childIndex(node, "a");
     * @returns A child index in `[0, node.children.length - 1]`.
     */
    private childIndex(node: BPlusNode<K, V>, key: K): number {
        let low: number = 0;
        let high: number = node.keys.length;

        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);

            if (this.comparator(key, node.keys[middle]) >= 0) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }

        return low;
    }

    /**
     * Returns the first item position whose key is not below `key`.
     * @param leaf - Leaf node to search.
     * @param key - Key to locate.
     * @example
     * const position = this.itemIndex(leaf, "a");
     * @returns An insertion position in `[0, leaf.items.length]`.
     */
    private itemIndex(leaf: BPlusNode<K, V>, key: K): number {
        let low: number = 0;
        let high: number = leaf.items.length;

        while (low < high) {
            const middle: number = Math.floor((low + high) / 2);

            if (this.comparator(leaf.items[middle].key, key) < 0) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }

        return low;
    }

    /**
     * Splits an overflowing leaf and promotes its first right key.
     * @param leaf - Leaf whose item count exceeds the degree.
     * @example
     * this.splitLeaf(leaf);
     * @returns Nothing.
     */
    private splitLeaf(leaf: BPlusNode<K, V>): void {
        const middle: number = Math.ceil(leaf.items.length / 2);
        const right: BPlusNode<K, V> = new BPlusNode<K, V>(true, [], leaf.items.slice(middle));

        leaf.items = leaf.items.slice(0, middle);
        right.next = leaf.next;
        leaf.next = right;
        right.parent = leaf.parent;

        if (leaf.parent === (void 0)) {
            const root: BPlusNode<K, V> = new BPlusNode<K, V>(false, [right.items[0].key], [], [leaf, right]);

            leaf.parent = root;
            right.parent = root;
            this.root = root;

            return;
        }

        const parent: BPlusNode<K, V> = leaf.parent;

        this.insertChild(parent, parent.children.indexOf(leaf) + 1, right, right.items[0].key);
    }

    /**
     * Splits an overflowing internal node and promotes its middle key.
     * @param node - Internal node whose key count exceeds the degree.
     * @example
     * this.splitInternal(node);
     * @returns Nothing.
     */
    private splitInternal(node: BPlusNode<K, V>): void {
        const middle: number = Math.floor(node.keys.length / 2);
        const separator: K = node.keys[middle];
        const right: BPlusNode<K, V> = new BPlusNode<K, V>(
            false,
            node.keys.slice(middle + 1),
            [],
            node.children.slice(middle + 1),
        );

        node.keys = node.keys.slice(0, middle);
        node.children = node.children.slice(0, middle + 1);
        right.parent = node.parent;

        for (let position: number = 0; position < right.children.length; position += 1) {
            right.children[position].parent = right;
        }

        if (node.parent === (void 0)) {
            const root: BPlusNode<K, V> = new BPlusNode<K, V>(false, [separator], [], [node, right]);

            node.parent = root;
            right.parent = root;
            this.root = root;

            return;
        }

        const parent: BPlusNode<K, V> = node.parent;

        this.insertChild(parent, parent.children.indexOf(node) + 1, right, separator);
    }

    /**
     * Inserts a child and its left separator into an internal node, splitting it when full.
     * @param parent - Internal node that receives the child.
     * @param index - Position of the new child.
     * @param child - Child node to attach.
     * @param separator - Key that separates the previous child from `child`.
     * @example
     * this.insertChild(parent, 1, right, right.firstKey());
     * @returns Nothing.
     */
    private insertChild(parent: BPlusNode<K, V>, index: number, child: BPlusNode<K, V>, separator: K): void {
        parent.keys.splice(index - 1, 0, separator);
        parent.children.splice(index, 0, child);
        child.parent = parent;

        if (parent.keys.length > this.degree) {
            this.splitInternal(parent);
        }
    }

    /**
     * Restores minimum occupancy after a deletion, merging upward while necessary.
     * @param node - Node that may have underflowed.
     * @example
     * this.rebalance(leaf);
     * @returns Nothing.
     */
    private rebalance(node: BPlusNode<K, V>): void {
        let current: BPlusNode<K, V> | void = node;

        while (current !== (void 0)) {
            const parent: BPlusNode<K, V> | void = current.parent;

            if (parent === (void 0)) {
                return;
            }

            const minimum: number = this.minimumOf(current);
            const total: number = current.isLeaf() ? current.items.length : current.children.length;

            if (total >= minimum) {
                return;
            }

            const index: number = parent.children.indexOf(current);
            const left: BPlusNode<K, V> | void = index > 0 ? parent.children[index - 1] : (void 0);

            if (left !== (void 0) && this.canLend(left, minimum)) {
                this.borrowFromLeft(parent, index, current);

                return;
            }

            const right: BPlusNode<K, V> | void =
                index + 1 < parent.children.length ? parent.children[index + 1] : (void 0);

            if (right !== (void 0) && this.canLend(right, minimum)) {
                this.borrowFromRight(parent, index, current);

                return;
            }

            if (left !== (void 0)) {
                this.mergeLeft(parent, index, current);
            } else if (right !== (void 0)) {
                this.mergeRight(parent, index, current);
            } else {
                return;
            }

            current = parent;
        }
    }

    /**
     * Reads the minimum allowed number of keys or children for a node.
     * @param node - Node to inspect.
     * @example
     * const minimum: number = this.minimumOf(node);
     * @returns The minimum item count on a leaf, or child count on an internal node.
     */
    private minimumOf(node: BPlusNode<K, V>): number {
        return node.isLeaf() ? Math.ceil(this.degree / 2) : Math.ceil((this.degree + 1) / 2);
    }

    /**
     * Checks whether a sibling can lend one key or child without underflowing.
     * @param node - Sibling node to inspect.
     * @param minimum - Minimum allowed item or child count.
     * @example
     * const canLend: boolean = this.canLend(sibling, minimum);
     * @returns True when the sibling holds more than the minimum.
     */
    private canLend(node: BPlusNode<K, V>, minimum: number): boolean {
        return node.isLeaf() ? node.items.length > minimum : node.children.length > minimum;
    }

    /**
     * Moves one item or child from the left sibling into the underflowed node.
     * @param parent - Parent of both siblings.
     * @param index - Position of the underflowed node.
     * @param node - Node that receives the borrowed entry.
     * @example
     * this.borrowFromLeft(parent, index, node);
     * @returns Nothing.
     */
    private borrowFromLeft(parent: BPlusNode<K, V>, index: number, node: BPlusNode<K, V>): void {
        const left: BPlusNode<K, V> = parent.children[index - 1];

        if (node.isLeaf()) {
            const moved: Node<K, V> = left.items[left.items.length - 1];

            left.items.pop();
            node.items.unshift(moved);
            parent.keys[index - 1] = node.items[0].key;

            return;
        }

        const movedChild: BPlusNode<K, V> = left.children[left.children.length - 1];
        const movedKey: K = left.keys[left.keys.length - 1];

        left.children.pop();
        left.keys.pop();
        movedChild.parent = node;
        node.children.unshift(movedChild);
        node.keys.unshift(parent.keys[index - 1]);
        parent.keys[index - 1] = movedKey;
    }

    /**
     * Moves one item or child from the right sibling into the underflowed node.
     * @param parent - Parent of both siblings.
     * @param index - Position of the underflowed node.
     * @param node - Node that receives the borrowed entry.
     * @example
     * this.borrowFromRight(parent, index, node);
     * @returns Nothing.
     */
    private borrowFromRight(parent: BPlusNode<K, V>, index: number, node: BPlusNode<K, V>): void {
        const right: BPlusNode<K, V> = parent.children[index + 1];

        if (node.isLeaf()) {
            const moved: Node<K, V> = right.items[0];

            right.items.shift();
            node.items.push(moved);
            parent.keys[index] = right.items[0].key;

            return;
        }

        const movedChild: BPlusNode<K, V> = right.children[0];
        const movedKey: K = right.keys[0];

        right.children.shift();
        right.keys.shift();
        movedChild.parent = node;
        node.children.push(movedChild);
        node.keys.push(parent.keys[index]);
        parent.keys[index] = movedKey;
    }

    /**
     * Merges a node into its left sibling and removes the node from its parent.
     * @param parent - Parent of both siblings.
     * @param index - Position of the node being merged.
     * @param node - Node merged into its left sibling.
     * @example
     * this.mergeLeft(parent, index, node);
     * @returns Nothing.
     */
    private mergeLeft(parent: BPlusNode<K, V>, index: number, node: BPlusNode<K, V>): void {
        const left: BPlusNode<K, V> = parent.children[index - 1];

        if (node.isLeaf()) {
            for (let position: number = 0; position < node.items.length; position += 1) {
                left.items.push(node.items[position]);
            }

            left.next = node.next;
        } else {
            left.keys.push(parent.keys[index - 1]);

            for (let position: number = 0; position < node.keys.length; position += 1) {
                left.keys.push(node.keys[position]);
            }

            for (let position: number = 0; position < node.children.length; position += 1) {
                const child: BPlusNode<K, V> = node.children[position];

                child.parent = left;
                left.children.push(child);
            }
        }

        parent.children.splice(index, 1);
        parent.keys.splice(index - 1, 1);
    }

    /**
     * Merges the right sibling into a node and removes the sibling from the parent.
     * @param parent - Parent of both siblings.
     * @param index - Position of the node that keeps its place.
     * @param node - Node that absorbs its right sibling.
     * @example
     * this.mergeRight(parent, index, node);
     * @returns Nothing.
     */
    private mergeRight(parent: BPlusNode<K, V>, index: number, node: BPlusNode<K, V>): void {
        const right: BPlusNode<K, V> = parent.children[index + 1];

        if (node.isLeaf()) {
            for (let position: number = 0; position < right.items.length; position += 1) {
                node.items.push(right.items[position]);
            }

            node.next = right.next;
        } else {
            node.keys.push(parent.keys[index]);

            for (let position: number = 0; position < right.keys.length; position += 1) {
                node.keys.push(right.keys[position]);
            }

            for (let position: number = 0; position < right.children.length; position += 1) {
                const child: BPlusNode<K, V> = right.children[position];

                child.parent = node;
                node.children.push(child);
            }
        }

        parent.children.splice(index + 1, 1);
        parent.keys.splice(index, 1);
    }

    /**
     * Lowers the tree height while the root has a single child.
     * @example
     * this.collapseRoot();
     * @returns Nothing.
     */
    private collapseRoot(): void {
        while (!this.root.isLeaf() && this.root.children.length === 1) {
            const child: BPlusNode<K, V> = this.root.children[0];

            child.parent = (void 0);
            this.root = child;
        }
    }

    /**
     * Finds the leftmost leaf so an ordered scan can start at the smallest key.
     * @example
     * const leaf = this.leftmost();
     * @returns The leftmost leaf node.
     */
    private leftmost(): BPlusNode<K, V> {
        let node: BPlusNode<K, V> = this.root;

        while (!node.isLeaf()) {
            node = node.children[0];
        }

        return node;
    }
}
