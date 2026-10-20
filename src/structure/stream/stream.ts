/**
 * Push-based streams for synchronous and asynchronous iteration.
 *
 * A stream wraps a generator callback that feeds every element to a consumer.
 * Operators compose those callbacks, so elements travel from the source to the
 * consumer without intermediate arrays being built.
 */

import type {
    AsynchronizeGenerator,
    BiConsumer,
    BiFunctional,
    BiPredicate,
    Consumer,
    Functional,
    Predicate,
    SynchronizeGenerator,
} from "../functional";
import type { AsynchronizeIterable, SynchronizeIterable } from "../iterable";
import { AsynchronizeIterableSymbol, isAsyncIterable, isIterable, SynchronizeIterableSymbol } from "../iterable";
import { isFunction, isObject } from "../validation";

export const SynchronizeStreamSymbol: unique symbol = Symbol.for("SynchronizeStream");
export const AsynchronizeStreamSymbol: unique symbol = Symbol.for("AsynchronizeStream");

/**
 * Lazy synchronous stream of elements.
 * Type: interface.
 * Fields: concatenate, distinct, dropWhile, filter, flatMap, limit, map, peek, redirect, skip, sub, takeWhile,
 * toArray, translate, [Symbol.iterator], [SynchronizeStreamSymbol].
 * @example
 * const stream: SynchronizeStream<number> = SynchronizeStream(1, 2, 3).map((value: number): number => value * 2);
 */
export interface SynchronizeStream<E> extends SynchronizeIterable<E> {
    concatenate(other: SynchronizeStream<E>): SynchronizeStream<E>;
    concatenate(other: Iterable<E>): SynchronizeStream<E>;
    concatenate(other: SynchronizeIterable<E>): SynchronizeStream<E>;
    distinct(): SynchronizeStream<E>;
    dropWhile(predicate: Predicate<E>): SynchronizeStream<E>;
    filter(predicate: Predicate<E>): SynchronizeStream<E>;
    flatMap<R>(mapper: Functional<E, Iterable<R>>): SynchronizeStream<R>;
    limit(maxSize: bigint): SynchronizeStream<E>;
    map(mapper: Functional<E, E>): SynchronizeStream<E>;
    map<R>(mapper: Functional<E, R>): SynchronizeStream<R>;
    peek(action: Consumer<E>): SynchronizeStream<E>;
    peek(action: BiConsumer<E, bigint>): SynchronizeStream<E>;
    redirect(redirector: BiFunctional<E, bigint, bigint>): SynchronizeStream<E>;
    skip(n: bigint): SynchronizeStream<E>;
    sub(start: bigint, end: bigint): SynchronizeStream<E>;
    [SynchronizeStreamSymbol](): Generator<E, void, unknown>;
    takeWhile(predicate: Predicate<E>): SynchronizeStream<E>;
    toArray(): Array<E>;
    translate(offset: bigint): SynchronizeStream<E>;
}

/**
 * Checks whether a value is a synchronous stream.
 * @param target - Value to inspect.
 * @example
 * const result: boolean = isSynchronizeStream(value);
 * @returns True when the value carries a synchronous stream brand method.
 */
export const isSynchronizeStream: (target: unknown) => target is SynchronizeStream<unknown> = (
    target: unknown,
): target is SynchronizeStream<unknown> =>
    isObject(target) &&
    Reflect.has(target, SynchronizeStreamSymbol) &&
    isFunction(Reflect.get(target, SynchronizeStreamSymbol));

/**
 * Factory for synchronous streams.
 * Type: interface.
 * Fields: iterate, text.
 * @example
 * const stream: SynchronizeStream<number> = SynchronizeStream(1, 2, 3);
 */
export interface SynchronizeStreamConstructor {
    <E>(...elements: E[]): SynchronizeStream<E>;
    iterate<E>(iterable: Iterable<E>): SynchronizeStream<E>;
    iterate<E>(iterable: Generator<E, void, unknown>): SynchronizeStream<E>;
    iterate<E>(iterable: SynchronizeIterable<E>): SynchronizeStream<E>;
    text(text: string): SynchronizeStream<string>;
    text(text: string, delimiter: string): SynchronizeStream<string>;
}

