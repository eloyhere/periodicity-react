/**
 * Segment tree node covering the closed index interval `[start, end]`.
 * Type: class.
 * @param start - First index covered by the node.
 * @param end - Last index covered by the node.
 * @param value - Aggregate value stored by the node.
 * @example
 * const root: SegmentNode<number> = new SegmentNode<number>(0, 9, 0);
 */
export class SegmentNode<V> {
    public readonly start: number;
    public readonly end: number;
    public value: V;
    public left: SegmentNode<V> | void;
    public right: SegmentNode<V> | void;

    /**
     * Creates an unattached node over the interval `[start, end]`.
     * @param start - First index covered by the node.
     * @param end - Last index covered by the node.
     * @param value - Aggregate value stored by the node.
     * @example
     * const root: SegmentNode<number> = new SegmentNode<number>(0, 9, 0);
     * @returns A new SegmentNode instance.
     */
    constructor(start: number, end: number, value: V) {
        this.start = start;
        this.end = end;
        this.value = value;
        this.left = (void 0);
        this.right = (void 0);
    }

    /**
     * Checks whether the node covers a single index.
     * @example
     * const leaf: boolean = node.isLeaf();
     * @returns True when `start` equals `end`.
     */
    public isLeaf(): boolean {
        return this.start === this.end;
    }
}
