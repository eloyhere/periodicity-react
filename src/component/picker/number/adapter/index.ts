/**
 * Pixel height of one wheel delta line.
 * @example
 * const pixels = WheelLineHeight * 3;
 */
export const WheelLineHeight: number = 16;

/**
 * Accumulated pixels that equal one wheel notch.
 * @example
 * const notch = WheelNotchPixels;
 */
export const WheelNotchPixels: number = 40;

/**
 * A single wheel event at or above this size is treated as one discrete notch.
 * @example
 * const discrete = WheelDiscretePixels;
 */
export const WheelDiscretePixels: number = 80;

/**
 * Idle gap after which the wheel accumulator resets.
 * @example
 * const gap = WheelGestureGap;
 */
export const WheelGestureGap: number = 240;

/**
 * Maximum number of values scanned when building text suggestions.
 * @example
 * const limit = SuggestionScanLimit;
 */
const SuggestionScanLimit: number = 4000;

/**
 * Number of neighbouring values scanned on each side for very large ranges.
 * @example
 * const radius = SuggestionScanRadius;
 */
const SuggestionScanRadius: number = 32;

/**
 * Maximum number of trailing zeros appended to a typed prefix for large ranges.
 * @example
 * const zeros = SuggestionMaxZeros;
 */
const SuggestionMaxZeros: number = 12;

/**
 * Decimal text accepted by the editor and the suggestion filter.
 * @example
 * const valid = NumericPrefixPattern.test("12.5");
 */
const NumericPrefixPattern: RegExp = /^-?(?:\d+\.?\d*|\.\d+)$/;

/**
 * Options for the number picker value adapter.
 * Type: interface.
 * Fields: min, max, step, disabledValues.
 * @example
 * const options: NumberPickerAdapterOptions = { min: 1, max: 30, step: 1 };
 */
export interface NumberPickerAdapterOptions {
    readonly min: number;
    readonly max: number;
    readonly step: number;
    readonly disabledValues?: readonly number[];
}

/**
 * Pure value adapter shared by the wheel, keyboard, and text editor.
 * Type: interface.
 * Fields: min, max, stepSize, count, clamp, indexAt, valueAt, isDisabled, snap, step, first, last, suggest.
 * @example
 * const adapter = createNumberPickerAdapter({ min: 0, max: 10, step: 1 });
 * const next = adapter.step(4, 1);
 */
export interface NumberPickerAdapter {
    readonly min: number;
    readonly max: number;
    readonly stepSize: number;
    readonly count: number;

    /**
     * Clamps a value to the configured bounds.
     * @param value - Candidate value.
     * @example
     * const bounded = adapter.clamp(140);
     * @returns The value inside the bounds.
     */
    clamp(value: number): number;

    /**
     * Finds the nearest index for a value, ignoring disabled values.
     * @param value - Value to locate.
     * @example
     * const index = adapter.indexAt(6);
     * @returns The nearest zero-based index.
     */
    indexAt(value: number): number;

    /**
     * Reads the canonical value at an index.
     * @param index - Zero-based index; values outside the range are clamped.
     * @example
     * const value = adapter.valueAt(2);
     * @returns The value at that index.
     */
    valueAt(index: number): number;

    /**
     * Reports whether an exact value is disabled.
     * @param value - Value to test.
     * @example
     * const blocked = adapter.isDisabled(5);
     * @returns True when the value cannot be selected.
     */
    isDisabled(value: number): boolean;

    /**
     * Snaps a value to the nearest enabled step, optionally preferring a direction.
     * @param value - Candidate value.
     * @param direction - Travel direction used when skipping disabled values; 0 chooses the nearest.
     * @example
     * const snapped = adapter.snap(13.4, 1);
     * @returns The nearest enabled value, or (void 0) when every value is disabled.
     */
    snap(value: number, direction?: -1 | 0 | 1): number | null;

    /**
     * Moves one enabled step in a direction without wrapping.
     * @param value - Current value.
     * @param direction - 1 increases and -1 decreases.
     * @example
     * const next = adapter.step(4, 1);
     * @returns The next enabled value, or (void 0) at the bound.
     */
    step(value: number, direction: -1 | 1): number | null;

    /**
     * Returns the first enabled value.
     * @example
     * const first = adapter.first();
     * @returns The lowest enabled value, or (void 0) when every value is disabled.
     */
    first(): number | null;

    /**
     * Returns the last enabled value.
     * @example
     * const last = adapter.last();
     * @returns The highest enabled value, or (void 0) when every value is disabled.
     */
    last(): number | null;

    /**
     * Suggests enabled values whose textual form starts with the typed text.
     * @param query - Raw text typed into the value field.
     * @param limit - Maximum number of suggestions.
     * @example
     * const values = adapter.suggest("1", 5);
     * @returns Matching values with exact matches first, then the nearest to the typed number.
     */
    suggest(query: string, limit: number): readonly number[];
}

