// `useHash` is a pure hashing helper, not a React Hook; the local alias keeps the
// react-hooks plugin from mistaking it for one.
import { useHash as computeHash } from "../hash/hash";
import type { Hash } from "../hash/hash";

/**
 * Keyed entry that caches its hash for the node layers built on top of it.
 * Type: class.
 * @param key - Key stored by the entry.
 * @param value - Value stored by the entry.
 * @param hash - Precomputed hash; defaults to `useHash(key)`.
 * @example
 * const node: Node<string, number> = new Node<string, number>("a", 1);
 */
export class Node<K, V> {
    public readonly key: K;
    public value: V;
    public readonly hash: Hash;

    /**
     * Creates a keyed entry and caches its hash.
     * @param key - Key stored by the entry.
     * @param value - Value stored by the entry.
     * @param hash - Precomputed hash; defaults to `useHash(key)`.
     * @example
     * const node: Node<string, number> = new Node<string, number>("a", 1);
     * @returns A new Node instance.
     */
    constructor(key: K, value: V, hash?: Hash) {
        this.key = key;
        this.value = value;
        this.hash = hash ?? computeHash(key);
    }

    /**
     * Checks whether `key` is this entry's key, using `Object.is` so that `NaN` matches `NaN`.
     * @param key - Key to compare against.
     * @example
     * const same: boolean = node.is("a");
     * @returns True when both keys are the same value.
     */
    public is(key: K): boolean {
        return Object.is(this.key, key);
    }

    /**
     * Checks whether `hash` is this entry's cached hash, using `Object.is`.
     * @param hash - Hash to compare against.
     * @example
     * const same: boolean = node.isHash(node.hash);
     * @returns True when both hashes are equal.
     */
    public isHash(hash: Hash): boolean {
        return Object.is(this.hash, hash);
    }

    /**
     * Reads the entry as a read-only key/value pair.
     * @example
     * const entry: readonly [string, number] = node.toEntry();
     * @returns The key and value as a read-only tuple.
     */
    public toEntry(): readonly [K, V] {
        return [this.key, this.value];
    }
}
