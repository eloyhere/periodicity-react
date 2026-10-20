import { isFunction, isObject } from "./validation";

export const SynchronizeIterableSymbol: symbol = Symbol.for("SynchronizeIterable");
export const AsynchronizeIterableSymbol: symbol = Symbol.for("AsynchronizeIterable");
export const isIterable: (target: unknown) => target is Iterable<unknown> = (target: unknown): target is Iterable<unknown> =>{
    return isObject(target) && Reflect.has(target, Symbol.iterator) && isFunction(Reflect.get(target, Symbol.iterator));
};
export const isAsyncIterable: (target: unknown) => target is AsyncIterable<unknown> = (target: unknown): target is AsyncIterable<unknown> =>{
    return isObject(target) && Reflect.has(target, Symbol.asyncIterator) && isFunction(Reflect.get(target, Symbol.asyncIterator));
};
export interface SynchronizeIterable<E> extends Iterable<E>{
    [Symbol.iterator](): Generator<E, void, unknown>;
    [SynchronizeIterableSymbol](): Generator<E, void, unknown>;
}
export interface AsynchronizeIterable<E> extends AsyncIterable<E>{
    [Symbol.asyncIterator](): AsyncGenerator<E, void, unknown>;
    [AsynchronizeIterableSymbol](): AsyncGenerator<E, void, unknown>;
}