import type { CSSProperties } from "react";
import cx from "../component/foundation/cx";
import { DefaultAnimation } from "./context";
import type { AnimationPreset } from "./types";

/**
 * Every preset understood by the animation system.
 * Type: constant.
 * Fields: none, fade, slide-up, slide-down, slide-left, slide-right, scale-in, collapse, expand, pulse, spin.
 * @example
 * const presets: readonly AnimationPreset[] = AnimationPresets;
 */
export const AnimationPresets: readonly AnimationPreset[] = [
    "none",
    "fade",
    "slide-up",
    "slide-down",
    "slide-left",
    "slide-right",
    "scale-in",
    "collapse",
    "expand",
    "pulse",
    "spin",
];

/**
 * CSS class that applies each preset.
 * Type: constant.
 * Fields: one class per AnimationPreset.
 * @example
 * const className: string = AnimationPresetClass["slide-up"];
 */
export const AnimationPresetClass: Readonly<Record<AnimationPreset, string>> = Object.fromEntries(
    AnimationPresets.map((preset: AnimationPreset): [AnimationPreset, string] => [preset, `animated--${preset}`]),
) as Readonly<Record<AnimationPreset, string>>;

/**
 * Resolves the CSS class for a single preset.
 * @param preset - Preset whose class is needed.
 * @example
 * const className: string = animationPresetClass("fade");
 * @returns The preset modifier class.
 */
export const animationPresetClass: (preset: AnimationPreset) => string = (preset: AnimationPreset): string =>
    AnimationPresetClass[preset];

/**
 * Options accepted by the class-name helper.
 * Type: interface.
 * @param preset - Preset applied when motion is active.
 * @param enabled - Whether animations are enabled; disabled wrappers get no preset class.
 * @param reduced - Whether reduced motion is active.
 * @param className - Extra classes appended last.
 * @example
 * const options: AnimationClassNameOptions = { preset: "fade", enabled: true, reduced: false };
 */
export interface AnimationClassNameOptions {
    preset?: AnimationPreset;
    enabled?: boolean;
    reduced?: boolean;
    className?: string;
}

/**
 * Builds the class list for an animated element.
 * @param options - Preset, enablement, reduced-motion state, and extra classes.
 * @example
 * const className: string = animationClassName({ preset: "slide-up" });
 * @returns The base class, preset or muted modifier, and extra classes.
 */
export const animationClassName: (options?: AnimationClassNameOptions) => string = (
    options: AnimationClassNameOptions = {},
): string => {
    const {
        preset = DefaultAnimation.preset,
        enabled = DefaultAnimation.enabled,
        reduced = false,
        className = "",
    }: AnimationClassNameOptions = options;

    return cx(
        "animated",
        enabled && !reduced && AnimationPresetClass[preset],
        enabled && reduced && "animated--reduced",
        !enabled && "animated--disabled",
        className,
    );
};

/**
 * Options accepted by the CSS-variable helper.
 * Type: interface.
 * @param duration - Animation duration in milliseconds.
 * @param delay - Delay before the animation starts, in milliseconds.
 * @param easing - CSS timing function.
 * @param enabled - Whether animations are enabled.
 * @param reduced - Whether reduced motion is active.
 * @example
 * const options: AnimationStyleOptions = { duration: 320, delay: 40, reduced: false };
 */
export interface AnimationStyleOptions {
    duration?: number;
    delay?: number;
    easing?: string;
    enabled?: boolean;
    reduced?: boolean;
}

/**
 * CSS variables understood by the animation stylesheet.
 * Type: interface.
 * Fields: --animation-duration, --animation-delay, --animation-easing, and optional --animation-repeat.
 * @example
 * const style: AnimationStyle = animationStyle({ duration: 220 });
 */
export interface AnimationStyle extends CSSProperties {
    "--animation-duration": string;
    "--animation-delay": string;
    "--animation-easing": string;
    "--animation-repeat"?: string;
}

/**
 * Builds the CSS variables consumed by the animation stylesheet.
 * @param options - Duration, delay, easing, enablement, and reduced-motion state.
 * @example
 * const style: AnimationStyle = animationStyle({ duration: 220, delay: 0 });
 * @returns A style object with zeroed timings when motion is muted.
 */
export const animationStyle: (options?: AnimationStyleOptions) => AnimationStyle = (
    options: AnimationStyleOptions = {},
): AnimationStyle => {
    const {
        duration = DefaultAnimation.duration,
        delay = DefaultAnimation.delay,
        easing = DefaultAnimation.easing,
        enabled = DefaultAnimation.enabled,
        reduced = false,
    }: AnimationStyleOptions = options;
    const muted: boolean = !enabled || reduced;
    const style: AnimationStyle = {
        "--animation-duration": `${muted ? 0 : Math.max(0, duration)}ms`,
        "--animation-delay": `${muted ? 0 : Math.max(0, delay)}ms`,
        "--animation-easing": easing,
    };

    if (muted) {
        style["--animation-repeat"] = "1";
    }

    return style;
};
