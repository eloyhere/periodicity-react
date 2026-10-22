/**
 * Dispatches a bubbling native `change` event that carries the picker payload.
 * The custom event lets non-React consumers listen with `addEventListener`
 * while React consumers keep using the `onChange` prop.
 * @param element - Root element that owns the picker.
 * @param detail - Files or image selection produced by the picker.
 * @example
 * dispatchChange(rootRef.current, files);
 * @returns Nothing.
 */
export const dispatchChange: <Detail>(element: HTMLElement | null, detail: Detail) => void = <Detail>(
    element: HTMLElement | null,
    detail: Detail,
): void => {
    if (element === null) {
        return;
    }

    element.dispatchEvent(new CustomEvent<Detail>("change", { bubbles: true, detail }));
};

export default dispatchChange;