/**
 * Default push-based implementation of `SynchronizeStream`.
 * Type: class.
 * @param generator - Push generator that drives the stream.
 * @example
 * const stream = new SynchronizeExecution<number>((action: BiConsumer<number, bigint>): void => {
 *     action(1, 0n);
 * });
 */
class SynchronizeExecution<E> implements SynchronizeStream<E> {
    private readonly generator: SynchronizeGenerator<E>;

    /**
     * Creates a new SynchronizeExecution.
     * @param generator - Push generator that drives the stream.
     * @example
     * const stream = new SynchronizeExecution<number>((action: BiConsumer<number, bigint>): void => {
     *     action(1, 0n);
     * });
     * @returns A new instance.
     */
    public constructor(generator: SynchronizeGenerator<E>) {
        this.generator = generator;
    }

    concatenate(other: SynchronizeStream<E>): SynchronizeStream<E>;
    concatenate(other: Iterable<E>): SynchronizeStream<E>;
    concatenate(other: SynchronizeIterable<E>): SynchronizeStream<E>;
    concatenate(other: SynchronizeStream<E> | SynchronizeIterable<E> | Iterable<E>): SynchronizeStream<E> {
        if (isIterable(other)) {
            let count: bigint = 0n;
            return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
                this.generator((element: E): void => {
                    action(element, count);
                    count++;
                }, interruption);
                for (const element of other) {
                    action(element, count);
                    count++;
                }
            });
        }
        throw new TypeError("Must be an iterable.");
    }

    /**
     * Drops repeated elements, keeping the first occurrence.
     * @example
     * const unique = SynchronizeStream(1, 2, 1).distinct();
     * @returns A stream of distinct elements.
     */
    public distinct(): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            const seen: Set<E> = new Set<E>();
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (seen.has(element)) {
                    return;
                }

                seen.add(element);
                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Drops leading elements while the predicate holds, then emits the rest.
     * @param predicate - Test applied until the first false result.
     * @example
     * const rest = stream.dropWhile((value: number): boolean => value < 3);
     * @returns A stream without the matching prefix.
     */
    public dropWhile(predicate: Predicate<E>): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let dropping: boolean = true;
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (dropping && predicate(element)) {
                    return;
                }

                dropping = false;
                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Keeps the elements that satisfy the predicate.
     * @param predicate - Test applied to every element.
     * @example
     * const odd = stream.filter((value: number): boolean => value % 2 === 1);
     * @returns A stream of matching elements.
     */
    public filter(predicate: Predicate<E>): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (!predicate(element)) {
                    return;
                }

                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Maps every element to an iterable and emits their elements in order.
     * @param mapper - Function returning the iterable whose elements are emitted.
     * @example
     * const pair = stream.flatMap((value: number): Array<number> => [value, -value]);
     * @returns A stream of flattened elements.
     */
    public flatMap<R>(mapper: Functional<E, Iterable<R>>): SynchronizeStream<R> {
        return new SynchronizeExecution<R>((action: BiConsumer<R, bigint>, interruption: BiPredicate<R, bigint>): void => {
            let count: bigint = 0n;
            let stopped: boolean = false;

            this.generator((element: E): void => {
                if (stopped) {
                    return;
                }

                for (const element1 of mapper(element)) {
                    if (stopped) {
                        return;
                    }

                    if (interruption(element1, count)) {
                        stopped = true;

                        return;
                    }

                    action(element1, count);
                    count++;
                }
            }, (): boolean => stopped);
        });
    }

    /**
     * Emits at most a fixed number of leading elements.
     * @param maxSize - Maximum number of elements to emit; zero or less emits nothing.
     * @example
     * const firstTwo = stream.limit(2n);
     * @returns A stream truncated to the limit.
     */
    public limit(maxSize: bigint): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (count >= maxSize) {
                    return;
                }

                action(element, count);
                count++;
            }, (element: E, index: bigint): boolean => count >= maxSize || interruption(element, index));
        });
    }

    /**
     * Transforms every element.
     * @param mapper - Transform applied to each element.
     * @example
     * const doubled = stream.map((value: number): number => value * 2);
     * @returns A stream of mapped elements.
     */
    public map<R>(mapper: Functional<E, R>): SynchronizeStream<R> {
        return new SynchronizeExecution<R>((action: BiConsumer<R, bigint>, interruption: BiPredicate<R, bigint>): void => {
            let count: bigint = 0n;
            let stopped: boolean = false;

            this.generator((element: E): void => {
                if (stopped) {
                    return;
                }

                const value: R = mapper(element);

                if (interruption(value, count)) {
                    stopped = true;

                    return;
                }

                action(value, count);
                count++;
            }, (): boolean => stopped);
        });
    }

    /**
     * Runs a side effect for every element before it is emitted.
     * @param action - Side effect executed for each element.
     * @example
     * const logged = stream.peek((value: number): void => console.log(value));
     * @returns A stream of the original elements.
     */
    public peek(action: Consumer<E>): SynchronizeStream<E>;
    public peek(action: BiConsumer<E, bigint>): SynchronizeStream<E>;
    public peek(action: Consumer<E> | BiConsumer<E, bigint>): SynchronizeStream<E> {
        if (isFunction(action)) {
            return new SynchronizeExecution<E>((action1: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
                this.generator((element: E, index: bigint): void => {
                    action(element, index);
                    action1(element, index);
                }, interruption);
            });
        }
        throw new TypeError("Must be an iterable.");
    }

    /**
     * Remaps the internal index passed downstream; the elements are unchanged.
     *
     * The index belongs to the push pipeline and is never exposed to consumers,
     * so the resulting stream yields the same elements in the same order.
     * @param redirector - Function mapping an element and index to a new index.
     * @example
     * const reindexed = stream.redirect((value: number, index: bigint): bigint => index + 1n);
     * @returns A stream with redirected internal indexes.
     */
    public redirect(redirector: BiFunctional<E, bigint, bigint>): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            this.generator((element: E): void => {
                action(element, redirector(element, count));
                count++;
            }, (element: E, index: bigint): boolean => interruption(element, redirector(element, index)));
        });
    }

    /**
     * Discards a fixed number of leading elements.
     * @param n - Number of leading elements to discard; zero or less discards nothing.
     * @example
     * const rest = stream.skip(2n);
     * @returns A stream without the skipped prefix.
     */
    public skip(n: bigint): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (count < n) {
                    count++;

                    return;
                }

                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Emits the elements inside a half-open index window.
     * @param start - First index of the window; values below zero behave as zero.
     * @param end - Exclusive end index; when it is not greater than `start` the window is empty.
     * @example
     * const window = stream.sub(1n, 3n);
     * @returns A stream over the window.
     */
    public sub(start: bigint, end: bigint): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (count >= end) {
                    return;
                }

                if (count >= start) {
                    action(element, count);
                }

                count++;
            }, (element: E, index: bigint): boolean => count >= end || interruption(element, index));
        });
    }

    /**
     * Emits leading elements while the predicate holds.
     * @param predicate - Test applied until the first false result.
     * @example
     * const prefix = stream.takeWhile((value: number): boolean => value < 3);
     * @returns A stream over the matching prefix.
     */
    public takeWhile(predicate: Predicate<E>): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let taking: boolean = true;
            let count: bigint = 0n;

            this.generator((element: E): void => {
                if (!taking) {
                    return;
                }

                if (!predicate(element)) {
                    taking = false;

                    return;
                }

                action(element, count);
                count++;
            }, (element: E, index: bigint): boolean => !taking || interruption(element, index));
        });
    }

    /**
     * Collects every element into a new array.
     * @example
     * const values: Array<number> = stream.toArray();
     * @returns An array of all elements.
     */
    public toArray(): Array<E> {
        const elements: Array<E> = [];

        this.generator((element: E): void => {
            elements.push(element);
        }, (): boolean => false);

        return elements;
    }

    /**
     * Adds an offset to the internal index passed downstream; the elements are unchanged.
     *
     * The index belongs to the push pipeline and is never exposed to consumers,
     * so the resulting stream yields the same elements in the same order.
     * @param offset - Value added to every internal index.
     * @example
     * const shifted = stream.translate(10n);
     * @returns A stream with translated internal indexes.
     */
    public translate(offset: bigint): SynchronizeStream<E> {
        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            this.generator((element: E): void => {
                action(element, count + offset);
                count++;
            }, (element: E, index: bigint): boolean => interruption(element, index + offset));
        });
    }

    /**
     * Returns a fresh iterator through the synchronize-iterable brand.
     * @example
     * const iterator = stream[SynchronizeIterableSymbol]();
     * @returns A generator over the stream.
     */
    public [SynchronizeIterableSymbol](): Generator<E, void, unknown> {
        return this[Symbol.iterator]();
    }

    /**
     * Returns a fresh iterator through the stream brand.
     * @example
     * const iterator = stream[SynchronizeStreamSymbol]();
     * @returns A generator over the stream.
     */
    public [SynchronizeStreamSymbol](): Generator<E, void, unknown> {
        return this[Symbol.iterator]();
    }

    /**
     * Returns a fresh iterator over the stream.
     * @example
     * const values: Array<number> = [...stream];
     * @returns A generator over the stream.
     */
    public *[Symbol.iterator](): Generator<E, void, unknown> {
        yield* this.toArray();
    }
}

