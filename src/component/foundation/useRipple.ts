import type { KeyboardEvent, PointerEvent } from "react";
import {
    measureCenteredRipple,
    measureRipple,
    rippleColour,
    type RippleGeometry,
} from "../../animation/ripple";
import "../../animation/ripple/ripple.css";

/**
 * Events that spawn a ripple.
 * Type: type alias.
 * Fields: none.
 * @example
 * const trigger: RippleTrigger = "click";
 */
export type RippleTrigger = "click" | "hover" | "both";

/**
 * Options for the reusable pointer ripple.
 * Type: interface.
 * Fields: trigger, disabled.
 * @example
 * const ripple = useRipple({ trigger: "both" });
 */
export interface UseRippleOptions {
    trigger?: RippleTrigger;
    disabled?: boolean;
}

/**
 * Event handlers that paint a ripple inside the current target.
 * Type: interface.
 * Fields: onPointerDown, onPointerEnter, onKeyDown.
 * @example
 * <span {...ripple}>Ripple</span>
 */
export interface RippleHandlers {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Paints one ripple into a host element and removes it when its animation ends.
 * @param element - Element that owns the ripple; it should be positioned and clipped by CSS.
 * @param clientX - Optional viewport pointer X; omit for a centred ripple.
 * @param clientY - Optional viewport pointer Y; omit for a centred ripple.
 * @example
 * paintRipple(host, 120, 80);
 */
export const paintRipple: (
    element: HTMLElement,
    clientX?: number,
    clientY?: number,
    colourElement?: HTMLElement,
) => void = (
    element: HTMLElement,
    clientX?: number,
    clientY?: number,
    colourElement?: HTMLElement,
): void => {
    const bounds: DOMRect = element.getBoundingClientRect();

    if (bounds.width <= 0 || bounds.height <= 0) {
        return;
    }

    const geometry: RippleGeometry =
        clientX === (void 0) || clientY === (void 0)
            ? measureCenteredRipple(bounds)
            : measureRipple(bounds, clientX, clientY);
    const ripple: HTMLSpanElement = document.createElement("span");
    element.querySelectorAll(":scope > .ripple").forEach((existing: Element): void => {
        existing.remove();
    });
    ripple.className = "ripple";
    ripple.style.setProperty("--ripple-x", `${geometry.x}px`);
    ripple.style.setProperty("--ripple-y", `${geometry.y}px`);
    ripple.style.setProperty("--ripple-size", `${geometry.size}px`);
    ripple.style.setProperty("--ripple-color", rippleColour(colourElement ?? element));
    ripple.setAttribute("aria-hidden", "true");
    element.append(ripple);

    const remove: () => void = (): void => {
        ripple.remove();
    };

    ripple.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, 1200);
};

/**
 * Provides a lightweight ripple for non-Surface elements such as badges, tags,
 * avatars, links, and state layers. The host needs `position: relative` and
 * `overflow: hidden` in CSS.
 * @param options - Trigger mode and disabled state.
 * @example
 * const ripple = useRipple({ trigger: "click" });
 * <span {...ripple}>Tag</span>
 * @returns Pointer and keyboard handlers that spawn and clean up ripples.
 */
export const useRipple: (options?: UseRippleOptions) => RippleHandlers = (
    options: UseRippleOptions = {},
): RippleHandlers => {
    const trigger: RippleTrigger = options.trigger ?? "click";
    const disabled: boolean = options.disabled ?? false;

    const onPointerDown: (event: PointerEvent<HTMLElement>) => void = (
        event: PointerEvent<HTMLElement>,
    ): void => {
        if (disabled || event.button !== 0) {
            return;
        }

        paintRipple(event.currentTarget, event.clientX, event.clientY);
    };

    const onPointerEnter: (event: PointerEvent<HTMLElement>) => void = (
        event: PointerEvent<HTMLElement>,
    ): void => {
        if (disabled || (trigger !== "hover" && trigger !== "both")) {
            return;
        }

        paintRipple(event.currentTarget, event.clientX, event.clientY);
    };

    const onKeyDown: (event: KeyboardEvent<HTMLElement>) => void = (
        event: KeyboardEvent<HTMLElement>,
    ): void => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }

        paintRipple(event.currentTarget);
    };

    return { onPointerDown, onPointerEnter, onKeyDown };
};

export default useRipple;
