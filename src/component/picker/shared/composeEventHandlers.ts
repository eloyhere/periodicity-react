import type { SyntheticEvent } from "react";

/**
 * Options that control how a composed handler treats a cancelled event.
 * Type: interface.
 * Fields: runWhenPrevented.
 * @example
 * const options: ComposeEventHandlersOptions = { runWhenPrevented: true };
 */
export interface ComposeEventHandlersOptions {
    runWhenPrevented?: boolean;
}

/**
 * Composes a caller handler with an internal handler so neither is overwritten.
 * The caller runs first, which lets it cancel the internal behaviour with `preventDefault`.
 * @param caller - Handler supplied by the consuming component.
 * @param internal - Handler owned by the picker.
 * @param options - Whether the internal handler still runs after `preventDefault`.
 * @example
 * <button onClick={composeEventHandlers(onClick, toggleOpen)} />
 * @returns A handler that invokes both callbacks in a predictable order.
 */
export const composeEventHandlers: <TEvent extends SyntheticEvent<Element>>(
    caller: ((event: TEvent) => void) | void,
    internal: (event: TEvent) => void,
    options?: ComposeEventHandlersOptions,
) => (event: TEvent) => void = <TEvent extends SyntheticEvent<Element>>(
    caller: ((event: TEvent) => void) | void,
    internal: (event: TEvent) => void,
    options: ComposeEventHandlersOptions = {},
): ((event: TEvent) => void) => (event: TEvent): void => {
    caller?.(event);

    if (event.defaultPrevented && options.runWhenPrevented !== true) {
        return;
    }

    internal(event);
};

export default composeEventHandlers;
