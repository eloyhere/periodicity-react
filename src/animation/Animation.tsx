import {
    useCallback,
    useMemo,
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type SetStateAction,
} from "react";
import cx from "../component/foundation/cx";
import { AnimationContext, resolveAnimation, useAnimation } from "./context";
import { animationStyle, type AnimationStyle } from "./presets";
import type {
    AnimationConfig,
    AnimationConfigKey,
    AnimationContextValue,
    AnimationOptions,
} from "./types";
import "./animation.css";

const emptyOptions: AnimationOptions = {};

/**
 * Resolves the parent, internal, and explicit configuration layers into one complete configuration.
 * Explicit overrides win, then internal defaults, then inherited values.
 * @param parent - Configuration inherited from the nearest provider.
 * @param internal - Uncontrolled values held by this provider.
 * @param overrides - Controlled values supplied through props.
 * @example
 * const config: AnimationConfig = resolveConfig(parent, { duration: 320 }, { enabled: false });
 * @returns The merged animation configuration.
 */
const resolveConfig: (
    parent: AnimationConfig,
    internal: AnimationOptions,
    overrides: AnimationOptions,
) => AnimationConfig = (
    parent: AnimationConfig,
    internal: AnimationOptions,
    overrides: AnimationOptions,
): AnimationConfig => ({
    enabled: overrides.enabled ?? internal.enabled ?? parent.enabled,
    preset: overrides.preset ?? internal.preset ?? parent.preset,
    duration: overrides.duration ?? internal.duration ?? parent.duration,
    delay: overrides.delay ?? internal.delay ?? parent.delay,
    easing: overrides.easing ?? internal.easing ?? parent.easing,
    reducedMotion: overrides.reducedMotion ?? internal.reducedMotion ?? parent.reducedMotion,
});

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
 * @param config - Controlled configuration object; individual props take precedence over its fields.
 * @param defaultConfig - Initial configuration when this provider is uncontrolled.
 * @param disableAnimation - Forces animation off for the subtree; takes precedence over `enabled` and `config`.
 * @param onConfigChange - Called when a descendant requests a configuration change.
 * @param className - Extra classes applied to the configuration scope.
 * @param style - Extra styles applied to the configuration scope.
 * @param ref - Reference to the configuration scope element.
 * @example
 * <Animation preset="slide-up" duration={320} reducedMotion="system">
 *     <Card>Hello</Card>
 * </Animation>
 * @example
 * <Animation defaultConfig={{ preset: "fade", duration: 220 }} onConfigChange={handleConfigChange}>
 *     <Card>Hello</Card>
 * </Animation>
 */
export interface AnimationProps extends AnimationOptions, Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children?: ReactNode;
    config?: AnimationOptions;
    defaultConfig?: AnimationOptions;
    disableAnimation?: boolean;
    onConfigChange?: (config: AnimationConfig, changed: readonly AnimationConfigKey[]) => void;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Provides animation configuration to a subtree.
 * Nested providers inherit unspecified options and override the rest locally. Native div attributes and events are
 * forwarded unchanged, so the scope can carry ids, roles, ARIA attributes, data attributes, and handlers.
 * @param props - Configuration overrides, uncontrolled defaults, change callbacks, and native div attributes.
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
    config,
    defaultConfig,
    disableAnimation = false,
    onConfigChange,
    children,
    className = "",
    style,
    ref,
    ...rest
}: AnimationProps) => {
    const parent: AnimationContextValue = useAnimation();
    const [internalConfig, setInternalConfig]: [
        AnimationOptions,
        Dispatch<SetStateAction<AnimationOptions>>,
    ] = useState<AnimationOptions>((): AnimationOptions => ({ ...(defaultConfig ?? emptyOptions) }));
    const overrides: AnimationOptions = useMemo<AnimationOptions>(
        () => ({
            enabled: disableAnimation ? false : (enabled ?? config?.enabled),
            preset: preset ?? config?.preset,
            duration: duration ?? config?.duration,
            delay: delay ?? config?.delay,
            easing: easing ?? config?.easing,
            reducedMotion: reducedMotion ?? config?.reducedMotion,
        }),
        [config, delay, disableAnimation, duration, easing, enabled, preset, reducedMotion],
    );
    const resolvedConfig: AnimationConfig = useMemo<AnimationConfig>(
        () => resolveConfig(parent, internalConfig, overrides),
        [internalConfig, overrides, parent],
    );

    const requestConfig: (config: AnimationOptions) => void = useCallback(
        (next: AnimationOptions): void => {
            const applied: AnimationOptions = {};
            const changed: AnimationConfigKey[] = [];

            if (next.enabled !== (void 0)) {
                changed.push("enabled");

                if (overrides.enabled === (void 0)) {
                    applied.enabled = next.enabled;
                }
            }

            if (next.preset !== (void 0)) {
                changed.push("preset");

                if (overrides.preset === (void 0)) {
                    applied.preset = next.preset;
                }
            }

            if (next.duration !== (void 0)) {
                changed.push("duration");

                if (overrides.duration === (void 0)) {
                    applied.duration = next.duration;
                }
            }

            if (next.delay !== (void 0)) {
                changed.push("delay");

                if (overrides.delay === (void 0)) {
                    applied.delay = next.delay;
                }
            }

            if (next.easing !== (void 0)) {
                changed.push("easing");

                if (overrides.easing === (void 0)) {
                    applied.easing = next.easing;
                }
            }

            if (next.reducedMotion !== (void 0)) {
                changed.push("reducedMotion");

                if (overrides.reducedMotion === (void 0)) {
                    applied.reducedMotion = next.reducedMotion;
                }
            }

            if (Object.keys(applied).length > 0) {
                setInternalConfig(
                    (current: AnimationOptions): AnimationOptions => ({ ...current, ...applied }),
                );
            }

            const nextConfig: AnimationConfig = resolveConfig(
                parent,
                { ...internalConfig, ...applied },
                overrides,
            );

            onConfigChange?.(nextConfig, changed);
        },
        [internalConfig, onConfigChange, overrides, parent],
    );

    const value: AnimationContextValue = useMemo<AnimationContextValue>(
        () => resolveAnimation(resolvedConfig, parent.prefersReducedMotion, requestConfig),
        [parent.prefersReducedMotion, requestConfig, resolvedConfig],
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
