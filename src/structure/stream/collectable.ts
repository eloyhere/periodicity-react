/**
 * Adapter that gives any synchronous iterable a `collect` operation.
 */

import type { BiConsumer, BiPredicate, Consumer, Predicate } from "../functional";
import type { SynchronizeIterable } from "../iterable";

/**
 * Synchronous iterable that can fold itself through a collector.
 * Type: interface.
 * Fields: collect, [Symbol.iterator], [SynchronizeIterableSymbol].
 * @example
 * const values: Collectable<number> = collectable([1, 2, 3]);
 * const array: Array<number> = values.collect(Collectors.toArray<number>());
 */
export interface SynchronizeCollectable<E> extends SynchronizeIterable<E> {
    allMatch(predicate: Predicate<E>): boolean;
    allMatch(prediacte: BiPredicate<E, bigint>): boolean;
    anyMatch(predicate: Predicate<E>): boolean;
    anyMatch(prediacte: BiPredicate<E, bigint>): boolean;
    
    forEach(action: Consumer<E>): void;
    forEach(action: BiConsumer<E, bigint>): void;

    noneMatch(predicate: Predicate<E>): boolean;
    noneMatch(prediacte: BiPredicate<E, bigint>): boolean;

    toArray(): Array<E>;

}

export interface AsynchronizeCollectable<E> extends SynchronizeIterable<E> {
    allMatch(predicate: Predicate<E>): Promise<boolean>;
    allMatch(prediacte: BiPredicate<E, bigint>): Promise<boolean>;
    anyMatch(predicate: Predicate<E>): Promise<boolean>;
    anyMatch(prediacte: BiPredicate<E, bigint>): Promise<boolean>;
    
    forEach(action: Consumer<E>): Promise<void>;
    forEach(action: BiConsumer<E, bigint>): Promise<void>;

    noneMatch(predicate: Predicate<E>): Promise<boolean>;
    noneMatch(prediacte: BiPredicate<E, bigint>): Promise<boolean>;

    toArray(): Array<E>;

}