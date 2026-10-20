import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type SetStateAction,
} from "react";
import cx from "../component/foundation/cx";
import {
    ThemeContext,
    type ResolvedThemeMode,
    type ThemeContextValue,
    type ThemeDensity,
    type ThemeMode,
    type ThemeRadius,
    type ThemeTokens,
} from "./ThemeContext";
import { getThemePreset, type ThemePreset, type ThemePresetId } from "./ThemePresets";
import "./Theme.css";

const SystemPreferenceQuery: string = "(prefers-color-scheme: dark)";
const emptyTokens: ThemeTokens = {};
const emptyStyle: CSSProperties = {};

/**
 * Style object that accepts CSS custom properties alongside native style declarations.
 * Type: type alias.
 * Fields: every `CSSProperties` field plus `--*` custom properties.
 * @example
 * const style: ThemeStyle = { color: "red", "--accent": "#f48fb1" };
 */
export type ThemeStyle = CSSProperties & {
    [variable: `--${string}`]: string | number | void;
};

/**
 * Props for the scoped Theme provider.
 * Type: interface.
 * @param children - Subtree that receives the scoped tokens and context.
 * @param theme - Controlled preset applied to the subtree.
 * @param defaultTheme - Initial preset when the provider is uncontrolled.
 * @param onThemeChange - Called whenever a descendant selects a preset.
 * @param mode - Controlled preference: `light`, `dark`, or `system`. Wins over the preset mode.
 * @param defaultMode - Initial preference when the provider is uncontrolled.
 * @param onModeChange - Called whenever a descendant requests a new preference.
 * @param tokens - Controlled CSS custom property overrides; always wins over preset tokens.
 * @param defaultTokens - Initial token overrides when the provider is uncontrolled.
 * @param onTokensChange - Called whenever a descendant requests token overrides.
 * @param density - Controlled control density for the subtree.
 * @param defaultDensity - Initial density when the provider is uncontrolled.
 * @param onDensityChange - Called whenever a descendant requests a new density.
 * @param radius - Controlled corner treatment for the subtree.
 * @param defaultRadius - Initial corner treatment when the provider is uncontrolled.
 * @param onRadiusChange - Called whenever a descendant requests a new corner treatment.
 * @param className - Additional class name for the wrapper.
 * @param style - Native styles and CSS custom properties applied on the wrapper.
 * @param ref - Reference to the wrapper element.
 * @example
 * <Theme theme="space-gray" density="compact">
 *     <App />
 * </Theme>
 * @example
 * <Theme theme="milk" mode="dark" tokens={{ "--accent": "#f48fb1" }}>
 *     <App />
 * </Theme>
 * @example
 * <Theme mode="system">
 *     <Dashboard />
 * </Theme>
 */
export interface ThemeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "style"> {
    children?: ReactNode;
    theme?: ThemePresetId;
    defaultTheme?: ThemePresetId;
    onThemeChange?: (theme: ThemePresetId) => void;
    mode?: ThemeMode;
    defaultMode?: ThemeMode;
    onModeChange?: (mode: ThemeMode) => void;
    tokens?: ThemeTokens;
    defaultTokens?: ThemeTokens;
    onTokensChange?: (tokens: ThemeTokens) => void;
    density?: ThemeDensity;
    defaultDensity?: ThemeDensity;
    onDensityChange?: (density: ThemeDensity) => void;
    radius?: ThemeRadius;
    defaultRadius?: ThemeRadius;
    onRadiusChange?: (radius: ThemeRadius) => void;
    className?: string;
    style?: ThemeStyle;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Reads the operating system colour preference, with a light fallback for non-browser runtimes.
 * @returns The resolved preference reported by `prefers-color-scheme`.
 * @example
 * const initial: ResolvedThemeMode = readSystemPreference();
 */
const readSystemPreference: () => ResolvedThemeMode = (): ResolvedThemeMode => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return "light";
    }

    return window.matchMedia(SystemPreferenceQuery).matches ? "dark" : "light";
};

/**
 * Provides scoped theme presets, tokens, density, shape, and appearance to descendants.
 * Type: function component.
 * @param props - Children, controlled or uncontrolled preset, mode, tokens, density, radius, callbacks, and
 * native div attributes or events.
 * @example
 * <Theme theme="sky-blue" density="compact" onThemeChange={(id: ThemePresetId): void => setThemeId(id)}>
 *     <Panel />
 * </Theme>
 * @returns A themed wrapper with a provider for `useTheme`.
 */
