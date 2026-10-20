import type { Comparator } from "../compare";
import type { SynchronizeCollection } from "../collection";

/**
 * Mutable indexed sequence with positional access, insertion and in-place reordering.
 * Type: interface.
 * Fields: get, set, addAt, removeAt, indexOf, lastIndexOf, subList, reverse, sort.
 * @example
 * const list: List<string> = createList<string>();
 * list.add("a");
 * const first: string = list.get(0n);
 */
export interface List<E> extends SynchronizeCollection<E> {
    /**
     * Reads the element at `index`; throws `RangeError` when the index is outside `[0, size())`.
     * @param index - Zero-based position of the element.
     * @example
     * const first: string = list.get(0n);
     * @returns The element stored at `index`.
     */
    get(index: bigint): E;

    /**
     * Replaces the element at `index`; throws `RangeError` when the index is outside `[0, size())`.
     * @param index - Zero-based position of the element.
     * @param element - Replacement element.
     * @example
     * const previous: string = list.set(0n, "b");
     * @returns The element that was replaced.
     */
    set(index: bigint, element: E): E;

    /**
     * Inserts `element` at `index`, shifting later elements to the right; throws `RangeError` when the index is
     * outside `[0, size()]`.
     * @param index - Zero-based insertion position.
     * @param element - Element to insert.
     * @example
     * list.addAt(0n, "b");
     * @returns Nothing.
     */
    addAt(index: bigint, element: E): void;

    /**
     * Removes and returns the element at `index`, shifting later elements to the left; throws `RangeError` when the
     * index is outside `[0, size())`.
     * @param index - Zero-based position of the element.
     * @example
     * const removed: string = list.removeAt(0n);
     * @returns The removed element.
     */
    removeAt(index: bigint): E;

    /**
     * Finds the first position holding an element that is the same value as `element`.
     * @param element - Element to search for.
     * @example
     * const found: bigint = list.indexOf("a");
     * @returns The zero-based position, or `-1n` when the element is absent.
     */
    indexOf(element: E): bigint;

    /**
     * Finds the last position holding an element that is the same value as `element`.
     * @param element - Element to search for.
     * @example
     * const found: bigint = list.lastIndexOf("a");
     * @returns The zero-based position, or `-1n` when the element is absent.
     */
    lastIndexOf(element: E): bigint;

    /**
     * Returns a list containing the elements from `start` (inclusive) to `end` (exclusive); throws `RangeError` when
     * the range is invalid.
     * @param start - Zero-based start position, inclusive.
     * @param end - Zero-based end position, exclusive.
     * @example
     * const part: List<string> = list.subList(0n, 2n);
     * @returns A new list over the requested range.
     */
    subList(start: bigint, end: bigint): List<E>;

    /**
     * Reverses the order of the elements in place.
     * @example
     * list.reverse();
     * @returns Nothing.
     */
    reverse(): void;

    /**
     * Sorts the elements in place, using the natural order when no comparator is supplied.
     * @param comparator - Optional ordering function applied to two elements.
     * @example
     * list.sort();
     * list.sort((first: string, second: string): number => first.localeCompare(second));
     * @returns Nothing.
     */
    sort(comparator?: Comparator<E>): void;
}
