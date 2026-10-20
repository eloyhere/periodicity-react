import { useMemo, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../component/foundation/cx";
import { AnimationContext, resolveAnimation, useAnimation } from "./context";
import { animationStyle, type AnimationStyle } from "./presets";
import type { AnimationContextValue, AnimationOptions } from "./types";
import "./animation.css";

/**
 * Props for the Animation provider.
 * Type: interface.
 * @param children - Subtree that inherits the animation configuration.
 * @param enabled - Enables or disables preset animations for the subtree.
 * @param preset - Default preset for descendants.
 * @param duration - Default duration in milliseconds.
 * @param delay - Default delay in milliseconds.
 * @param easing - Default CSS timing function.
 * @param reducedMotion - Reduced-motion behaviour for the subtree.
 * @param className - Extra classes applied to the configuration scope.
 * @param style - Extra styles applied to the configuration scope.
 * @example
 * <Animation preset="slide-up" duration={320} reducedMotion="system">
 *     <Card>Hello</Card>
 * </Animation>
 */
export interface AnimationProps extends AnimationOptions, Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Provides animation configuration to a subtree.
 * Nested providers inherit unspecified options and override the rest locally.
 * @param props - Configuration overrides, scope attributes, and children.
 * @example
 * <Animation enabled={false}>
 *     <Toolbar />
 * </Animation>
 * @returns The configured provider scope.
 */
const Animation: FC<AnimationProps> = ({
    enabled,
    preset,
    duration,
    delay,
    easing,
    reducedMotion,
    children,
    className = "",
    style,
    ref,
    ...rest
}: AnimationProps) => {
    const parent: AnimationContextValue = useAnimation();
    const value: AnimationContextValue = useMemo<AnimationContextValue>(
        () =>
            resolveAnimation(
                {
                    enabled: enabled ?? parent.enabled,
                    preset: preset ?? parent.preset,
                    duration: duration ?? parent.duration,
                    delay: delay ?? parent.delay,
                    easing: easing ?? parent.easing,
                    reducedMotion: reducedMotion ?? parent.reducedMotion,
                },
                parent.prefersReducedMotion,
            ),
        [
            enabled,
            preset,
            duration,
            delay,
            easing,
            reducedMotion,
            parent.enabled,
            parent.preset,
            parent.duration,
            parent.delay,
            parent.easing,
            parent.reducedMotion,
            parent.prefersReducedMotion,
        ],
    );
    const scopeStyle: AnimationStyle = animationStyle({
        duration: value.resolvedDuration,
        delay: value.resolvedDelay,
        easing: value.easing,
        enabled: value.enabled,
        reduced: value.reduced,
    });

    return (
        <AnimationContext.Provider value={value}>
            <div
                {...rest}
                ref={ref}
                className={cx("animation-scope", className)}
                style={{ ...scopeStyle, ...style }}
                data-animation={value.enabled ? "enabled" : "disabled"}
                data-animation-preset={value.preset}
                data-animation-reduced={value.reduced ? "true" : "false"}
            >
                {children}
            </div>
        </AnimationContext.Provider>
    );
};

export default Animation;