/**
 * Creates a synchronous stream from the supplied elements.
 * @param elements - Elements to emit in order.
 * @example
 * const stream = SynchronizeStream(1, 2, 3);
 * @returns A stream over the elements.
 */
export const SynchronizeStream: SynchronizeStreamConstructor = Object.assign(
    <E>(...elements: E[]): SynchronizeStream<E> => {
        const copy: Array<E> = [...elements];

        return new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
            let count: bigint = 0n;

            for (const element of copy) {
                if (interruption(element, count)) {
                    return;
                }

                action(element, count);
                count++;
            }
        });
    },
    {
        /**
         * Creates a stream that pushes from an iterable.
         * @param iterable - Source iterable, including generators and streams.
         * @example
         * const stream = SynchronizeStream.iterate([1, 2, 3]);
         * @returns A stream over the iterable.
         */
        iterate: <E>(iterable: Iterable<E>): SynchronizeStream<E> =>
            new SynchronizeExecution<E>((action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): void => {
                let count: bigint = 0n;

                for (const element of iterable) {
                    if (interruption(element, count)) {
                        return;
                    }

                    action(element, count);
                    count++;
                }
            }),
        /**
         * Creates a stream of text parts.
         *
         * Without a delimiter the whole text is one element; an empty delimiter
         * splits the text into its characters.
         * @param text - Text to split.
         * @param delimiter - Separator used to split the text.
         * @example
         * const parts = SynchronizeStream.text("a,b", ",");
         * @returns A stream of text parts.
         */
        text: (text: string, delimiter?: string): SynchronizeStream<string> => {
            const parts: Array<string> = delimiter === (void 0) ? [text] : text.split(delimiter);

            return new SynchronizeExecution<string>((action: BiConsumer<string, bigint>, interruption: BiPredicate<string, bigint>): void => {
                let count: bigint = 0n;

                for (const element of parts) {
                    if (interruption(element, count)) {
                        return;
                    }

                    action(element, count);
                    count++;
                }
            });
        },
    },
) as unknown as SynchronizeStreamConstructor;

