import type { SynchronizeCollection } from "../collection";

/**
 * Mutable mathematical set with membership-based algebra.
 * Type: interface.
 * Fields: union, intersect, difference, isSubsetOf.
 * @example
 * const set: Set<string> = createSet<string>();
 * set.add("a");
 * const both: Set<string> = set.union(["b"]);
 */
export interface Set<E> extends SynchronizeCollection<E> {
    /**
     * Returns a new set containing every element of this set and of `other`.
     * @param other - Iterable supplying the additional elements.
     * @example
     * const combined: Set<string> = set.union(["b", "c"]);
     * @returns A new set with the combined elements.
     */
    union(other: Iterable<E>): Set<E>;

    /**
     * Returns a new set containing the elements present in both this set and `other`.
     * @param other - Iterable supplying the elements to compare against.
     * @example
     * const shared: Set<string> = set.intersect(["a", "b"]);
     * @returns A new set with the shared elements.
     */
    intersect(other: Iterable<E>): Set<E>;

    /**
     * Returns a new set containing the elements of this set that are absent from `other`.
     * @param other - Iterable supplying the elements to exclude.
     * @example
     * const remaining: Set<string> = set.difference(["a"]);
     * @returns A new set with the remaining elements.
     */
    difference(other: Iterable<E>): Set<E>;

    /**
     * Checks whether every element of this set is present in `other`.
     * @param other - Iterable supplying the elements to compare against.
     * @example
     * const subset: boolean = set.isSubsetOf(["a", "b"]);
     * @returns True when this set is a subset of `other`.
     */
    isSubsetOf(other: Iterable<E>): boolean;
}
