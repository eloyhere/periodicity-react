import { readCaretPoint } from "../core/caret";
import type { GesturePoint } from "../core/geometry";
import type { StandardEventEmitter } from "../events/types";

const readInputValue: (target: Element) => string | void = (target: Element): string | void => {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return target.value;
    }

    if (target instanceof HTMLElement && target.isContentEditable) {
        return target.textContent ?? "";
    }

    return (void 0);
};

/**
 * Registers keyboard press and input events on an element.
 * @param element - Element that owns the handlers.
 * @param emit - Standard event emitter supplied by the hook.
 * @example
 * const detach: () => void = registerKeyboardEvents(element, emit);
 * @returns A cleanup function.
 */
export const registerKeyboardEvents: (element: HTMLElement, emit: StandardEventEmitter) => () => void = (
    element: HTMLElement,
    emit: StandardEventEmitter,
): (() => void) => {
    const onKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
        if (event.repeat || event.isComposing || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }

        const point: GesturePoint = readCaretPoint(event.target instanceof Element ? event.target : element);

        emit({
            type: "press",
            x: point.x,
            y: point.y,
            source: "keyboard",
            target: event.target instanceof Element ? event.target : element,
            currentTarget: element,
            originalEvent: event,
        });
    };

    const onInput: (event: Event) => void = (event: Event): void => {
        const target: Element = event.target instanceof Element ? event.target : element;
        const value: string | void = readInputValue(target);

        if (value === (void 0)) {
            return;
        }

        const point: GesturePoint = readCaretPoint(target);

        emit({
            type: "input",
            x: point.x,
            y: point.y,
            source: "keyboard",
            target,
            currentTarget: element,
            value,
            originalEvent: event,
        });
    };

    element.addEventListener("keydown", onKeyDown);
    element.addEventListener("input", onInput);

    return (): void => {
        element.removeEventListener("keydown", onKeyDown);
        element.removeEventListener("input", onInput);
    };
};

export default registerKeyboardEvents;
