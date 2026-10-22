import {
    useContext,
    useLayoutEffect,
    useMemo,
    useState,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from "react";
import { FontContext, type FontContextValue } from "./context";
import type { FontLevel } from "./types";

/**
 * Computed font metadata for a referenced element.
 * Type: interface.
 * Fields: family, size, color, weight, lineHeight, letterSpacing, transform, element.
 * @example
 * const font: FontInfo = useFont(ref);
 */
export interface FontInfo {
    /** Computed font family. */
    family: string;
    /** Computed font size, usually in pixels. */
    size: string;
    /** Computed text colour. */
    color: string;
    /** Computed font weight. */
    weight: string;
    /** Computed line-height. */
    lineHeight: string;
    /** Computed letter-spacing. */
    letterSpacing: string;
    /** Computed text-transform. */
    transform: string;
    /** Referenced element, or null before mount. */
    element: HTMLElement | null;
}

/**
 * Reads the computed font metadata of a referenced element.
 * The nearest Font scope supplies fallback values before the ref mounts, so a
 * portalled overlay can use the same metadata as its trigger.
 * @param ref - Ref to the element whose computed font metadata is read.
 * @example
 * const font = useFont(triggerRef);
 * <Portal><div style={{ fontFamily: font.family, fontSize: font.size }} /></Portal>
 * @returns Family, size, colour, weight, line-height, letter-spacing, and transform.
 */
export const useFont: (ref: RefObject<HTMLElement | null>) => FontInfo = (
    ref: RefObject<HTMLElement | null>,
): FontInfo => {
    const context: FontContextValue | null = useContext(FontContext);
    const fallback: FontInfo = useMemo((): FontInfo => {
        const level: FontLevel = context?.level ?? "body";

        return {
            family: context?.family ?? "var(--font-sans)",
            size: `var(--type-${level})`,
            color: context?.color ?? "inherit",
            weight: context?.weight ?? "var(--weight-regular)",
            lineHeight: context?.lineHeight ?? "var(--leading-normal)",
            letterSpacing: context?.letterSpacing ?? "var(--tracking-normal)",
            transform: context?.transform ?? "none",
            element: null,
        };
    }, [context]);
    const [info, setInfo]: [FontInfo, Dispatch<SetStateAction<FontInfo>>] =
        useState<FontInfo>(fallback);

    useLayoutEffect((): (() => void) | void => {
        const element: HTMLElement | null = ref.current;

        if (element === null) {
            setInfo(fallback);
            return;
        }

        const update: () => void = (): void => {
            const computed: CSSStyleDeclaration = getComputedStyle(element);

            setInfo({
                family: computed.fontFamily,
                size: computed.fontSize,
                color: computed.color,
                weight: computed.fontWeight,
                lineHeight: computed.lineHeight,
                letterSpacing: computed.letterSpacing,
                transform: computed.textTransform,
                element,
            });
        };

        update();

        if (typeof MutationObserver === "undefined") {
            return;
        }

        const observer: MutationObserver = new MutationObserver(update);
        observer.observe(element, {
            attributes: true,
            attributeFilter: ["class", "style"],
        });

        return (): void => {
            observer.disconnect();
        };
    }, [ref, fallback]);

    return info;
};

export default useFont;
