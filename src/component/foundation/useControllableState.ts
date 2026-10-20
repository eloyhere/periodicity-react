import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type MutableRefObject,
    type SetStateAction,
} from "react";

/**
 * Options for a controlled or uncontrolled state pair.
 * Type: interface.
 * Fields: value, defaultValue, onChange.
 * @example
 * const options: ControllableStateOptions<string> = { defaultValue: "a" };
 */
export interface ControllableStateOptions<T> {
    value?: T;
    defaultValue: T;
    onChange?: (next: T) => void;
}

/**
 * State updater: a value or a function of the previous value.
 * Type: type alias.
 * Fields: none.
 * @example
 * const next: Updater<number> = (previous) => previous + 1;
 */
export type Updater<T> = T | ((previous: T) => T);

/**
 * Resolves an updater to its final value.
 * @param updater - New value or update function.
 * @param previous - Current value.
 * @example
 * const next = resolve((previous) => previous + 1, 1);
 * @returns The resolved state value.
 */
const resolve: <T>(updater: Updater<T>, previous: T) => T = <T>(
    updater: Updater<T>,
    previous: T,
): T => (typeof updater === "function" ? (updater as (previous: T) => T)(previous) : updater);
/**
 * Manages a controlled or uncontrolled state pair.
 * @param options - Controlled value, default value, and change handler.
 * @example
 * const [value, setValue] = useControllableState({ defaultValue: "" });
 * @returns A tuple of the current value and a setter.
 */
export const useControllableState: <T>(
    options: ControllableStateOptions<T>,
) => readonly [T, (next: Updater<T>) => void] = <T>({
    value,
    defaultValue,
    onChange,
}: ControllableStateOptions<T>): readonly [T, (next: Updater<T>) => void] => {
    const [internalValue, setInternalValue]: [T, Dispatch<SetStateAction<T>>] =
        useState<T>(defaultValue);
    const isControlled: boolean = value !== (void 0);
    const currentValue: T = isControlled ? (value as T) : internalValue;
    const currentRef: MutableRefObject<T> = useRef<T>(currentValue);

    useEffect((): void => {
        currentRef.current = currentValue;
    });

    const setValue: (next: Updater<T>) => void = useCallback(
        (next: Updater<T>): void => {
            const resolved: T = resolve<T>(next, currentRef.current);

            if (!isControlled) {
                setInternalValue(resolved);
            }

            onChange?.(resolved);
        },
        [isControlled, onChange],
    );

    return [currentValue, setValue] as const;
};

export default useControllableState;
