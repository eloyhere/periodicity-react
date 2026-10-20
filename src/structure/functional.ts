
export interface Runnable { 
    (): void;
};

export interface Supplier<R> {
    (): R;
}

export interface Consumer<T> {
    (t: T): void;
}

export interface BiConsumer<T, U> {
    (t: T, u: U): void;
}

export interface TriConsumer<T, U, V> {
    (t: T, u: U, v: V): void;
}

export interface Functional<T, R> {
    (t: T): R;
};

export interface BiFunctional<T, U, R> {
    (t: T, u: U): R;
}

export interface TriFunctional<T, U, V, R> {
    (t: T, u: U, v: V): R;
}

export interface Predicate<T> {
    (t: T): boolean;
}

export interface BiPredicate<T, U> {
    (t: T, u: U): boolean;
}

export interface TriPredicate<T, U, V> {
    (t: T, u: U, v: V): boolean;
}

export interface SynchronizeGenerator<E>{
    (action: Consumer<E> | BiConsumer<E, bigint>, interruption: Predicate<E> | BiPredicate<E, bigint>): void;
}

export interface AsynchronizeGenerator<E>{
    (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void>;
}