/**
 * Accumulated wheel delta state.
 * Type: interface.
 * Fields: amount, lastAt.
 * @example
 * const state: WheelAccumulatorState = { amount: 0, lastAt: 0 };
 */
export interface WheelAccumulatorState {
    readonly amount: number;
    readonly lastAt: number;
}

/**
 * Result of normalising one wheel event.
 * Type: interface.
 * Fields: state, steps.
 * @example
 * const result: WheelNotchResult = { state: { amount: 0, lastAt: 0 }, steps: 1 };
 */
export interface WheelNotchResult {
    readonly state: WheelAccumulatorState;
    readonly steps: number;
}

/**
 * Converts a wheel delta to pixels using the browser delta mode.
 * @param deltaY - Raw vertical delta from the wheel event.
 * @param deltaMode - DOM delta mode: 0 pixels, 1 lines, 2 pages.
 * @param pageHeight - Height used when the delta mode is pages.
 * @example
 * const pixels = normaliseWheelDelta(3, 1, 160);
 * @returns The vertical delta in CSS pixels.
 */
export const normaliseWheelDelta: (deltaY: number, deltaMode: number, pageHeight: number) => number = (
    deltaY: number,
    deltaMode: number,
    pageHeight: number,
): number => {
    if (!Number.isFinite(deltaY)) {
        return 0;
    }

    if (deltaMode === 1) {
        return deltaY * WheelLineHeight;
    }

    if (deltaMode === 2) {
        return deltaY * (pageHeight > 0 ? pageHeight : 1);
    }

    return deltaY;
};

/**
 * Accumulates wheel pixels into at most one notch per event.
 * Large discrete mouse-wheel events are consumed whole, while small trackpad deltas accumulate.
 * @param state - Accumulated pixels and the previous event time.
 * @param deltaY - Raw vertical delta from the wheel event.
 * @param deltaMode - DOM delta mode: 0 pixels, 1 lines, 2 pages.
 * @param pageHeight - Height used when the delta mode is pages.
 * @param now - Event timestamp in milliseconds.
 * @example
 * const result = resolveWheelNotch({ amount: 0, lastAt: 0 }, 100, 0, 160, 1000);
 * @returns The next accumulator state and a signed notch count.
 */
export const resolveWheelNotch: (
    state: WheelAccumulatorState,
    deltaY: number,
    deltaMode: number,
    pageHeight: number,
    now: number,
) => WheelNotchResult = (
    state: WheelAccumulatorState,
    deltaY: number,
    deltaMode: number,
    pageHeight: number,
    now: number,
): WheelNotchResult => {
    const pixels: number = normaliseWheelDelta(deltaY, deltaMode, pageHeight);
    const timestamp: number = Number.isFinite(now) ? now : 0;

    if (pixels === 0) {
        return { state, steps: 0 };
    }

    let amount: number = state.amount;
    const elapsed: number = timestamp - state.lastAt;

    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > WheelGestureGap) {
        amount = 0;
    }

    if (amount !== 0 && Math.sign(amount) !== Math.sign(pixels)) {
        amount = 0;
    }

    let steps: number = 0;

    if (Math.abs(pixels) >= WheelDiscretePixels) {
        steps = Math.sign(pixels);
        amount = 0;
    } else {
        amount += pixels;

        if (Math.abs(amount) >= WheelNotchPixels) {
            steps = Math.sign(amount);
            amount -= steps * WheelNotchPixels;

            if (Math.abs(amount) >= WheelNotchPixels) {
                amount = steps * (WheelNotchPixels - 1);
            }
        }
    }

    return {
        state: { amount, lastAt: timestamp },
        steps,
    };
};

/**
 * Builds the pure value adapter used by the number picker.
 * @param options - Bounds, step size, and disabled values.
 * @example
 * const adapter = createNumberPickerAdapter({ min: 1, max: 30, step: 1 });
 * const next = adapter.step(12, 1);
 * @returns A value adapter that never materialises large ranges.
 */
