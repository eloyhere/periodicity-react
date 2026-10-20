/**
 * Normalises a capacity to a positive whole number, or `Infinity` for an unbounded cache.
 *
 * A fractional capacity is floored so the bound stays meaningful, while zero, negative numbers and `NaN` are
 * rejected because a cache that can never hold an entry is almost always a programming error.
 * Type: function.
 * @param capacity - Requested maximum number of entries.
 * @example
 * const capacity: number = normaliseCapacity(2.9);
 * @returns The normalised capacity, as `2` for the example above or `Infinity` when unbounded.
 */
export const normaliseCapacity: (capacity: number) => number = (capacity: number): number => {
    if (capacity === Number.POSITIVE_INFINITY) {
        return Number.POSITIVE_INFINITY;
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
        throw new RangeError("Capacity must be a positive integer or Infinity.");
    }

    return Math.floor(capacity);
};
