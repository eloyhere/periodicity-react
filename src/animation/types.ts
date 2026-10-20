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
 * Element types accepted by the Animated wrapper.
 * Type: type alias.
 * Fields: common HTML block, inline, heading, list, and form elements.
 * @example
 * const element: AnimatedElement = "section";
 */
export type AnimatedElement =
    | "div"
    | "span"
    | "p"
    | "section"
    | "article"
    | "header"
    | "footer"
    | "main"
    | "nav"
    | "aside"
    | "form"
    | "ul"
    | "ol"
    | "li"
    | "figure"
    | "figcaption"
    | "a"
    | "button"
    | "label"
    | "strong"
    | "em"
    | "small"
    | "code"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";

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
 * Resolved animation state exposed by useAnimation and the default context.
 * Type: interface.
 * @param prefersReducedMotion - Whether the operating system requests reduced motion.
 * @param reduced - Whether reduced motion is active after applying the behaviour.
 * @param resolvedDuration - Duration after disabled and reduced-motion handling, in milliseconds.
 * @param resolvedDelay - Delay after disabled and reduced-motion handling, in milliseconds.
 * @example
 * const animation: AnimationContextValue = useAnimation();
 * const duration: number = animation.resolvedDuration;
 */
export interface AnimationContextValue extends Readonly<AnimationConfig> {
    readonly prefersReducedMotion: boolean;
    readonly reduced: boolean;
    readonly resolvedDuration: number;
    readonly resolvedDelay: number;
}
