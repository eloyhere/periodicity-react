import { useEffect, useState } from "react";

/**
 * Returns a value only after it has remained unchanged for `delay` milliseconds.
 * @param value - Rapidly changing value.
 * @param delay - Quiet period before publishing the value.
 * @example
 * const settled = useDebouncedValue(query, 500);
 * @returns The debounced value.
 */
export const useDebouncedValue: <T>(value: T, delay?: number) => T = <T>(
    value: T,
    delay: number = 500,
): T => {
    const [debounced, setDebounced]: [T, (next: T) => void] = useState<T>(value);

    useEffect((): (() => void) => {
        const timer: number = window.setTimeout((): void => {
            setDebounced(value);
        }, delay);

        return (): void => {
            window.clearTimeout(timer);
        };
    }, [value, delay]);

    return debounced;
};

export default useDebouncedValue;
