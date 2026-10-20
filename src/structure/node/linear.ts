import type { Node } from "./node";

/**
 * Doubly linked wrapper around a keyed entry, used by linked lists and hash bucket chains.
 * Type: class.
 * @param item - Entry carried by the node.
 * @example
 * const entry: Node<string, number> = new Node<string, number>("a", 1);
 * const chain: LinearNode<string, number> = new LinearNode<string, number>(entry);
 */
export class LinearNode<K, V> {
    public readonly item: Node<K, V>;
    public previous: LinearNode<K, V> | void;
    public next: LinearNode<K, V> | void;

    /**
     * Creates an unlinked node around `item`.
     * @param item - Entry carried by the node.
     * @example
     * const chain: LinearNode<string, number> = new LinearNode<string, number>(entry);
     * @returns A new LinearNode instance.
     */
    constructor(item: Node<K, V>) {
        this.item = item;
        this.previous = (void 0);
        this.next = (void 0);
    }

    /**
     * Removes the node from its chain by joining its neighbours, then clears both links.
     * @example
     * chain.unlink();
     * @returns Nothing.
     */
    public unlink(): void {
        const previous: LinearNode<K, V> | void = this.previous;
        const next: LinearNode<K, V> | void = this.next;

        if (previous !== (void 0)) {
            previous.next = next;
        }

        if (next !== (void 0)) {
            next.previous = previous;
        }

        this.previous = (void 0);
        this.next = (void 0);
    }
}