/**
 * Lazy asynchronous stream of elements.
 * Type: interface.
 * Fields: concatenate, distinct, dropWhile, filter, flatMap, limit, map, peek, redirect, skip, sub, takeWhile,
 * toArray, translate, [Symbol.asyncIterator], [AsynchronizeStreamSymbol].
 * @example
 * const stream: AsynchronizeStream<number> = AsynchronizeStream(1, 2, 3).map((value: number): number => value * 2);
 */
export interface AsynchronizeStream<E> extends AsynchronizeIterable<E> {
    concatenate(other: AsynchronizeStream<E>): AsynchronizeStream<E>;
    concatenate(other: Iterable<E>): AsynchronizeStream<E>;
    concatenate(other: AsynchronizeIterable<E>): AsynchronizeStream<E>;
    distinct(): AsynchronizeStream<E>;
    dropWhile(predicate: Predicate<E>): AsynchronizeStream<E>;
    filter(predicate: Predicate<E>): AsynchronizeStream<E>;
    flatMap<R>(mapper: Functional<E, AsyncIterable<R>>): AsynchronizeStream<R>;
    limit(maxSize: bigint): AsynchronizeStream<E>;
    map<R>(mapper: Functional<E, R>): AsynchronizeStream<R>;
    peek(action: Consumer<E>): AsynchronizeStream<E>;
    peek(action: BiConsumer<E, bigint>): AsynchronizeStream<E>;
    redirect(redirector: BiFunctional<E, bigint, bigint>): AsynchronizeStream<E>;
    skip(n: bigint): AsynchronizeStream<E>;
    sub(start: bigint, end: bigint): AsynchronizeStream<E>;
    [AsynchronizeStreamSymbol](): AsyncGenerator<E, void, unknown>;
    takeWhile(predicate: Predicate<E>): AsynchronizeStream<E>;
    toArray(): Promise<Array<E>>;
    translate(offset: bigint): AsynchronizeStream<E>;
}

