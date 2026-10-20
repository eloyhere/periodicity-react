import { createContext, useContext, useMemo, type Context } from "react";
import type { AnimationConfig, AnimationContextValue, ReducedMotionBehaviour } from "./types";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Default animation configuration used when no Animation provider is present.
 * Type: constant.
 * Fields: enabled, preset, duration, delay, easing, reducedMotion.
 * @example
 * const duration: number = DefaultAnimation.duration;
 */
export const DefaultAnimation: Readonly<AnimationConfig> = {
    enabled: true,
    preset: "fade",
    duration: 220,
    delay: 0,
    easing: "var(--ease-standard, cubic-bezier(0.2, 0, 0, 1))",
    reducedMotion: "system",
};

/**
 * Resolves whether reduced motion is active for a behaviour and media preference.
 * @param behaviour - Requested reduced-motion behaviour.
 * @param prefersReducedMotion - Whether the operating system requests reduced motion.
 * @example
 * const reduced: boolean = isReducedMotion("system", true);
 * @returns True when motion should be reduced.
 */
export const isReducedMotion: (behaviour: ReducedMotionBehaviour, prefersReducedMotion: boolean) => boolean = (
    behaviour: ReducedMotionBehaviour,
    prefersReducedMotion: boolean,
): boolean => behaviour === "always" || (behaviour === "system" && prefersReducedMotion);

/**
 * Resolves a configuration plus the media preference into a context value.
 * @param config - Requested animation configuration.
 * @param prefersReducedMotion - Whether the operating system requests reduced motion.
 * @example
 * const value: AnimationContextValue = resolveAnimation(DefaultAnimation, true);
 * @returns The resolved context value, with zeroed timings when motion is muted.
 */
export const resolveAnimation: (config: AnimationConfig, prefersReducedMotion: boolean) => AnimationContextValue = (
    config: AnimationConfig,
    prefersReducedMotion: boolean,
): AnimationContextValue => {
    const duration: number = Math.max(0, config.duration);
    const delay: number = Math.max(0, config.delay);
    const reduced: boolean = isReducedMotion(config.reducedMotion, prefersReducedMotion);
    const active: boolean = config.enabled && !reduced;

    return {
        enabled: config.enabled,
        preset: config.preset,
        duration,
        delay,
        easing: config.easing,
        reducedMotion: config.reducedMotion,
        prefersReducedMotion,
        reduced,
        resolvedDuration: active ? duration : 0,
        resolvedDelay: active ? delay : 0,
    };
};

/**
 * Default context consumed when the tree has no Animation provider.
 * Type: constant.
 * Fields: every AnimationContextValue field.
 * @example
 * const fallback: AnimationContextValue = DefaultAnimationContext;
 */
export const DefaultAnimationContext: AnimationContextValue = resolveAnimation(DefaultAnimation, false);

/**
 * Context that carries animation configuration to descendants.
 * Type: constant.
 * Fields: current resolved animation configuration.
 * @example
 * <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>
 */
export const AnimationContext: Context<AnimationContextValue> = createContext<AnimationContextValue>(
    DefaultAnimationContext,
);

/**
 * Reads the animation configuration for the current subtree.
 * Falls back to DefaultAnimation and the live reduced-motion preference.
 * @example
 * const animation: AnimationContextValue = useAnimation();
 * const duration: number = animation.resolvedDuration;
 * @returns The resolved animation context.
 */
export const useAnimation: () => AnimationContextValue = (): AnimationContextValue => {
    const context: AnimationContextValue = useContext(AnimationContext);
    const prefersReducedMotion: boolean = usePrefersReducedMotion();

    return useMemo<AnimationContextValue>(
        () =>
            context === DefaultAnimationContext
                ? resolveAnimation(DefaultAnimation, prefersReducedMotion)
                : context,
        [context, prefersReducedMotion],
    );
};
