import type { HTMLElementType, JSX } from "react";

/**
 * Visual preset applied by the animation system.
 * Type: type alias.
 * Fields: none, fade, slide-up, slide-down, slide-left, slide-right, scale-in, collapse, expand, pulse, spin.
 * @example
 * const preset: AnimationPreset = "slide-up";
 */
export type AnimationPreset =
    | "none"
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "scale-in"
    | "collapse"
    | "expand"
    | "pulse"
    | "spin";

/**
 * How a provider resolves the operating-system reduced-motion preference.
 * Type: type alias.
 * Fields: system (follow the media query), always (force reduced motion), never (ignore it).
 * @example
 * const behaviour: ReducedMotionBehaviour = "system";
 */
export type ReducedMotionBehaviour = "system" | "always" | "never";

/**
 * Native HTML element names accepted by the Animated wrapper.
 * Every intrinsic HTML tag is supported, so element-specific attributes and events remain typed.
 * Type: type alias.
 * Fields: every HTML tag name understood by React.
 * @example
 * const element: AnimatedElement = "section";
 */
export type AnimatedElement = Extract<keyof JSX.IntrinsicElements, HTMLElementType>;

/**
 * Native attributes accepted by one animated element, excluding props owned by the wrapper.
 * Type: type alias.
 * Fields: every intrinsic attribute and event for `K`, including `ref`.
 * @example
 * const props: AnimatedElementAttributes<"a"> = { href: "/pricing" };
 */
export type AnimatedElementAttributes<K extends AnimatedElement> = Omit<
    JSX.IntrinsicElements[K],
    "children" | "className" | "style"
>;

/**
 * Animation settings shared by the Animation provider and the Animated wrapper.
 * Type: interface.
 * @param enabled - Whether preset animations may run.
 * @param preset - Visual preset applied to descendants.
 * @param duration - Animation duration in milliseconds.
 * @param delay - Delay before the animation starts, in milliseconds.
 * @param easing - CSS timing function.
 * @param reducedMotion - How the operating-system reduced-motion preference is handled.
 * @example
 * const config: AnimationConfig = {
 *     enabled: true,
 *     preset: "fade",
 *     duration: 220,
 *     delay: 0,
 *     easing: "var(--ease-standard)",
 *     reducedMotion: "system",
 * };
 */
export interface AnimationConfig {
    enabled: boolean;
    preset: AnimationPreset;
    duration: number;
    delay: number;
    easing: string;
    reducedMotion: ReducedMotionBehaviour;
}

/**
 * Optional animation overrides accepted by the provider and the wrapper.
 * Type: type alias.
 * Fields: every AnimationConfig field, each optional.
 * @example
 * const options: AnimationOptions = { preset: "scale-in", duration: 320 };
 */
export type AnimationOptions = Partial<AnimationConfig>;

/**
 * Key of one animation configuration field.
 * Type: type alias.
 * Fields: enabled, preset, duration, delay, easing, reducedMotion.
 * @example
 * const key: AnimationConfigKey = "duration";
 */
export type AnimationConfigKey = keyof AnimationConfig;

/**
 * Resolved animation state exposed by useAnimation and the default context.
 * Type: interface.
 * @param prefersReducedMotion - Whether the operating system requests reduced motion.
 * @param reduced - Whether reduced motion is active after applying the behaviour.
 * @param resolvedDuration - Duration after disabled and reduced-motion handling, in milliseconds.
 * @param resolvedDelay - Delay after disabled and reduced-motion handling, in milliseconds.
 * @param setConfig - Requests a configuration change from a descendant.
 * @example
 * const animation: AnimationContextValue = useAnimation();
 * const duration: number = animation.resolvedDuration;
 * animation.setConfig({ duration: 320 });
 */
export interface AnimationContextValue extends Readonly<AnimationConfig> {
    readonly prefersReducedMotion: boolean;
    readonly reduced: boolean;
    readonly resolvedDuration: number;
    readonly resolvedDelay: number;
    readonly setConfig: (config: AnimationOptions) => void;
}
