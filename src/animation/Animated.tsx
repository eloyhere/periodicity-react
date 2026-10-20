import { createElement, type AllHTMLAttributes, type CSSProperties, type FC, type ReactNode } from "react";
import { isReducedMotion, useAnimation } from "./context";
import { animationClassName, animationStyle, type AnimationStyle } from "./presets";
import type {
    AnimationContextValue,
    AnimationOptions,
    AnimationPreset,
    AnimatedElement,
    ReducedMotionBehaviour,
} from "./types";
import "./animation.css";

/**
 * Props for the Animated wrapper.
 * Type: interface.
 * @param element - HTML element to render; defaults to `div`.
 * @param preset - Preset for this element; inherits the provider when omitted.
 * @param duration - Duration in milliseconds; inherits the provider when omitted.
 * @param delay - Delay in milliseconds; inherits the provider when omitted.
 * @param easing - CSS timing function; inherits the provider when omitted.
 * @param enabled - Local enablement override.
 * @param reducedMotion - Local reduced-motion behaviour override.
 * @param children - Content rendered inside the element.
 * @param className - Extra classes appended after the preset class.
 * @param style - Extra styles merged over the generated animation variables.
 * @example
 * <Animated element="section" preset="slide-up" delay={80}>
 *     <p>Hello</p>
 * </Animated>
 */
export interface AnimatedProps extends AnimationOptions, Omit<AllHTMLAttributes<HTMLElement>, "children"> {
    element?: AnimatedElement;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

/**
 * Renders a polymorphic element with a reusable CSS animation preset.
 * @param props - Element, preset, timing overrides, children, and native attributes.
 * @example
 * <Animated preset="fade" duration={320}>Lovely</Animated>
 * @returns The animated element.
 */
export const Animated: FC<AnimatedProps> = ({
    element = "div",
    preset,
    duration,
    delay,
    easing,
    enabled,
    reducedMotion,
    children,
    className = "",
    style,
    ...rest
}: AnimatedProps) => {
    const context: AnimationContextValue = useAnimation();
    const activePreset: AnimationPreset = preset ?? context.preset;
    const activeDuration: number = duration ?? context.duration;
    const activeDelay: number = delay ?? context.delay;
    const activeEasing: string = easing ?? context.easing;
    const activeEnabled: boolean = enabled ?? context.enabled;
    const behaviour: ReducedMotionBehaviour = reducedMotion ?? context.reducedMotion;
    const reduced: boolean = isReducedMotion(behaviour, context.prefersReducedMotion);
    const motionStyle: AnimationStyle = animationStyle({
        duration: activeDuration,
        delay: activeDelay,
        easing: activeEasing,
        enabled: activeEnabled,
        reduced,
    });

    return createElement(
        element,
        {
            ...rest,
            className: animationClassName({
                preset: activePreset,
                enabled: activeEnabled,
                reduced,
                className,
            }),
            style: { ...motionStyle, ...style },
            ["data-animation"]: activeEnabled ? "enabled" : "disabled",
            ["data-animation-preset"]: activePreset,
            ["data-animation-reduced"]: reduced ? "true" : "false",
        },
        children,
    );
};

/**
 * Alias of Animated for callers that prefer the shorter name.
 * Type: function component.
 * @example
 * <Animate preset="fade">Hello</Animate>
 */
export const Animate: FC<AnimatedProps> = Animated;

export default Animated;
