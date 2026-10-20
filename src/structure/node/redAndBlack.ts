import type { Node } from "./node";

/**
 * Red-black tree node: a binary node plus the colour flag used by rebalancing.
 * Type: class.
 * @param item - Entry carried by the node.
 * @param red - Whether the node starts red; defaults to true.
 * @example
 * const entry: Node<string, number> = new Node<string, number>("a", 1);
 * const node: RedAndBlackNode<string, number> = new RedAndBlackNode<string, number>(entry);
 */
export class RedAndBlackNode<K, V> {
    public readonly item: Node<K, V>;
    public red: boolean;
    public left: RedAndBlackNode<K, V> | void;
    public right: RedAndBlackNode<K, V> | void;
    public parent: RedAndBlackNode<K, V> | void;

    /**
     * Creates an unattached node around `item`.
     * @param item - Entry carried by the node.
     * @param red - Whether the node starts red; defaults to true.
     * @example
     * const node: RedAndBlackNode<string, number> = new RedAndBlackNode<string, number>(entry, false);
     * @returns A new RedAndBlackNode instance.
     */
    constructor(item: Node<K, V>, red?: boolean) {
        this.item = item;
        this.red = red ?? true;
        this.left = (void 0);
        this.right = (void 0);
        this.parent = (void 0);
    }
}