/**
 * Checks whether a value is an asynchronous stream.
 * @param target - Value to inspect.
 * @example
 * const result: boolean = isAsynchronizeStream(value);
 * @returns True when the value carries an asynchronous stream brand method.
 */
export const isAsynchronizeStream: (target: unknown) => target is AsynchronizeStream<unknown> = (
    target: unknown,
): target is AsynchronizeStream<unknown> =>
    isObject(target) &&
    Reflect.has(target, AsynchronizeStreamSymbol) &&
    isFunction(Reflect.get(target, AsynchronizeStreamSymbol));

/**
 * Factory for asynchronous streams.
 * Type: interface.
 * Fields: iterate, text.
 * @example
 * const stream: AsynchronizeStream<number> = AsynchronizeStream(1, 2, 3);
 */
export interface AsynchronizeStreamConstructor {
    <E>(...elements: E[]): AsynchronizeStream<E>;
    iterate<E>(iterable: Iterable<E>): AsynchronizeStream<E>;
    iterate<E>(iterable: AsyncGenerator<E, void, unknown>): AsynchronizeStream<E>;
    iterate<E>(iterable: AsynchronizeIterable<E>): AsynchronizeStream<E>;
    text(text: string): AsynchronizeStream<string>;
    text(text: string, delimiter: string): AsynchronizeStream<string>;
}

/**
 * Default push-based implementation of `AsynchronizeStream`.
 * Type: class.
 * @param generator - Async push generator that drives the stream.
 * @example
 * const stream = new AsynchronizeExecution<number>(async (action: BiConsumer<number, bigint>): Promise<void> => {
 *     action(1, 0n);
 * });
 */
class AsynchronizeExecution<E> implements AsynchronizeStream<E> {
    private readonly generator: AsynchronizeGenerator<E>;

    /**
     * Creates a new AsynchronizeExecution.
     * @param generator - Async push generator that drives the stream.
     * @example
     * const stream = new AsynchronizeExecution<number>(async (action: BiConsumer<number, bigint>): Promise<void> => {
     *     action(1, 0n);
     * });
     * @returns A new instance.
     */
    public constructor(generator: AsynchronizeGenerator<E>) {
        this.generator = generator;
    }

