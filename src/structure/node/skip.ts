import type { Node } from "./node";

/**
 * Skip-list node carrying an entry and one forward link per level.
 * `next.length` equals the node level, and no parent link is kept.
 * Type: class.
 * @param item - Entry carried by the node.
 * @param level - Number of forward links; determines the node height.
 * @example
 * const entry: Node<string, number> = new Node<string, number>("a", 1);
 * const node: SkipNode<string, number> = new SkipNode<string, number>(entry, 2);
 */
export class SkipNode<K, V> {
    public readonly item: Node<K, V>;
    public readonly next: Array<SkipNode<K, V> | void>;

    /**
     * Creates a node whose forward links are all empty.
     * @param item - Entry carried by the node.
     * @param level - Number of forward links; determines the node height.
     * @example
     * const node: SkipNode<string, number> = new SkipNode<string, number>(entry, 2);
     * @returns A new SkipNode instance.
     */
    constructor(item: Node<K, V>, level: number) {
        this.item = item;
        this.next = new Array<SkipNode<K, V> | void>(level).fill((void 0));
    }

    /**
     * Number of levels spanned by the node.
     * @example
     * const level: number = node.level;
     * @returns The forward-link count.
     */
    public get level(): number {
        return this.next.length;
    }
}
