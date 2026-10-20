/**
 * Comparator for ordered structures.
 * Type: type alias.
 * @param first - Left value.
 * @param second - Right value.
 * @example
 * const comparator: Comparator<string> = compare;
 */
export type Comparator<K> = (first: K, second: K) => number;

/**
 * Compares two values and returns their order.
 * @param first - Left value.
 * @param second - Right value.
 * @example
 * const order: number = compare("a", "b");
 * @returns A negative number when `first` sorts first, positive when it sorts last, zero when equal.
 */
export const compare: <K>(first: K, second: K) => number = <K>(  first: K,    second: K,): number => {
    if (Object.is(first, second)) {
        return 0;
    }

    const left: unknown = first;
    const right: unknown = second;

    if (typeof left === "number" && typeof right === "number") {
        return left < right ? -1 : 1;
    }

    if (typeof left === "string" && typeof right === "string") {
        return left < right ? -1 : 1;
    }

    if (typeof left === "bigint" && typeof right === "bigint") {
        return left < right ? -1 : 1;
    }

    if (typeof left === "boolean" && typeof right === "boolean") {
        return left === right ? 0 : left ? 1 : -1;
    }

    throw new Error("Values are not comparable.");
};

export default compare;
