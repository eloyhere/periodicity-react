/**
 * Moves focus between the enabled options of a listbox in response to a navigation key.
 * Type: function.
 * @param container - Element that owns the listbox options.
 * @param key - Keyboard key reported by the originating event.
 * @example
 * const handled = focusListOption(listbox, "ArrowDown");
 * @returns True when the key was a navigation request that moved focus.
 */
export const focusListOption: (container: HTMLElement, key: string) => boolean = (
    container: HTMLElement,
    key: string,
): boolean => {
    if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") {
        return false;
    }

    const options: HTMLElement[] = Array.from(
        container.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])'),
    );

    if (options.length === 0) {
        return false;
    }

    const active: HTMLElement | null =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const current: number = active === null ? -1 : options.indexOf(active);
    let next: number;

    if (key === "Home") {
        next = 0;
    } else if (key === "End") {
        next = options.length - 1;
    } else if (key === "ArrowDown") {
        next = current === -1 ? 0 : (current + 1) % options.length;
    } else {
        next = current === -1 ? options.length - 1 : (current - 1 + options.length) % options.length;
    }

    options[next]?.focus({ preventScroll: true });

    return true;
};

export default focusListOption;
