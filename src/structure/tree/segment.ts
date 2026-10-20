import { SegmentNode } from "../node";

/**
 * Segment tree over a numeric array, supporting point updates and closed-interval sums.
 * Type: class.
 * @param values - Initial numbers; an empty array creates an empty tree.
 * @example
 * const tree: SegmentTree = new SegmentTree([1, 2, 3]);
 */
export class SegmentTree {
    private root: SegmentNode<number> | void;
    private count: number;

    /**
     * Builds a segment tree from `values`.
     * @param values - Initial numbers; an empty array creates an empty tree.
     * @example
     * const tree: SegmentTree = new SegmentTree([1, 2, 3]);
     * @returns A new SegmentTree instance.
     */
    constructor(values: number[]) {
        this.count = values.length;
        this.root = this.count === 0 ? (void 0) : this.build(values, 0, values.length - 1);
    }

    /**
     * Number of covered indices.
     * @example
     * const size: number = tree.size;
     * @returns Number of values in the tree.
     */
    public get size(): number {
        return this.count;
    }

    /**
     * Replaces the value at `index`.
     * @param index - Zero-based index to replace.
     * @param value - New value for the index.
     * @example
     * tree.update(1, 10);
     * @returns Nothing.
     */
    public update(index: number, value: number): void {
        if (!Number.isInteger(index) || index < 0 || index >= this.count) {
            throw new RangeError(`Index ${index} is out of bounds.`);
        }

        const root: SegmentNode<number> | void = this.root;

        if (root === (void 0)) {
            throw new RangeError("The segment tree is empty.");
        }

        this.assign(root, index, value);
    }

    /**
     * Sums the values in the closed interval `[start, end]`.
     * @param start - First index of the interval.
     * @param end - Last index of the interval.
     * @example
     * const total: number = tree.query(0, 2);
     * @returns The sum of covered values, or 0 when `start` is greater than `end`.
     */
    public query(start: number, end: number): number {
        if (this.count === 0) {
            throw new RangeError("The segment tree is empty.");
        }

        if (
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < 0 ||
            end >= this.count
        ) {
            throw new RangeError(`Interval [${start}, ${end}] is out of bounds.`);
        }

        if (start > end) {
            return 0;
        }

        const root: SegmentNode<number> | void = this.root;

        if (root === (void 0)) {
            throw new RangeError("The segment tree is empty.");
        }

        return this.sum(root, start, end);
    }

    /**
     * Removes every value; the tree becomes empty.
     * @example
     * tree.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.root = (void 0);
        this.count = 0;
    }

    /**
     * Recursively builds the node covering `[start, end]`.
     * @param values - Source values.
     * @param start - First index covered by the node.
     * @param end - Last index covered by the node.
     * @example
     * const root = this.build(values, 0, values.length - 1);
     * @returns The built subtree root.
     */
    private build(values: number[], start: number, end: number): SegmentNode<number> {
        if (start === end) {
            return new SegmentNode<number>(start, end, values[start]);
        }

        const middle: number = Math.floor((start + end) / 2);
        const node: SegmentNode<number> = new SegmentNode<number>(start, end, 0);
        const left: SegmentNode<number> = this.build(values, start, middle);
        const right: SegmentNode<number> = this.build(values, middle + 1, end);

        node.left = left;
        node.right = right;
        node.value = left.value + right.value;

        return node;
    }

    /**
     * Recursively writes `value` at `index` and refreshes aggregate sums.
     * @param node - Subtree root to descend.
     * @param index - Index to replace.
     * @param value - New value for the index.
     * @example
     * this.assign(root, 1, 10);
     * @returns Nothing.
     */
    private assign(node: SegmentNode<number>, index: number, value: number): void {
        if (node.isLeaf()) {
            node.value = value;

            return;
        }

        const left: SegmentNode<number> | void = node.left;
        const right: SegmentNode<number> | void = node.right;

        if (left === (void 0) || right === (void 0)) {
            throw new Error("A segment tree node is missing a child.");
        }

        if (index <= left.end) {
            this.assign(left, index, value);
        } else {
            this.assign(right, index, value);
        }

        node.value = left.value + right.value;
    }

    /**
     * Recursively sums the part of `[start, end]` covered by `node`.
     * @param node - Subtree root to inspect.
     * @param start - First index of the interval.
     * @param end - Last index of the interval.
     * @example
     * const total = this.sum(root, 0, 2);
     * @returns The sum of covered values.
     */
    private sum(node: SegmentNode<number>, start: number, end: number): number {
        if (start <= node.start && node.end <= end) {
            return node.value;
        }

        const left: SegmentNode<number> | void = node.left;
        const right: SegmentNode<number> | void = node.right;

        if (left === (void 0) || right === (void 0)) {
            return node.value;
        }

        const middle: number = left.end;

        if (end <= middle) {
            return this.sum(left, start, end);
        }

        if (start > middle) {
            return this.sum(right, start, end);
        }

        return this.sum(left, start, middle) + this.sum(right, middle + 1, end);
    }
}
