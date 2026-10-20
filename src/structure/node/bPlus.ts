import type { Node } from "./node";

/**
 * B+ tree node: leaves hold entries through `items`, internal nodes hold `keys` and `children`.
 * The `next` link chains leaf nodes for ordered scans.
 * Type: class.
 * @param leaf - Whether the node is a leaf.
 * @param keys - Separator keys of an internal node; defaults to an empty array.
 * @param items - Entries of a leaf node; defaults to an empty array.
 * @param children - Child links of an internal node; defaults to an empty array.
 * @example
 * const leaf: BPlusNode<string, number> = new BPlusNode<string, number>(true);
 * const internal: BPlusNode<string, number> = new BPlusNode<string, number>(false, ["b"]);
 */
export class BPlusNode<K, V> {
    public readonly leaf: boolean;
    public keys: K[];
    public items: Array<Node<K, V>>;
    public children: Array<BPlusNode<K, V>>;
    public parent: BPlusNode<K, V> | void;
    public next: BPlusNode<K, V> | void;

    /**
     * Creates an unattached node in the requested role.
     * @param leaf - Whether the node is a leaf.
     * @param keys - Separator keys of an internal node; defaults to an empty array.
     * @param items - Entries of a leaf node; defaults to an empty array.
     * @param children - Child links of an internal node; defaults to an empty array.
     * @example
     * const leaf: BPlusNode<string, number> = new BPlusNode<string, number>(true, [], [entry]);
     * @returns A new BPlusNode instance.
     */
    constructor(
        leaf: boolean,
        keys?: K[],
        items?: Array<Node<K, V>>,
        children?: Array<BPlusNode<K, V>>,
    ) {
        this.leaf = leaf;
        this.keys = keys ?? [];
        this.items = items ?? [];
        this.children = children ?? [];
        this.parent = (void 0);
        this.next = (void 0);
    }

    /**
     * Checks whether the node is a leaf.
     * @example
     * const leaf: boolean = node.isLeaf();
     * @returns True when the node stores entries instead of children.
     */
    public isLeaf(): boolean {
        return this.leaf;
    }

    /**
     * Reads the first key held by the node: the first entry key on a leaf, otherwise the first separator key.
     * @example
     * const first = node.firstKey();
     * @returns The first key, or (void 0) when the node holds no key.
     */
    public firstKey(): K | void {
        if (this.leaf) {
            return this.items.length === 0 ? (void 0) : this.items[0].key;
        }

        return this.keys.length === 0 ? (void 0) : this.keys[0];
    }

    /**
     * Reads the last key held by the node: the last entry key on a leaf, otherwise the last separator key.
     * @example
     * const last = node.lastKey();
     * @returns The last key, or (void 0) when the node holds no key.
     */
    public lastKey(): K | void {
        if (this.leaf) {
            return this.items.length === 0 ? (void 0) : this.items[this.items.length - 1].key;
        }

        return this.keys.length === 0 ? (void 0) : this.keys[this.keys.length - 1];
    }
}