    /**
     * Adapts a synchronous or asynchronous iterable to an async iterable.
     * @param iterable - Source iterable.
     * @example
     * const adapted = AsynchronizeExecution.adapted([1, 2, 3]);
     * @returns An async generator over the source.
     */
    public static async *adapted<E>(iterable: Iterable<E> | AsyncIterable<E>): AsyncGenerator<E, void, unknown> {
        if (Symbol.asyncIterator in iterable) {
            for await (const element of iterable) {
                yield element;
            }

            return;
        }

        for (const element of iterable) {
            yield element;
        }
    }

    concatenate(other: AsynchronizeStream<E>): AsynchronizeStream<E>;
    concatenate(other: Iterable<E>): AsynchronizeStream<E>;
    concatenate(other: AsynchronizeIterable<E>): AsynchronizeStream<E>;
    concatenate(other: AsynchronizeStream<E> | AsynchronizeIterable<E> | Iterable<E>): AsynchronizeStream<E> {
        if (isAsyncIterable(other) || isIterable(other)) {
            let count: bigint = 0n;
            return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
                await this.generator((element: E): void => {
                    action(element, count);
                    count++;
                }, interruption);
                for await (const element of AsynchronizeExecution.adapted<E>(other)) {
                    action(element, count);
                    count++;
                }
            });
        }
        throw new TypeError("Must be an iterable.");
    }

    /**
     * Drops repeated elements, keeping the first occurrence.
     * @example
     * const unique = AsynchronizeStream(1, 2, 1).distinct();
     * @returns A stream of distinct elements.
     */
    public distinct(): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            const seen: Set<E> = new Set<E>();
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (seen.has(element)) {
                    return;
                }

                seen.add(element);
                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Drops leading elements while the predicate holds, then emits the rest.
     * @param predicate - Test applied until the first false result.
     * @example
     * const rest = stream.dropWhile((value: number): boolean => value < 3);
     * @returns A stream without the matching prefix.
     */
    public dropWhile(predicate: Predicate<E>): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let dropping: boolean = true;
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (dropping && predicate(element)) {
                    return;
                }

                dropping = false;
                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Keeps the elements that satisfy the predicate.
     * @param predicate - Test applied to every element.
     * @example
     * const odd = stream.filter((value: number): boolean => value % 2 === 1);
     * @returns A stream of matching elements.
     */
    public filter(predicate: Predicate<E>): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (!predicate(element)) {
                    return;
                }

                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Maps every element to an async iterable and emits their elements in order.
     * @param mapper - Function returning the async iterable whose elements are emitted.
     * @example
     * const pair = stream.flatMap((value: number): AsyncIterable<number> => AsynchronizeStream(value, -value));
     * @returns A stream of flattened elements.
     */
    public flatMap<R>(mapper: Functional<E, AsyncIterable<R>>): AsynchronizeStream<R> {
        return new AsynchronizeExecution<R>(async (action: BiConsumer<R, bigint>, interruption: BiPredicate<R, bigint>): Promise<void> => {
            const elements: Array<E> = [];

            await this.generator((element: E): void => {
                elements.push(element);
            }, (): boolean => false);

            let count: bigint = 0n;

            for (const element of elements) {
                for await (const element1 of mapper(element)) {
                    if (interruption(element1, count)) {
                        return;
                    }

                    action(element1, count);
                    count++;
                }
            }
        });
    }

    /**
     * Emits at most a fixed number of leading elements.
     * @param maxSize - Maximum number of elements to emit; zero or less emits nothing.
     * @example
     * const firstTwo = stream.limit(2n);
     * @returns A stream truncated to the limit.
     */
    public limit(maxSize: bigint): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (count >= maxSize) {
                    return;
                }

                action(element, count);
                count++;
            }, (element: E, index: bigint): boolean => count >= maxSize || interruption(element, index));
        });
    }

    /**
     * Transforms every element.
     * @param mapper - Transform applied to each element.
     * @example
     * const doubled = stream.map((value: number): number => value * 2);
     * @returns A stream of mapped elements.
     */
    public map<R>(mapper: Functional<E, R>): AsynchronizeStream<R> {
        return new AsynchronizeExecution<R>(async (action: BiConsumer<R, bigint>, interruption: BiPredicate<R, bigint>): Promise<void> => {
            let count: bigint = 0n;
            let stopped: boolean = false;

            await this.generator((element: E): void => {
                if (stopped) {
                    return;
                }

                const value: R = mapper(element);

                if (interruption(value, count)) {
                    stopped = true;

                    return;
                }

                action(value, count);
                count++;
            }, (): boolean => stopped);
        });
    }

    /**
     * Runs a side effect for every element before it is emitted.
     * @param action - Side effect executed for each element.
     * @example
     * const logged = stream.peek((value: number): void => console.log(value));
     * @returns A stream of the original elements.
     */
    public peek(action: Consumer<E>): AsynchronizeStream<E>;
    public peek(action: BiConsumer<E, bigint>): AsynchronizeStream<E>;
    public peek(action: Consumer<E> | BiConsumer<E, bigint>): AsynchronizeStream<E> {
        if (isFunction(action)) {
            return new AsynchronizeExecution<E>(async (action1: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
                await this.generator((element: E, index: bigint): void => {
                    action(element, index);
                    action1(element, index);
                }, interruption);
            });
        }
        throw new TypeError("Must be an iterable.");
    }

    /**
     * Remaps the internal index passed downstream; the elements are unchanged.
     *
     * The index belongs to the push pipeline and is never exposed to consumers,
     * so the resulting stream yields the same elements in the same order.
     * @param redirector - Function mapping an element and index to a new index.
     * @example
     * const reindexed = stream.redirect((value: number, index: bigint): bigint => index + 1n);
     * @returns A stream with redirected internal indexes.
     */
    public redirect(redirector: BiFunctional<E, bigint, bigint>): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                action(element, redirector(element, count));
                count++;
            }, (element: E, index: bigint): boolean => interruption(element, redirector(element, index)));
        });
    }

    /**
     * Discards a fixed number of leading elements.
     * @param n - Number of leading elements to discard; zero or less discards nothing.
     * @example
     * const rest = stream.skip(2n);
     * @returns A stream without the skipped prefix.
     */
    public skip(n: bigint): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (count < n) {
                    count++;

                    return;
                }

                action(element, count);
                count++;
            }, interruption);
        });
    }

    /**
     * Emits the elements inside a half-open index window.
     * @param start - First index of the window; values below zero behave as zero.
     * @param end - Exclusive end index; when it is not greater than `start` the window is empty.
     * @example
     * const window = stream.sub(1n, 3n);
     * @returns A stream over the window.
     */
    public sub(start: bigint, end: bigint): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (count >= end) {
                    return;
                }

                if (count >= start) {
                    action(element, count);
                }

                count++;
            }, (element: E, index: bigint): boolean => count >= end || interruption(element, index));
        });
    }

    /**
     * Emits leading elements while the predicate holds.
     * @param predicate - Test applied until the first false result.
     * @example
     * const prefix = stream.takeWhile((value: number): boolean => value < 3);
     * @returns A stream over the matching prefix.
     */
    public takeWhile(predicate: Predicate<E>): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let taking: boolean = true;
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                if (!taking) {
                    return;
                }

                if (!predicate(element)) {
                    taking = false;

                    return;
                }

                action(element, count);
                count++;
            }, (element: E, index: bigint): boolean => !taking || interruption(element, index));
        });
    }

    /**
     * Collects every element into a new array.
     * @example
     * const values: Array<number> = await stream.toArray();
     * @returns A promise of all elements.
     */
    public async toArray(): Promise<Array<E>> {
        const elements: Array<E> = [];

        await this.generator((element: E): void => {
            elements.push(element);
        }, (): boolean => false);

        return elements;
    }

    /**
     * Adds an offset to the internal index passed downstream; the elements are unchanged.
     *
     * The index belongs to the push pipeline and is never exposed to consumers,
     * so the resulting stream yields the same elements in the same order.
     * @param offset - Value added to every internal index.
     * @example
     * const shifted = stream.translate(10n);
     * @returns A stream with translated internal indexes.
     */
    public translate(offset: bigint): AsynchronizeStream<E> {
        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            await this.generator((element: E): void => {
                action(element, count + offset);
                count++;
            }, (element: E, index: bigint): boolean => interruption(element, index + offset));
        });
    }

    /**
     * Returns a fresh iterator through the asynchronize-iterable brand.
     * @example
     * const iterator = stream[AsynchronizeIterableSymbol]();
     * @returns An async generator over the stream.
     */
    public [AsynchronizeIterableSymbol](): AsyncGenerator<E, void, unknown> {
        return this[Symbol.asyncIterator]();
    }

    /**
     * Returns a fresh iterator through the stream brand.
     * @example
     * const iterator = stream[AsynchronizeStreamSymbol]();
     * @returns An async generator over the stream.
     */
    public [AsynchronizeStreamSymbol](): AsyncGenerator<E, void, unknown> {
        return this[Symbol.asyncIterator]();
    }

    /**
     * Returns a fresh async iterator over the stream.
     * @example
     * const values: Array<number> = await stream.toArray();
     * @returns An async generator over the stream.
     */
    public async *[Symbol.asyncIterator](): AsyncGenerator<E, void, unknown> {
        const elements: Array<E> = await this.toArray();

        for (const element of elements) {
            yield element;
        }
    }
}

