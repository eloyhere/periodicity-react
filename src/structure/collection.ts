import type { BiConsumer, Consumer, Predicate } from "./functional";
import type { AsynchronizeIterable, SynchronizeIterable } from "./iterable";
import type { AsynchronizeStream, SynchronizeStream } from "./stream/stream";

export const SynchronizeCollectionSymbol: unique symbol = Symbol.for("SynchronizeCollection");
export const AsynchronizeCollectionSymbol: unique symbol = Symbol.for("AsynchronizeCollection");

export interface SynchronizeCollection<E> extends SynchronizeIterable<E> {
    add(e: E): boolean;
    addAll(c: Iterable<E>): boolean;
    clear(): void;
    contains(e: E): boolean;
    containsAll(c: Iterable<E>): boolean;
    forEach(action: Consumer<E>): void;
    forEach(action: BiConsumer<bigint, E>): void;
    isEmpty(): boolean;
    remove(e: E): boolean;
    removeAll(c: Iterable<E>): boolean;
    removeIf(filter: Predicate<E>): boolean;
    retainAll(c: Iterable<E>): boolean;
    size(): bigint;
    stream(): SynchronizeStream<E>;
    toArray(): E[];
    [SynchronizeCollectionSymbol](): Generator<E, void, unknown>;
}

export interface AsynchronizeCollection<E> extends AsynchronizeIterable<E> {
    add(e: E): Promise<boolean>;
    addAll(c: Iterable<E> | AsyncIterable<E>): Promise<boolean>;
    clear(): Promise<void>;
    contains(e: E): Promise<boolean>;
    containsAll(c: AsyncIterable<E>): Promise<boolean>;
    forEach(action: Consumer<E>): Promise<void>;
    forEach(action: BiConsumer<bigint, E>): Promise<void>;
    isEmpty(): Promise<boolean>;
    remove(e: E): Promise<boolean>;
    removeAll(c: Iterable<E> | AsyncIterable<E>): Promise<boolean>;
    removeIf(filter: Predicate<E>): Promise<boolean>;
    retainAll(c: Iterable<E> | AsyncIterable<E>): Promise<boolean>;
    size(): Promise<bigint>;
    stream(): AsynchronizeStream<E>;
    toArray(): Promise<E[]>;
    [AsynchronizeCollectionSymbol](): AsyncGenerator<E, void, unknown>;
}