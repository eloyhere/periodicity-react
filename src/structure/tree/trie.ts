import { TrieNode } from "../node";

/**
 * Prefix tree storing one value per terminated word.
 * Empty strings are valid words and are terminated at the root.
 * Type: class.
 * @example
 * const trie: Trie<string> = new Trie<string>();
 */
export class Trie<V> {
    private root: TrieNode<V>;
    private count: number;

    /**
     * Creates an empty trie.
     * @example
     * const trie: Trie<string> = new Trie<string>();
     * @returns A new Trie instance.
     */
    constructor() {
        this.root = new TrieNode<V>();
        this.count = 0;
    }

    /**
     * Number of terminated words.
     * @example
     * const size: number = trie.size;
     * @returns Number of stored words.
     */
    public get size(): number {
        return this.count;
    }

    /**
     * Inserts `word` with `value`, replacing the value of an existing word.
     * @param word - Word to insert; an empty string is accepted.
     * @param value - Value associated with the word.
     * @example
     * trie.insert("tea", 1);
     * @returns This instance, for chaining.
     */
    public insert(word: string, value: V): this {
        let node: TrieNode<V> = this.root;

        for (let index: number = 0; index < word.length; index += 1) {
            const label: string = word[index];
            let child: TrieNode<V> | void = node.children.get(label);

            if (child === (void 0)) {
                child = new TrieNode<V>();
                node.children.set(label, child);
            }

            node = child;
        }

        if (!node.isTerminal()) {
            node.terminal = true;
            this.count += 1;
        }

        node.value = value;

        return this;
    }

    /**
     * Reads the value stored for `word`.
     * @param word - Word to look up.
     * @example
     * const value: number | void = trie.get("tea");
     * @returns The stored value, or (void 0) when the word is absent.
     */
    public get(word: string): V | void {
        const node: TrieNode<V> | void = this.locate(word);

        if (node === (void 0) || !node.isTerminal()) {
            return (void 0);
        }

        return node.value;
    }

    /**
     * Checks whether `word` is stored as a terminated word.
     * @param word - Word to look up.
     * @example
     * const present: boolean = trie.has("tea");
     * @returns True when the word is stored.
     */
    public has(word: string): boolean {
        const node: TrieNode<V> | void = this.locate(word);

        return node !== (void 0) && node.isTerminal();
    }

    /**
     * Removes `word` and prunes branches that no longer lead to a word.
     * @param word - Word to remove.
     * @example
     * const removed: boolean = trie.delete("tea");
     * @returns True when the word was removed.
     */
    public delete(word: string): boolean {
        const labels: string[] = [];
        const path: Array<TrieNode<V>> = [this.root];
        let node: TrieNode<V> = this.root;

        for (let index: number = 0; index < word.length; index += 1) {
            const label: string = word[index];
            const child: TrieNode<V> | void = node.children.get(label);

            if (child === (void 0)) {
                return false;
            }

            labels.push(label);
            path.push(child);
            node = child;
        }

        if (!node.isTerminal()) {
            return false;
        }

        node.terminal = false;
        node.value = (void 0);
        this.count -= 1;

        for (let index: number = path.length - 1; index > 0; index -= 1) {
            const current: TrieNode<V> = path[index];

            if (current.isTerminal() || current.children.size > 0) {
                break;
            }

            path[index - 1].children.delete(labels[index - 1]);
        }

        return true;
    }

    /**
     * Removes every word and resets the trie to an empty root.
     * @example
     * trie.clear();
     * @returns Nothing.
     */
    public clear(): void {
        this.root = new TrieNode<V>();
        this.count = 0;
    }

    /**
     * Returns every word in lexicographic order.
     * @example
     * const keys: string[] = trie.keys();
     * @returns A sorted snapshot of words.
     */
    public keys(): string[] {
        return this.entries().map((entry: readonly [string, V]): string => entry[0]);
    }

    /**
     * Returns every value in lexicographic word order.
     * @example
     * const values: number[] = trie.values();
     * @returns A snapshot of values.
     */
    public values(): V[] {
        return this.entries().map((entry: readonly [string, V]): V => entry[1]);
    }

    /**
     * Returns every word and value in lexicographic order.
     * @example
     * const entries: Array<readonly [string, number]> = trie.entries();
     * @returns A sorted snapshot of word-value pairs.
     */
    public entries(): Array<readonly [string, V]> {
        const result: Array<readonly [string, V]> = [];

        this.collect(this.root, "", result);

        return result;
    }

    /**
     * Returns every word that begins with `prefix`.
     * @param prefix - Prefix to expand; an empty string matches every word.
     * @example
     * const words: string[] = trie.startsWith("te");
     * @returns Matching words in lexicographic order.
     */
    public startsWith(prefix: string): string[] {
        const node: TrieNode<V> | void = this.locate(prefix);

        if (node === (void 0)) {
            return [];
        }

        const result: Array<readonly [string, V]> = [];

        this.collect(node, prefix, result);

        return result.map((entry: readonly [string, V]): string => entry[0]);
    }

    /**
     * Iterates word-value pairs in lexicographic order.
     * @example
     * for (const entry of trie) {
     *     const word: string = entry[0];
     * }
     * @returns An iterator over mutable word-value pairs.
     */
    public [Symbol.iterator](): IterableIterator<[string, V]> {
        const result: Array<[string, V]> = this.entries().map(
            (entry: readonly [string, V]): [string, V] => [entry[0], entry[1]],
        );

        return result[Symbol.iterator]();
    }

    /**
     * Follows `word` from the root without checking termination.
     * @param word - Word to follow.
     * @example
     * const node = this.locate("tea");
     * @returns The final node, or (void 0) when the path is absent.
     */
    private locate(word: string): TrieNode<V> | void {
        let node: TrieNode<V> = this.root;

        for (let index: number = 0; index < word.length; index += 1) {
            const child: TrieNode<V> | void = node.children.get(word[index]);

            if (child === (void 0)) {
                return (void 0);
            }

            node = child;
        }

        return node;
    }

    /**
     * Depth-first collects terminated words below `node` in lexicographic order.
     * @param node - Subtree root to scan.
     * @param prefix - Word spelled by the path to `node`.
     * @param result - Array that receives word-value pairs.
     * @example
     * this.collect(this.root, "", result);
     * @returns Nothing.
     */
    private collect(node: TrieNode<V>, prefix: string, result: Array<readonly [string, V]>): void {
        const nodes: Array<TrieNode<V>> = [node];
        const prefixes: string[] = [prefix];

        while (nodes.length > 0) {
            const current: TrieNode<V> = nodes[nodes.length - 1];
            const currentPrefix: string = prefixes[prefixes.length - 1];

            nodes.pop();
            prefixes.pop();

            if (current.isTerminal()) {
                result.push([currentPrefix, current.value as V] as const);
            }

            const labels: string[] = Array.from(current.children.keys()).sort();

            for (let index: number = labels.length - 1; index >= 0; index -= 1) {
                const child: TrieNode<V> | void = current.children.get(labels[index]);

                if (child === (void 0)) {
                    continue;
                }

                nodes.push(child);
                prefixes.push(`${currentPrefix}${labels[index]}`);
            }
        }
    }
}
