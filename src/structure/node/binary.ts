import type { Node } from "./node";

/**
 * Binary tree node carrying a keyed entry plus left, right and parent links.
 * Type: class.
 * @param item - Entry carried by the node.
 * @example
 * const entry: Node<string, number> = new Node<string, number>("a", 1);
 * const root: BinaryNode<string, number> = new BinaryNode<string, number>(entry);
 */
export class BinaryNode<K, V> {
    public readonly item: Node<K, V>;
    public left: BinaryNode<K, V> | void;
    public right: BinaryNode<K, V> | void;
    public parent: BinaryNode<K, V> | void;

    /**
     * Creates an unattached node around `item`.
     * @param item - Entry carried by the node.
     * @example
     * const root: BinaryNode<string, number> = new BinaryNode<string, number>(entry);
     * @returns A new BinaryNode instance.
     */
    constructor(item: Node<K, V>) {
        this.item = item;
        this.left = (void 0);
        this.right = (void 0);
        this.parent = (void 0);
    }

    /**
     * Checks whether the node has no children.
     * @example
     * const leaf: boolean = root.isLeaf();
     * @returns True when both child links are empty.
     */
    public isLeaf(): boolean {
        return this.left === (void 0) && this.right === (void 0);
    }
}
