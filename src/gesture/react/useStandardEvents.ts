import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type MutableRefObject,
    type RefCallback,
    type SetStateAction,
} from "react";
import { readCaretPoint } from "../core/caret";
import type { GesturePoint } from "../core/geometry";
import { createStandardEvent } from "../events/event";
import type {
    StandardEvent,
    StandardEventInit,
    StandardEventOptions,
    StandardEventSource,
    StandardEventState,
} from "../events/types";
import { registerKeyboardEvents } from "../keyboard/register";
import { registerMouseEvents } from "../mouse/register";
import { registerTouchEvents } from "../touch/register";

interface ContinuousClick {
    readonly time: number;
    readonly x: number;
    readonly y: number;
    readonly count: number;
}

/**
 * Result of the standard event hook.
 * Type: interface.
 * @param ref - Callback ref that binds the three device modules.
 * @param state - Current pressed, hovered, continuous, and dragging state.
 * @example
 * const events: StandardEventsResult = useStandardEvents({ click: save });
 */
export interface StandardEventsResult {
    readonly ref: RefCallback<HTMLElement>;
    readonly state: StandardEventState;
}

/**
 * Registers mouse, touch, and keyboard modules and emits standard component events.
 * @param options - Standard event callbacks and thresholds.
 * @example
 * const events: StandardEventsResult = useStandardEvents({
 *     click: save,
 *     continuous: zoom,
 *     drag: reorder,
 * });
 * return <div ref={events.ref} />;
 * @returns A ref and the current interaction state.
 */
export const useStandardEvents: (options?: StandardEventOptions) => StandardEventsResult = (
    options: StandardEventOptions = {},
): StandardEventsResult => {
    const [element, setElement]: [HTMLElement | null, Dispatch<SetStateAction<HTMLElement | null>>] =
        useState<HTMLElement | null>(null);
    const [pressed, setPressed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [hovered, setHovered]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [dragging, setDragging]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [continuousCount, setContinuousCount]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const optionsRef: MutableRefObject<StandardEventOptions> = useRef<StandardEventOptions>(options);
    const continuousRef: MutableRefObject<ContinuousClick | null> = useRef<ContinuousClick | null>(null);
    const lastSourceRef: MutableRefObject<StandardEventSource | null> = useRef<StandardEventSource | null>(null);
    const suppressClickRef: MutableRefObject<boolean> = useRef<boolean>(false);

    useEffect((): void => {
        optionsRef.current = options;
    }, [options]);

    const emit: (init: StandardEventInit) => void = useCallback((init: StandardEventInit): void => {
        const current: StandardEventOptions = optionsRef.current;

        if (current.disabled === true) {
            return;
        }

        const event: StandardEvent = createStandardEvent(init);

        if (event.type === "press") {
            lastSourceRef.current = event.source;
            suppressClickRef.current = false;
            setPressed(true);
        } else if (event.type === "enter") {
            setHovered(true);
        } else if (event.type === "leave") {
            setHovered(false);
        } else if (event.type === "drag") {
            if (event.phase === "start") {
                suppressClickRef.current = true;
                setDragging(true);
            } else if (event.phase === "end") {
                setDragging(false);
            }
        } else if (event.type === "click") {
            if (suppressClickRef.current) {
                suppressClickRef.current = false;

                return;
            }

            const now: number = performance.now();
            const last: ContinuousClick | null = continuousRef.current;
            const interval: number = current.continuousInterval ?? 300;
            const slop: number = current.continuousSlop ?? 10;
            const count: number =
                last !== null && now - last.time <= interval && Math.hypot(event.x - last.x, event.y - last.y) <= slop
                    ? last.count + 1
                    : 1;
            const clickEvent: StandardEvent = createStandardEvent({
                type: "click",
                x: event.x,
                y: event.y,
                source: event.source,
                target: event.target,
                currentTarget: event.currentTarget,
                count,
                originalEvent: event.originalEvent,
            });

            continuousRef.current = { time: now, x: event.x, y: event.y, count };
            setContinuousCount(count);
            current.click?.(clickEvent);

            if (count >= 2) {
                current.continuous?.(
                    createStandardEvent({
                        type: "continuous",
                        x: event.x,
                        y: event.y,
                        source: event.source,
                        target: event.target,
                        currentTarget: event.currentTarget,
                        count,
                        originalEvent: event.originalEvent,
                    }),
                );
            }

            return;
        }

        current[event.type]?.(event);
    }, []);

    useEffect((): (() => void) | void => {
        if (element === null) {
            return;
        }

        const detachMouse: () => void = registerMouseEvents(element, emit, (): StandardEventOptions => optionsRef.current);
        const detachTouch: () => void = registerTouchEvents(element, emit, (): StandardEventOptions => optionsRef.current);
        const detachKeyboard: () => void = registerKeyboardEvents(element, emit);

        const onClick: (event: MouseEvent) => void = (event: MouseEvent): void => {
            const pointerType: string = (event as MouseEvent & { pointerType?: string }).pointerType ?? "";
            const source: StandardEventSource =
                event.detail === 0
                    ? lastSourceRef.current === "keyboard"
                        ? "keyboard"
                        : "virtual"
                    : pointerType === "touch"
                      ? "touch"
                      : pointerType === "pen"
                        ? "pen"
                        : lastSourceRef.current === "touch"
                          ? "touch"
                          : "mouse";
            const target: Element = event.target instanceof Element ? event.target : element;
            const point: GesturePoint =
                event.detail === 0 ? readCaretPoint(target) : { x: event.clientX, y: event.clientY };

            emit({
                type: "click",
                x: point.x,
                y: point.y,
                source,
                target,
                currentTarget: element,
                count: 1,
                originalEvent: event,
            });
        };
        const onPointerEnd: () => void = (): void => {
            setPressed(false);
            setDragging(false);
        };
        const onBlur: () => void = (): void => {
            setPressed(false);
            setHovered(false);
            setDragging(false);
        };
        const onKeyUp: () => void = (): void => {
            setPressed(false);
        };

        element.addEventListener("click", onClick);
        element.addEventListener("pointerup", onPointerEnd);
        element.addEventListener("pointercancel", onPointerEnd);
        element.addEventListener("keyup", onKeyUp);
        window.addEventListener("blur", onBlur);

        return (): void => {
            detachMouse();
            detachTouch();
            detachKeyboard();
            element.removeEventListener("click", onClick);
            element.removeEventListener("pointerup", onPointerEnd);
            element.removeEventListener("pointercancel", onPointerEnd);
            element.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("blur", onBlur);
        };
    }, [element, emit]);

    const ref: RefCallback<HTMLElement> = useCallback((node: HTMLElement | null): void => {
        setElement(node);
    }, []);

    return {
        ref,
        state: {
            pressed,
            hovered,
            continuousCount,
            dragging,
        },
    };
};

export default useStandardEvents;
