import type { StandardEventEmitter, StandardEventOptions } from "../events/types";

/**
 * Registers mouse hover, wheel, press, and drag events on an element.
 * @param element - Element that owns the handlers.
 * @param emit - Standard event emitter supplied by the hook.
 * @param getOptions - Returns the latest event options.
 * @example
 * const detach: () => void = registerMouseEvents(element, emit, getOptions);
 * @returns A cleanup function.
 */
export const registerMouseEvents: (
    element: HTMLElement,
    emit: StandardEventEmitter,
    getOptions: () => StandardEventOptions,
) => () => void = (
    element: HTMLElement,
    emit: StandardEventEmitter,
    getOptions: () => StandardEventOptions,
): (() => void) => {
    let pressed: boolean = false;
    let dragging: boolean = false;
    let pointerId: number | null = null;
    let startX: number = 0;
    let startY: number = 0;
    let lastX: number = 0;
    let lastY: number = 0;
    let removeGlobal: (() => void) | null = null;

    const onPointerOver: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (event.pointerType !== "mouse") {
            return;
        }

        emit({
            type: "over",
            x: event.clientX,
            y: event.clientY,
            source: "mouse",
            target: event.target instanceof Element ? event.target : element,
            currentTarget: element,
            originalEvent: event,
        });
    };

    const onPointerEnter: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (event.pointerType !== "mouse") {
            return;
        }

        emit({
            type: "enter",
            x: event.clientX,
            y: event.clientY,
            source: "mouse",
            target: event.target instanceof Element ? event.target : element,
            currentTarget: element,
            originalEvent: event,
        });
    };

    const onPointerLeave: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (event.pointerType !== "mouse") {
            return;
        }

        emit({
            type: "leave",
            x: event.clientX,
            y: event.clientY,
            source: "mouse",
            target: event.target instanceof Element ? event.target : element,
            currentTarget: element,
            originalEvent: event,
        });
    };

    const onWheel: (event: WheelEvent) => void = (event: WheelEvent): void => {
        emit({
            type: "wheel",
            x: event.clientX,
            y: event.clientY,
            source: "mouse",
            target: event.target instanceof Element ? event.target : element,
            currentTarget: element,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaMode: event.deltaMode,
            originalEvent: event,
        });
    };

    const finishDrag: (event: PointerEvent) => void = (event: PointerEvent): void => {
        const wasDragging: boolean = dragging;

        if (wasDragging) {
            emit({
                type: "drag",
                phase: "end",
                x: event.clientX,
                y: event.clientY,
                source: "mouse",
                target: event.target instanceof Element ? event.target : element,
                currentTarget: element,
                totalDeltaX: event.clientX - startX,
                totalDeltaY: event.clientY - startY,
                originalEvent: event,
            });
        }

        dragging = false;
        pressed = false;

        removeGlobal?.();
        removeGlobal = null;
        pointerId = null;
    };

    const attachGlobal: () => void = (): void => {
        const documentRef: Document = element.ownerDocument;
        const windowRef: Window | null = documentRef.defaultView;

        if (windowRef === null) {
            return;
        }

        const onMove: (event: PointerEvent) => void = (event: PointerEvent): void => {
            if (event.pointerId !== pointerId) {
                return;
            }

            const totalX: number = event.clientX - startX;
            const totalY: number = event.clientY - startY;
            const threshold: number = getOptions().dragThreshold ?? 6;

            if (!dragging && Math.hypot(totalX, totalY) < threshold) {
                lastX = event.clientX;
                lastY = event.clientY;

                return;
            }

            if (!dragging) {
                dragging = true;
                emit({
                    type: "drag",
                    phase: "start",
                    x: event.clientX,
                    y: event.clientY,
                    source: "mouse",
                    target: event.target instanceof Element ? event.target : element,
                    currentTarget: element,
                    totalDeltaX: totalX,
                    totalDeltaY: totalY,
                    originalEvent: event,
                });
            }

            emit({
                type: "drag",
                phase: "move",
                x: event.clientX,
                y: event.clientY,
                source: "mouse",
                target: event.target instanceof Element ? event.target : element,
                currentTarget: element,
                deltaX: event.clientX - lastX,
                deltaY: event.clientY - lastY,
                totalDeltaX: totalX,
                totalDeltaY: totalY,
                originalEvent: event,
            });

            lastX = event.clientX;
            lastY = event.clientY;
        };
        const onUp: (event: PointerEvent) => void = (event: PointerEvent): void => {
            if (event.pointerId === pointerId) {
                finishDrag(event);
            }
        };
        const onCancel: (event: PointerEvent) => void = (event: PointerEvent): void => {
            if (event.pointerId === pointerId) {
                finishDrag(event);
            }
        };

        windowRef.addEventListener("pointermove", onMove, true);
        windowRef.addEventListener("pointerup", onUp, true);
        windowRef.addEventListener("pointercancel", onCancel, true);

        removeGlobal = (): void => {
            windowRef.removeEventListener("pointermove", onMove, true);
            windowRef.removeEventListener("pointerup", onUp, true);
            windowRef.removeEventListener("pointercancel", onCancel, true);
        };
    };

    const onPointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (event.pointerType !== "mouse" || event.button !== 0 || pressed) {
            return;
        }

        pressed = true;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        lastX = startX;
        lastY = startY;
        emit({
            type: "press",
            x: event.clientX,
            y: event.clientY,
            source: "mouse",
            target: event.target instanceof Element ? event.target : element,
            currentTarget: element,
            originalEvent: event,
        });
        attachGlobal();
    };

    const onPointerUp: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (event.pointerType === "mouse" && event.pointerId === pointerId && !dragging) {
            pressed = false;
            removeGlobal?.();
            removeGlobal = null;
            pointerId = null;
        }
    };

    element.addEventListener("pointerover", onPointerOver);
    element.addEventListener("pointerenter", onPointerEnter);
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointerup", onPointerUp);

    return (): void => {
        element.removeEventListener("pointerover", onPointerOver);
        element.removeEventListener("pointerenter", onPointerEnter);
        element.removeEventListener("pointerleave", onPointerLeave);
        element.removeEventListener("wheel", onWheel);
        element.removeEventListener("pointerdown", onPointerDown);
        element.removeEventListener("pointerup", onPointerUp);
        removeGlobal?.();
        removeGlobal = null;
    };
};

export default registerMouseEvents;
