import type { StandardEvent, StandardEventInit } from "./types";

/**
 * Creates a standard component event from a module payload.
 * @param init - Event payload from a device module.
 * @example
 * const event: StandardEvent = createStandardEvent(init);
 * @returns A normalised event with preventDefault and stopPropagation.
 */
export const createStandardEvent: (init: StandardEventInit) => StandardEvent = (
    init: StandardEventInit,
): StandardEvent => ({
    ...init,
    count: init.count ?? 1,
    preventDefault: (): void => {
        if (init.originalEvent.cancelable) {
            init.originalEvent.preventDefault();
        }
    },
    stopPropagation: (): void => {
        init.originalEvent.stopPropagation();
    },
});

export default createStandardEvent;