export const createNumberPickerAdapter: (options: NumberPickerAdapterOptions) => NumberPickerAdapter = (
    options: NumberPickerAdapterOptions,
): NumberPickerAdapter => {
    const min: number = options.min;
    const max: number = options.max;
    const stride: number = Number.isFinite(options.step) && options.step > 0 ? options.step : 1;
    const disabledSet: ReadonlySet<number> = new Set<number>(options.disabledValues ?? []);
    const span: number = max - min;
    const gridCount: number = span > 0 ? Math.floor(span / stride) + 1 : 1;
    const hasMaxEndpoint: boolean = span > 0 && min + (gridCount - 1) * stride < max;
    const count: number = gridCount + (hasMaxEndpoint ? 1 : 0);

    /**
     * Clamps a value to the configured bounds.
     * @param value - Candidate value.
     * @example
     * const bounded = clamp(140);
     * @returns A finite value inside the bounds.
     */
    const clamp: (value: number) => number = (value: number): number => {
        if (!Number.isFinite(value)) {
            return min;
        }

        return Math.min(max, Math.max(min, value));
    };

    /**
     * Reads the canonical value at an index.
     * @param index - Zero-based index.
     * @example
     * const value = valueAt(2);
     * @returns The canonical value.
     */
    const valueAt: (index: number) => number = (index: number): number => {
        const safeIndex: number = Number.isFinite(index) ? Math.trunc(index) : 0;

        if (hasMaxEndpoint && safeIndex >= gridCount) {
            return max;
        }

        return min + Math.min(gridCount - 1, Math.max(0, safeIndex)) * stride;
    };

    /**
     * Reports whether an exact value is disabled.
     * @param value - Value to test.
     * @example
     * const blocked = isDisabled(5);
     * @returns True when the value is in the disabled set.
     */
    const isDisabled: (value: number) => boolean = (value: number): boolean => disabledSet.has(value);

    /**
     * Reports whether an indexed value is disabled.
     * @param index - Zero-based index.
     * @example
     * const blocked = isDisabledIndex(2);
     * @returns True when the indexed value is disabled.
     */
    const isDisabledIndex: (index: number) => boolean = (index: number): boolean => isDisabled(valueAt(index));

    /**
     * Finds the nearest index for a value, ignoring disabled values.
     * @param value - Value to locate.
     * @example
     * const index = indexAt(6);
     * @returns The nearest zero-based index.
     */
    const indexAt: (value: number) => number = (value: number): number => {
        if (!Number.isFinite(value)) {
            return 0;
        }

        const raw: number = (value - min) / stride;
        const lower: number = Math.min(count - 1, Math.max(0, Math.floor(raw)));
        const upper: number = Math.min(count - 1, Math.max(0, Math.ceil(raw)));
        let best: number = lower;
        let bestDistance: number = Math.abs(valueAt(lower) - value);

        /**
         * Compares one candidate index with the current nearest index.
         * @param candidate - Candidate index.
         * @example
         * consider(3);
         * @returns Nothing.
         */
        const consider: (candidate: number) => void = (candidate: number): void => {
            const distance: number = Math.abs(valueAt(candidate) - value);

            if (distance < bestDistance || (distance === bestDistance && candidate < best)) {
                best = candidate;
                bestDistance = distance;
            }
        };

        consider(upper);

        if (hasMaxEndpoint) {
            consider(count - 1);
        }

        return best;
    };

    /**
     * Finds the nearest enabled index, optionally preferring a direction.
     * @param index - Starting index.
     * @param direction - Direction to search first; 0 checks lower values first.
     * @example
     * const enabled = nearestEnabledIndex(4, 1);
     * @returns A zero-based enabled index, or -1 when none exists.
     */
    const nearestEnabledIndex: (index: number, direction: -1 | 0 | 1) => number = (
        index: number,
        direction: -1 | 0 | 1,
    ): number => {
        const safeIndex: number = Number.isFinite(index) ? Math.trunc(index) : 0;
        const start: number = Math.min(count - 1, Math.max(0, safeIndex));

        if (!isDisabledIndex(start)) {
            return start;
        }

        const primary: -1 | 1 = direction === 0 ? -1 : direction;
        const limit: number = Math.min(count, disabledSet.size + 1);

        for (let distance: number = 1; distance <= limit; distance += 1) {
            const first: number = start + primary * distance;

            if (first >= 0 && first < count && !isDisabledIndex(first)) {
                return first;
            }

            const second: number = start - primary * distance;

            if (second >= 0 && second < count && !isDisabledIndex(second)) {
                return second;
            }
        }

        return -1;
    };

    /**
     * Snaps a value to the nearest enabled step.
     * @param value - Candidate value.
     * @param direction - Travel direction used when skipping disabled values; 0 chooses the nearest.
     * @example
     * const snapped = snap(13.4, 1);
     * @returns The nearest enabled value, or (void 0) when every value is disabled.
     */
    const snap: (value: number, direction?: -1 | 0 | 1) => number | null = (
        value: number,
        direction: -1 | 0 | 1 = 0,
    ): number | null => {
        if (!Number.isFinite(value)) {
            return null;
        }

        const index: number = nearestEnabledIndex(indexAt(value), direction);

        return index < 0 ? null : valueAt(index);
    };

    /**
     * Moves one enabled step in a direction without wrapping.
     * @param value - Current value.
     * @param direction - 1 increases and -1 decreases.
     * @example
     * const next = stepValue(4, 1);
     * @returns The next enabled value, or (void 0) at the bound.
     */
    const stepValue: (value: number, direction: -1 | 1) => number | null = (
        value: number,
        direction: -1 | 1,
    ): number | null => {
        if (!Number.isFinite(value)) {
            return null;
        }

        let next: number = indexAt(value) + direction;

        while (next >= 0 && next < count) {
            if (!isDisabledIndex(next)) {
                return valueAt(next);
            }

            next += direction;
        }

        return null;
    };

    /**
     * Returns the first enabled value.
     * @example
     * const firstValue = first();
     * @returns The lowest enabled value, or (void 0) when every value is disabled.
     */
    const first: () => number | null = (): number | null => {
        const index: number = nearestEnabledIndex(0, 1);

        return index < 0 ? null : valueAt(index);
    };

    /**
     * Returns the last enabled value.
     * @example
     * const lastValue = last();
     * @returns The highest enabled value, or (void 0) when every value is disabled.
     */
    const last: () => number | null = (): number | null => {
        const index: number = nearestEnabledIndex(count - 1, -1);

        return index < 0 ? null : valueAt(index);
    };

    /**
     * Suggests enabled values whose textual form starts with the typed text.
     * @param query - Raw text typed into the value field.
     * @param limit - Maximum number of suggestions.
     * @example
     * const values = suggest("1", 5);
     * @returns Matching values with exact matches first, then the nearest to the typed number.
     */
    const suggest: (query: string, limit: number) => readonly number[] = (
        query: string,
        limit: number,
    ): readonly number[] => {
        const maximum: number = Math.max(0, Math.floor(limit));
        const trimmed: string = query.trim();

        if (maximum === 0 || trimmed.length === 0 || !NumericPrefixPattern.test(trimmed)) {
            return [];
        }

        const normalised: string = trimmed.startsWith("-.")
            ? `-0${trimmed.slice(1)}`
            : trimmed.startsWith(".")
              ? `0${trimmed}`
              : trimmed;
        const parsedQuery: number = Number(normalised);
        const matches: number[] = [];
        const seen: Set<number> = new Set<number>();

        /**
         * Adds one value when it is enabled, canonical, and matches the typed prefix.
         * @param value - Candidate value.
         * @example
         * collect(12);
         * @returns Nothing.
         */
        const collect: (value: number) => void = (value: number): void => {
            if (seen.has(value)) {
                return;
            }

            if (value < min || value > max || !`${value}`.startsWith(normalised)) {
                return;
            }

            if (isDisabled(value)) {
                return;
            }

            const snapped: number | null = snap(value, 0);

            if (snapped === null || Math.abs(snapped - value) > 1e-9) {
                return;
            }

            seen.add(value);
            matches.push(value);
        };

        if (count <= SuggestionScanLimit) {
            for (let index: number = 0; index < count; index += 1) {
                collect(valueAt(index));
            }
        } else {
            const sign: number = normalised.startsWith("-") ? -1 : 1;
            const unsigned: string = normalised.startsWith("-") ? normalised.slice(1) : normalised;

            if (!unsigned.includes(".")) {
                const maxExtra: number = Math.min(
                    SuggestionMaxZeros,
                    `${Math.floor(Math.abs(max))}`.length,
                );

                for (let extra: number = 0; extra <= maxExtra; extra += 1) {
                    const base: number = Number(`${unsigned}${"0".repeat(extra)}`) * sign;

                    for (let increment: number = 0; increment <= 9; increment += 1) {
                        collect(base + sign * increment);
                    }
                }
            }

            if (Number.isFinite(parsedQuery)) {
                const start: number = indexAt(parsedQuery);

                for (let offset: number = 0; offset <= SuggestionScanRadius; offset += 1) {
                    const forward: number = start + offset;

                    if (forward < count) {
                        collect(valueAt(forward));
                    }

                    if (offset > 0) {
                        const backward: number = start - offset;

                        if (backward >= 0) {
                            collect(valueAt(backward));
                        }
                    }
                }
            }
        }

        matches.sort((left: number, right: number): number => {
            const leftExact: number = `${left}` === normalised ? 0 : 1;
            const rightExact: number = `${right}` === normalised ? 0 : 1;

            if (leftExact !== rightExact) {
                return leftExact - rightExact;
            }

            const leftDistance: number = Number.isFinite(parsedQuery) ? Math.abs(left - parsedQuery) : 0;
            const rightDistance: number = Number.isFinite(parsedQuery) ? Math.abs(right - parsedQuery) : 0;

            if (leftDistance !== rightDistance) {
                return leftDistance - rightDistance;
            }

            return left - right;
        });

        return matches.slice(0, maximum);
    };

    return {
        min,
        max,
        stepSize: stride,
        count,
        clamp,
        indexAt,
        valueAt,
        isDisabled,
        snap,
        step: stepValue,
        first,
        last,
        suggest,
    };
};
