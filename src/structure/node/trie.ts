/**
 * Trie node whose children are indexed by a character label.
 * Type: class.
 * @param children - Child links keyed by character label.
 * @param value - Value stored at the node, set when a key ends here.
 * @param terminal - Whether the node terminates a stored key.
 * @example
 * const root: TrieNode<number> = new TrieNode<number>();
 */
export class TrieNode<V> {
    public readonly children: Map<string, TrieNode<V>>;
    public value: V | void;
    public terminal: boolean;

    /**
     * Creates an empty trie node with no children and no value.
     * @example
     * const root: TrieNode<number> = new TrieNode<number>();
     * @returns A new TrieNode instance.
     */
    constructor() {
        this.children = new Map<string, TrieNode<V>>();
        this.value = (void 0);
        this.terminal = false;
    }

    /**
     * Checks whether the node terminates a stored key.
     * @example
     * const terminal: boolean = node.isTerminal();
     * @returns True when a key ends at this node.
     */
    public isTerminal(): boolean {
        return this.terminal;
    }
}
