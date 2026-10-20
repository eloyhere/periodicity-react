/**
 * Reusable reduction descriptions for synchronous iterables.
 *
 * A collector separates the mutable accumulation state (`A`) from the final
 * result (`R`), so one description can be reused across many iterations and
 * composed with `collect` or `Collectable`.
 */

import type { BiConsumer, Functional, Supplier } from "../functional";

/**
 * Reduction description that accumulates elements into state `A` and finishes as `R`.
 * Type: interface.
 * Fields: supplier, accumulator, finisher.
 * @example
 * const collector: Collector<number, Array<number>, Array<number>> = Collectors.toArray<number>();
 */
export interface Collector<T, A, R> {
    readonly supplier: Supplier<A>;
    readonly accumulator: BiConsumer<A, T>;
    readonly finisher: Functional<A, R>;
}

/**
 * Folds every element of an iterable through a collector.
 * @param iterable - Source iterable, including `SynchronizeIterable` values.
 * @param collector - Reduction description to apply.
 * @example
 * const values: Array<number> = collect([1, 2, 3], Collectors.toArray<number>());
 * @returns The finished result.
 */
export const collect: <T, A, R>(iterable: Iterable<T>, collector: Collector<T, A, R>) => R = <T, A, R>(
    iterable: Iterable<T>,
    collector: Collector<T, A, R>,
): R => {
    const state: A = collector.supplier();

    for (const element of iterable) {
        collector.accumulator(state, element);
    }

    return collector.finisher(state);
};

/**
 * Built-in collector factories.
 * Type: interface.
 * Fields: toArray, toSet, toMap, counting, joining, groupingBy.
 * @example
 * const values: Array<number> = collect([1, 2, 3], Collectors.toArray<number>());
 */
export interface Collectors {
    toArray: <T>() => Collector<T, Array<T>, Array<T>>;
    toSet: <T>() => Collector<T, Set<T>, Set<T>>;
    toMap: <T, K, V>(
        keyMapper: Functional<T, K>,
        valueMapper: Functional<T, V>,
    ) => Collector<T, Map<K, V>, Map<K, V>>;
    counting: <T>() => Collector<T, Array<bigint>, bigint>;
    joining: (delimiter?: string) => Collector<string, Array<string>, string>;
    groupingBy: <T, K>(classifier: Functional<T, K>) => Collector<T, Map<K, Array<T>>, Map<K, Array<T>>>;
}

/**
 * Built-in collector factories.
 * Type: object.
 * @example
 * const values: Array<number> = collect([1, 2, 3], Collectors.toArray<number>());
 */
export const Collectors: Collectors = {
    /**
     * Collects every element into a new array.
     * @example
     * const collector = Collectors.toArray<number>();
     * @returns A collector whose result is an array of elements.
     */
    toArray: <T>(): Collector<T, Array<T>, Array<T>> => ({
        supplier: (): Array<T> => [],
        accumulator: (state: Array<T>, element: T): void => {
            state.push(element);
        },
        finisher: (state: Array<T>): Array<T> => state,
    }),
    /**
     * Collects the distinct elements into a new set.
     * @example
     * const collector = Collectors.toSet<number>();
     * @returns A collector whose result is a set of distinct elements.
     */
    toSet: <T>(): Collector<T, Set<T>, Set<T>> => ({
        supplier: (): Set<T> => new Set<T>(),
        accumulator: (state: Set<T>, element: T): void => {
            state.add(element);
        },
        finisher: (state: Set<T>): Set<T> => state,
    }),
    /**
     * Collects elements into a map keyed and valued by the supplied mappers.
     * @param keyMapper - Function producing the entry key.
     * @param valueMapper - Function producing the entry value.
     * @example
     * const collector = Collectors.toMap<Item, string, number>(
     *     (item: Item): string => item.id,
     *     (item: Item): number => item.value,
     * );
     * @returns A collector whose result is a map of entries.
     */
    toMap: <T, K, V>(
        keyMapper: Functional<T, K>,
        valueMapper: Functional<T, V>,
    ): Collector<T, Map<K, V>, Map<K, V>> => ({
        supplier: (): Map<K, V> => new Map<K, V>(),
        accumulator: (state: Map<K, V>, element: T): void => {
            state.set(keyMapper(element), valueMapper(element));
        },
        finisher: (state: Map<K, V>): Map<K, V> => state,
    }),
    /**
     * Counts every element into a bigint.
     * @example
     * const collector = Collectors.counting<number>();
     * @returns A collector whose result is the number of elements.
     */
    counting: <T>(): Collector<T, Array<bigint>, bigint> => ({
        supplier: (): Array<bigint> => [0n],
        accumulator: (state: Array<bigint>): void => {
            state[0] += 1n;
        },
        finisher: (state: Array<bigint>): bigint => state[0],
    }),
    /**
     * Joins text elements with a delimiter.
     * @param delimiter - Separator placed between elements; defaults to the empty string.
     * @example
     * const collector = Collectors.joining(", ");
     * @returns A collector whose result is the joined text.
     */
    joining: (delimiter: string = ""): Collector<string, Array<string>, string> => ({
        supplier: (): Array<string> => [],
        accumulator: (state: Array<string>, element: string): void => {
            state.push(element);
        },
        finisher: (state: Array<string>): string => state.join(delimiter),
    }),
    /**
     * Groups elements by a classifier while preserving insertion order.
     * @param classifier - Function producing the group key of an element.
     * @example
     * const collector = Collectors.groupingBy<Item, string>((item: Item): string => item.kind);
     * @returns A collector whose result maps each key to its elements.
     */
    groupingBy: <T, K>(classifier: Functional<T, K>): Collector<T, Map<K, Array<T>>, Map<K, Array<T>>> => ({
        supplier: (): Map<K, Array<T>> => new Map<K, Array<T>>(),
        accumulator: (state: Map<K, Array<T>>, element: T): void => {
            const key: K = classifier(element);
            const group: Array<T> | void = state.get(key);

            if (group === (void 0)) {
                state.set(key, [element]);

                return;
            }

            group.push(element);
        },
        finisher: (state: Map<K, Array<T>>): Map<K, Array<T>> => state,
    }),
};