const Theme: FC<ThemeProps> = ({
    children,
    theme,
    defaultTheme,
    onThemeChange,
    mode,
    defaultMode,
    onModeChange,
    tokens,
    defaultTokens,
    onTokensChange,
    density,
    defaultDensity,
    onDensityChange,
    radius,
    defaultRadius,
    onRadiusChange,
    className = "",
    style,
    ref,
    ...rest
}: ThemeProps) => {
    const parent: ThemeContextValue = useContext(ThemeContext);
    const [internalTheme, setInternalTheme]: [
        ThemePresetId | null,
        Dispatch<SetStateAction<ThemePresetId | null>>,
    ] = useState<ThemePresetId | null>(defaultTheme ?? null);
    const [internalMode, setInternalMode]: [ThemeMode | null, Dispatch<SetStateAction<ThemeMode | null>>] =
        useState<ThemeMode | null>(defaultMode ?? null);
    const [internalDensity, setInternalDensity]: [
        ThemeDensity | null,
        Dispatch<SetStateAction<ThemeDensity | null>>,
    ] = useState<ThemeDensity | null>(defaultDensity ?? null);
    const [internalRadius, setInternalRadius]: [
        ThemeRadius | null,
        Dispatch<SetStateAction<ThemeRadius | null>>,
    ] = useState<ThemeRadius | null>(defaultRadius ?? null);
    const [internalTokens, setInternalTokens]: [
        ThemeTokens | null,
        Dispatch<SetStateAction<ThemeTokens | null>>,
    ] = useState<ThemeTokens | null>(defaultTokens ?? null);
    const [systemMode, setSystemMode]: [
        ResolvedThemeMode,
        Dispatch<SetStateAction<ResolvedThemeMode>>,
    ] = useState<ResolvedThemeMode>(readSystemPreference);
    const themeId: ThemePresetId = theme ?? internalTheme ?? parent.theme;
    const presetRequested: boolean = theme !== (void 0) || internalTheme !== null;
    const preset: ThemePreset = getThemePreset(themeId);
    const presetTokens: ThemeTokens = presetRequested ? preset.tokens : emptyTokens;
    const presetMode: ThemeMode | null = presetRequested ? preset.mode : null;
    const currentMode: ThemeMode = mode ?? internalMode ?? presetMode ?? parent.mode;
    const resolvedMode: ResolvedThemeMode = currentMode === "system" ? systemMode : currentMode;
    const resolvedDensity: ThemeDensity = density ?? internalDensity ?? parent.density;
    const resolvedRadius: ThemeRadius = radius ?? internalRadius ?? parent.radius;

    useEffect((): (() => void) | void => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }

        const mediaQuery: MediaQueryList = window.matchMedia(SystemPreferenceQuery);
        const handleChange: (event: MediaQueryListEvent) => void = (event: MediaQueryListEvent): void => {
            setSystemMode(event.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);

        return (): void => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    const effectiveTokens: ThemeTokens = useMemo<ThemeTokens>(
        () => ({
            ...parent.tokens,
            ...presetTokens,
            ...(internalTokens ?? emptyTokens),
            ...(tokens ?? emptyTokens),
        }),
        [internalTokens, parent.tokens, presetTokens, tokens],
    );

    const setTheme: (theme: ThemePresetId) => void = useCallback(
        (next: ThemePresetId): void => {
            if (theme === (void 0)) {
                setInternalTheme(next);
                setInternalMode(null);
            }

            onThemeChange?.(next);
        },
        [onThemeChange, theme],
    );

    const setMode: (mode: ThemeMode) => void = useCallback(
        (next: ThemeMode): void => {
            setInternalMode(next);
            onModeChange?.(next);
        },
        [onModeChange],
    );

    const setDensity: (density: ThemeDensity) => void = useCallback(
        (next: ThemeDensity): void => {
            if (density === (void 0)) {
                setInternalDensity(next);
            }

            onDensityChange?.(next);
        },
        [density, onDensityChange],
    );

    const setRadius: (radius: ThemeRadius) => void = useCallback(
        (next: ThemeRadius): void => {
            if (radius === (void 0)) {
                setInternalRadius(next);
            }

            onRadiusChange?.(next);
        },
        [onRadiusChange, radius],
    );

    const setTokens: (tokens: ThemeTokens) => void = useCallback(
        (next: ThemeTokens): void => {
            if (tokens === (void 0)) {
                setInternalTokens((current: ThemeTokens | null): ThemeTokens => ({
                    ...(current ?? emptyTokens),
                    ...next,
                }));
            }

            onTokensChange?.(next);
        },
        [onTokensChange, tokens],
    );

    const themeStyle: ThemeStyle = {
        ...(style ?? emptyStyle),
        ...effectiveTokens,
        colorScheme: resolvedMode,
    };

    const contextValue: ThemeContextValue = useMemo<ThemeContextValue>(
        () => ({
            theme: themeId,
            mode: currentMode,
            resolvedMode,
            density: resolvedDensity,
            radius: resolvedRadius,
            tokens: effectiveTokens,
            setTheme,
            setMode,
            setDensity,
            setRadius,
            setTokens,
        }),
        [
            currentMode,
            effectiveTokens,
            resolvedDensity,
            resolvedMode,
            resolvedRadius,
            setDensity,
            setMode,
            setRadius,
            setTheme,
            setTokens,
            themeId,
        ],
    );

    // `data-theme` keeps the resolved mode used by the shared palette CSS; `data-preset` exposes the preset
    // for debugging without invalidating the light/dark rules in tokens.css.
    return (
        <ThemeContext.Provider value={contextValue}>
            <div
                {...rest}
                ref={ref}
                className={cx("periodicity-theme", className)}
                data-theme={resolvedMode}
                data-preset={themeId}
                data-mode={currentMode}
                data-density={resolvedDensity}
                data-radius={resolvedRadius}
                style={themeStyle}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export default Theme;
