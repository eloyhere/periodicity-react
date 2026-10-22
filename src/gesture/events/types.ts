/**
 * Standard component-facing event names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: StandardEventName = "click";
 */
export type StandardEventName =
    | "over"
    | "enter"
    | "leave"
    | "wheel"
    | "click"
    | "press"
    | "input"
    | "continuous"
    | "drag";

/**
 * Drag phase carried by a drag event.
 * Type: type alias.
 * Fields: none.
 * @example
 * const phase: StandardDragPhase = "start";
 */
export type StandardDragPhase = "start" | "move" | "end";

/**
 * Source that produced a standard event.
 * Type: type alias.
 * Fields: none.
 * @example
 * const source: StandardEventSource = "touch";
 */
export type StandardEventSource = "mouse" | "touch" | "pen" | "keyboard" | "virtual";

/**
 * Normalised event delivered to component callbacks.
 * Type: interface.
 * @param type - Standard event name.
 * @param x - Viewport X coordinate.
 * @param y - Viewport Y coordinate.
 * @param source - Device source.
 * @param target - Original event target.
 * @param currentTarget - Element that owns the handler.
 * @param count - Click count; 1 for a normal click, 2+ for continuous clicks.
 * @param value - Input value for input events.
 * @param deltaX - Wheel X delta.
 * @param deltaY - Wheel Y delta.
 * @param deltaMode - Wheel delta mode.
 * @param originalEvent - Native event.
 * @example
 * const handler: StandardEventHandler = (event: StandardEvent): void => {
 *     console.log(event.type, event.x, event.y);
 * };
 */
export interface StandardEvent {
    readonly type: StandardEventName;
    readonly x: number;
    readonly y: number;
    readonly source: StandardEventSource;
    readonly target: Element;
    readonly currentTarget: Element;
    readonly count: number;
    readonly value?: string;
    readonly deltaX?: number;
    readonly deltaY?: number;
    readonly deltaMode?: number;
    readonly totalDeltaX?: number;
    readonly totalDeltaY?: number;
    readonly phase?: StandardDragPhase;
    readonly originalEvent: Event;
    preventDefault(): void;
    stopPropagation(): void;
}

/**
 * Callback signature for standard events.
 * Type: type alias.
 * Fields: none.
 * @example
 * const onClick: StandardEventHandler = (event: StandardEvent): void => save(event);
 */
export type StandardEventHandler = (event: StandardEvent) => void;

/**
 * Component-facing event options.
 * Type: interface.
 * @param over - Pointer moved over the element.
 * @param enter - Pointer entered the element.
 * @param leave - Pointer left the element.
 * @param wheel - Wheel or trackpad input.
 * @param click - Click activation.
 * @param press - Pointer or keyboard press start.
 * @param input - Text input event.
 * @param continuous - Second and later clicks inside the continuous window.
 * @param drag - Drag start, move, and end.
 * @param continuousInterval - Maximum gap between continuous clicks.
 * @param continuousSlop - Maximum distance between continuous clicks.
 * @param dragThreshold - Movement before a press becomes a drag.
 * @param disabled - Whether every handler is disabled.
 * @example
 * const options: StandardEventOptions = { click: save, continuous: zoom };
 */
export interface StandardEventOptions {
    readonly over?: StandardEventHandler;
    readonly enter?: StandardEventHandler;
    readonly leave?: StandardEventHandler;
    readonly wheel?: StandardEventHandler;
    readonly click?: StandardEventHandler;
    readonly press?: StandardEventHandler;
    readonly input?: StandardEventHandler;
    readonly continuous?: StandardEventHandler;
    readonly drag?: StandardEventHandler;
    readonly continuousInterval?: number;
    readonly continuousSlop?: number;
    readonly dragThreshold?: number;
    readonly disabled?: boolean;
}

/**
 * State exposed by the standard event hook.
 * Type: interface.
 * @param pressed - Whether a press is active.
 * @param hovered - Whether the pointer is inside the element.
 * @param continuousCount - Current click count in the continuous window.
 * @param dragging - Whether a drag is active.
 * @example
 * const state: StandardEventState = { pressed: false, hovered: true, continuousCount: 1, dragging: false };
 */
export interface StandardEventState {
    readonly pressed: boolean;
    readonly hovered: boolean;
    readonly continuousCount: number;
    readonly dragging: boolean;
}

/**
 * Internal initialiser used by device modules.
 * Type: interface.
 * @param type - Standard event name.
 * @param x - Viewport X coordinate.
 * @param y - Viewport Y coordinate.
 * @param source - Device source.
 * @param target - Original event target.
 * @param currentTarget - Element that owns the handler.
 * @param count - Click count.
 * @param value - Input value.
 * @param deltaX - Wheel or drag X delta.
 * @param deltaY - Wheel or drag Y delta.
 * @param deltaMode - Wheel delta mode.
 * @param totalDeltaX - Drag X distance since press.
 * @param totalDeltaY - Drag Y distance since press.
 * @param phase - Drag phase.
 * @param originalEvent - Native event.
 * @example
 * emit({ type: "press", x: 10, y: 20, source: "mouse", target, currentTarget: element, originalEvent: event });
 */
export interface StandardEventInit {
    readonly type: StandardEventName;
    readonly x: number;
    readonly y: number;
    readonly source: StandardEventSource;
    readonly target: Element;
    readonly currentTarget: Element;
    readonly count?: number;
    readonly value?: string;
    readonly deltaX?: number;
    readonly deltaY?: number;
    readonly deltaMode?: number;
    readonly totalDeltaX?: number;
    readonly totalDeltaY?: number;
    readonly phase?: StandardDragPhase;
    readonly originalEvent: Event;
}

/**
 * Emitter implemented by the hook and called by device modules.
 * Type: type alias.
 * Fields: none.
 * @example
 * const emit: StandardEventEmitter = (init): void => handlers[init.type]?.(createStandardEvent(init));
 */
export type StandardEventEmitter = (init: StandardEventInit) => void;
