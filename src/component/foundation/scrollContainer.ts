/**
 * Resolves the nearest ancestor that can scroll vertically. The document itself
 * is represented by `null`, which makes the viewport the scroll port.
 * @param node - Element whose ancestor chain should be inspected.
 * @example
 * const container: HTMLElement | null = findScrollContainer(element);
 * @returns The nearest scroll container, or `null` for the viewport.
 */
export const findScrollContainer: (node: HTMLElement) => HTMLElement | null = (
    node: HTMLElement,
): HTMLElement | null => {
    if (typeof window === "undefined") {
        return null;
    }

    let parent: HTMLElement | null = node.parentElement;

    while (parent !== null && parent !== document.body && parent !== document.documentElement) {
        const overflowY: string = window.getComputedStyle(parent).overflowY;

        if (
            overflowY === "auto" ||
            overflowY === "scroll" ||
            overflowY === "overlay" ||
            overflowY === "hidden"
        ) {
            return parent;
        }

        parent = parent.parentElement;
    }

    return null;
};

export default findScrollContainer;
