import { createElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { isReducedMotion, useAnimation } from "./context";
import { animationClassName, animationStyle, type AnimationStyle } from "./presets";
import type {
    AnimationContextValue,
    AnimationOptions,
    AnimationPreset,
    AnimatedElement,
    AnimatedElementAttributes,
    ReducedMotionBehaviour,
} from "./types";
import "./animation.css";

/**
 * Style object that accepts CSS custom properties alongside native style declarations.
 * Type: type alias.
 * Fields: every `CSSProperties` field plus `--*` custom properties.
 * @example
 * const style: AnimatedStyle = { "--animation-duration": "320ms" };
 */
export type AnimatedStyle = CSSProperties & {
    [variable: `--${string}`]: string | number | void;
};

/**
 * Props for the Animated wrapper, typed for the rendered element.
 * Type: type alias.
 * @param element - Native HTML element to render; defaults to `div`.
 * @param preset - Preset for this element; inherits the provider when omitted.
 * @param duration - Duration in milliseconds; inherits the provider when omitted.
 * @param delay - Delay in milliseconds; inherits the provider when omitted.
 * @param easing - CSS timing function; inherits the provider when omitted.
 * @param enabled - Local enablement override.
 * @param reducedMotion - Local reduced-motion behaviour override.
 * @param disableAnimation - Forces animation off for this element; takes precedence over `enabled`.
 * @param children - Content rendered inside the element.
 * @param className - Extra classes appended after the preset class.
 * @param style - Extra styles merged over the generated animation variables.
 * @example
 * <Animated element="section" preset="slide-up" delay={80}>
 *     <p>Hello</p>
 * </Animated>
 * @example
 * <Animated element="a" href="/pricing" preset="fade">
 *     Pricing
 * </Animated>
 */
export type AnimatedProps<K extends AnimatedElement = "div"> = AnimationOptions &
    AnimatedElementAttributes<K> & {
        element?: K;
        children?: ReactNode;
        className?: string;
        style?: AnimatedStyle;
        disableAnimation?: boolean;
    };

/**
 * Generic signature of the Animated wrapper.
 * Type: type alias.
 * Fields: none.
 * @example
 * const wrapper: AnimatedComponent = Animated;
 */
export type AnimatedComponent = <K extends AnimatedElement = "div">(props: AnimatedProps<K>) => ReactElement;

/**
 * Renders a polymorphic element with a reusable CSS animation preset.
 * Native attributes, refs, and event handlers are forwarded to the rendered element. The wrapper adds its own
 * class names, animation variables, and data attributes after the forwarded props, so its preset state stays
 * authoritative while caller handlers keep working unchanged.
 * @param props - Element, preset, timing overrides, children, and native attributes for that element.
 * @example
 * <Animated preset="fade" duration={320}>Lovely</Animated>
 * @example
 * <Animated element="button" type="button" onClick={save} preset="scale-in">
 *     Save
 * </Animated>
 * @returns The animated element.
 */
export const Animated: AnimatedComponent = <K extends AnimatedElement = "div">(
    props: AnimatedProps<K>,
): ReactElement => {
    const {
        element = "div" as K,
        preset,
        duration,
        delay,
        easing,
        enabled,
        reducedMotion,
        disableAnimation = false,
        children,
        className = "",
        style,
        ...rest
    }: AnimatedProps<K> = props;
    const context: AnimationContextValue = useAnimation();
    const activePreset: AnimationPreset = preset ?? context.preset;
    const activeDuration: number = duration ?? context.duration;
    const activeDelay: number = delay ?? context.delay;
    const activeEasing: string = easing ?? context.easing;
    const activeEnabled: boolean = disableAnimation ? false : (enabled ?? context.enabled);
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
export const Animate: AnimatedComponent = Animated;

export default Animated;
