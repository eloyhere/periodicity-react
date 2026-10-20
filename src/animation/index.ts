/**
 * Animation public API.
 * Type: barrel module.
 * Fields: ripple helpers, Animation provider, Animated wrapper, presets, and hooks.
 * @example
 * import { Animated, Animation, useAnimation } from "./animation";
 */

export { measureCenteredRipple, measureRipple, rippleColour } from "./ripple/index";
export type { RippleGeometry } from "./ripple/index";
export { default } from "./ripple/index";

export { default as Animation } from "./Animation";
export type { AnimationProps } from "./Animation";
export { Animate, Animated } from "./Animated";
export type { AnimatedComponent, AnimatedProps, AnimatedStyle } from "./Animated";
export {
    AnimationContext,
    DefaultAnimation,
    DefaultAnimationContext,
    isReducedMotion,
    resolveAnimation,
    useAnimation,
} from "./context";
export {
    AnimationPresetClass,
    AnimationPresets,
    animationClassName,
    animationPresetClass,
    animationStyle,
} from "./presets";
export type { AnimationClassNameOptions, AnimationStyle, AnimationStyleOptions } from "./presets";
export type {
    AnimationConfig,
    AnimationConfigKey,
    AnimationContextValue,
    AnimationOptions,
    AnimationPreset,
    AnimatedElement,
    AnimatedElementAttributes,
    ReducedMotionBehaviour,
} from "./types";
export { usePrefersReducedMotion } from "./usePrefersReducedMotion";