/**
 * Creates an asynchronous stream from the supplied elements.
 * @param elements - Elements to emit in order.
 * @example
 * const stream = AsynchronizeStream(1, 2, 3);
 * @returns A stream over the elements.
 */
export const AsynchronizeStream: AsynchronizeStreamConstructor = Object.assign(
    <E>(...elements: E[]): AsynchronizeStream<E> => {
        const copy: Array<E> = [...elements];

        return new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
            let count: bigint = 0n;

            for (const element of copy) {
                if (interruption(element, count)) {
                    return;
                }

                action(element, count);
                count++;
            }
        });
    },
    {
        /**
         * Creates a stream that pushes from a synchronous or asynchronous iterable.
         * @param iterable - Source iterable, including generators and streams.
         * @example
         * const stream = AsynchronizeStream.iterate([1, 2, 3]);
         * @returns A stream over the iterable.
         */
        iterate: <E>(iterable: Iterable<E> | AsyncIterable<E>): AsynchronizeStream<E> =>
            new AsynchronizeExecution<E>(async (action: BiConsumer<E, bigint>, interruption: BiPredicate<E, bigint>): Promise<void> => {
                let count: bigint = 0n;

                for await (const element of iterable) {
                    if (interruption(element, count)) {
                        return;
                    }

                    action(element, count);
                    count++;
                }
            }),
        /**
         * Creates a stream of text parts.
         *
         * Without a delimiter the whole text is one element; an empty delimiter
         * splits the text into its characters.
         * @param text - Text to split.
         * @param delimiter - Separator used to split the text.
         * @example
         * const parts = AsynchronizeStream.text("a,b", ",");
         * @returns A stream of text parts.
         */
        text: (text: string, delimiter?: string): AsynchronizeStream<string> => {
            const parts: Array<string> = delimiter === (void 0) ? [text] : text.split(delimiter);

            return new AsynchronizeExecution<string>(async (action: BiConsumer<string, bigint>, interruption: BiPredicate<string, bigint>): Promise<void> => {
                let count: bigint = 0n;

                for (const element of parts) {
                    if (interruption(element, count)) {
                        return;
                    }

                    action(element, count);
                    count++;
                }
            });
        },
    },
) as unknown as AsynchronizeStreamConstructor;
