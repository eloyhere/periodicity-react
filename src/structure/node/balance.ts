import type { Node } from "./node";

/**
 * AVL tree node carrying a keyed entry, child links, a parent link and a cached height.
 * Type: class.
 * @param item - Entry carried by the node.
 * @example
 * const entry: Node<string, number> = new Node<string, number>("a", 1);
 * const node: BalanceNode<string, number> = new BalanceNode<string, number>(entry);
 */
export class BalanceNode<K, V> {
    public readonly item: Node<K, V>;
    public left: BalanceNode<K, V> | void;
    public right: BalanceNode<K, V> | void;
    public parent: BalanceNode<K, V> | void;
    public height: number;

    /**
     * Creates an unattached leaf around `item`.
     * @param item - Entry carried by the node.
     * @example
     * const node: BalanceNode<string, number> = new BalanceNode<string, number>(entry);
     * @returns A new BalanceNode instance.
     */
    constructor(item: Node<K, V>) {
        this.item = item;
        this.left = (void 0);
        this.right = (void 0);
        this.parent = (void 0);
        this.height = 1;
    }

    /**
     * Recomputes the cached height from the current children.
     * @example
     * node.updateHeight();
     * @returns Nothing.
     */
    public updateHeight(): void {
        const leftHeight: number = this.left === (void 0) ? 0 : this.left.height;
        const rightHeight: number = this.right === (void 0) ? 0 : this.right.height;

        this.height = 1 + Math.max(leftHeight, rightHeight);
    }

    /**
     * Reports the height difference between the two subtrees.
     * @example
     * const factor: number = node.balanceFactor();
     * @returns The left subtree height minus the right subtree height.
     */
    public balanceFactor(): number {
        const leftHeight: number = this.left === (void 0) ? 0 : this.left.height;
        const rightHeight: number = this.right === (void 0) ? 0 : this.right.height;

        return leftHeight - rightHeight;
    }

    /**
     * Checks whether the node has no children.
     * @example
     * const leaf: boolean = node.isLeaf();
     * @returns True when both child links are empty.
     */
    public isLeaf(): boolean {
        return this.left === (void 0) && this.right === (void 0);
    }
}
