import type { GesturePoint } from "./geometry";

const RectangleStyles: readonly string[] = [
    "boxSizing",
    "width",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "lineHeight",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "textTransform",
    "textIndent",
    "whiteSpace",
    "wordBreak",
    "overflowWrap",
];

const readElementCentre: (element: Element) => GesturePoint = (element: Element): GesturePoint => {
    const rect: DOMRect = element.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
};

const readSelectionPoint: (element: Element) => GesturePoint | null = (
    element: Element,
): GesturePoint | null => {
    const documentRef: Document = element.ownerDocument;
    const windowRef: Window | null = documentRef.defaultView;

    if (windowRef === null) {
        return null;
    }

    const selection: Selection | null = windowRef.getSelection();

    if (selection === null || selection.rangeCount === 0) {
        return null;
    }

    const range: Range = selection.getRangeAt(0);
    const rect: DOMRect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
        return null;
    }

    return {
        x: rect.left,
        y: rect.top + rect.height,
    };
};

const readInputCaret: (element: HTMLInputElement | HTMLTextAreaElement) => GesturePoint | null = (
    element: HTMLInputElement | HTMLTextAreaElement,
): GesturePoint | null => {
    if (element instanceof HTMLInputElement && element.type === "password") {
        return null;
    }

    const selectionStart: number | null = element.selectionStart;

    if (selectionStart === null) {
        return null;
    }

    const documentRef: Document = element.ownerDocument;
    const windowRef: Window | null = documentRef.defaultView;

    if (windowRef === null || documentRef.body === null) {
        return null;
    }

    const computed: CSSStyleDeclaration = windowRef.getComputedStyle(element);
    const mirror: HTMLDivElement = documentRef.createElement("div");
    const marker: HTMLSpanElement = documentRef.createElement("span");
    const rect: DOMRect = element.getBoundingClientRect();

    mirror.style.position = "fixed";
    mirror.style.left = "-10000px";
    mirror.style.top = "0";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    mirror.style.height = "auto";
    mirror.style.minHeight = "0";
    mirror.style.overflow = "hidden";

    for (const property of RectangleStyles) {
        mirror.style.setProperty(property, computed.getPropertyValue(property));
    }

    mirror.style.width = `${rect.width}px`;
    mirror.textContent = element.value.slice(0, selectionStart);
    marker.textContent = "\u200b";
    mirror.append(marker);
    documentRef.body.append(mirror);

    const markerRect: DOMRect = marker.getBoundingClientRect();
    mirror.remove();

    if (markerRect.width === 0 && markerRect.height === 0) {
        return null;
    }

    return {
        x: markerRect.left,
        y: markerRect.top + markerRect.height,
    };
};

/**
 * Resolves the keyboard cursor coordinates for an event target.
 * @param target - Focused element that received the keyboard event.
 * @example
 * const point: GesturePoint = readCaretPoint(input);
 * @returns Caret coordinates, or the element centre when no caret is measurable.
 */
export const readCaretPoint: (target: Element) => GesturePoint = (target: Element): GesturePoint => {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return readInputCaret(target) ?? readElementCentre(target);
    }

    if (target instanceof HTMLElement && target.isContentEditable) {
        return readSelectionPoint(target) ?? readElementCentre(target);
    }

    return readElementCentre(target);
};

export default readCaretPoint;
