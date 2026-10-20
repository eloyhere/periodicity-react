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
import "./Theme.css";

const SystemPreferenceQuery: string = "(prefers-color-scheme: dark)";
const emptyTokens: ThemeTokens = {};
const emptyStyle: CSSProperties = {};

type ThemeStyle = CSSProperties & {
    [variable: `--${string}`]: string | number | void;
};

/**
 * Props for the scoped Theme provider.
 * Type: interface.
 * @param children - Subtree that receives the scoped tokens and context.
 * @param mode - Controlled preference: `light`, `dark`, or `system`.
 * @param defaultMode - Initial preference when the provider is uncontrolled.
 * @param onModeChange - Called whenever a descendant requests a new preference.
 * @param tokens - CSS custom property overrides applied on the wrapper.
 * @param density - Control density for the subtree.
 * @param radius - Corner treatment for the subtree.
 * @param className - Additional class name for the wrapper.
 * @example
 * <Theme mode="dark" density="compact" tokens={{ "--accent": "#f48fb1" }}>
 *     <App />
 * </Theme>
 * @example
 * <Theme mode="system">
 *     <Dashboard />
 * </Theme>
 */
export interface ThemeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children?: ReactNode;
    mode?: ThemeMode;
    defaultMode?: ThemeMode;
    onModeChange?: (mode: ThemeMode) => void;
    tokens?: ThemeTokens;
    density?: ThemeDensity;
    radius?: ThemeRadius;
    className?: string;
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
 * Provides scoped theme tokens, density, shape, and appearance to descendants.
 * Type: function component.
 * @param props - Children, mode controls, token overrides, density, radius, and native attributes.
 * @example
 * <Theme mode="dark" radius="rounded">
 *     <Panel />
 * </Theme>
 * @returns A themed wrapper with a provider for `useTheme`.
 */
const Theme: FC<ThemeProps> = ({
    children,
    mode,
    defaultMode,
    onModeChange,
    tokens,
    density,
    radius,
    className = "",
    style,
    ...rest
}: ThemeProps) => {
    const parent: ThemeContextValue = useContext(ThemeContext);
    const [internalMode, setInternalMode]: [ThemeMode | null, Dispatch<SetStateAction<ThemeMode | null>>] =
        useState<ThemeMode | null>(defaultMode ?? null);
    const [systemMode, setSystemMode]: [
        ResolvedThemeMode,
        Dispatch<SetStateAction<ResolvedThemeMode>>,
    ] = useState<ResolvedThemeMode>(readSystemPreference);
    const currentMode: ThemeMode = mode ?? internalMode ?? parent.mode;
    const resolvedMode: ResolvedThemeMode = currentMode === "system" ? systemMode : currentMode;
    const resolvedDensity: ThemeDensity = density ?? parent.density;
    const resolvedRadius: ThemeRadius = radius ?? parent.radius;

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
        () => ({ ...parent.tokens, ...(tokens ?? emptyTokens) }),
        [parent.tokens, tokens],
    );

    const setMode: (mode: ThemeMode) => void = useCallback(
        (next: ThemeMode): void => {
            setInternalMode(next);
            onModeChange?.(next);
        },
        [onModeChange],
    );

    const themeStyle: ThemeStyle = {
        ...(style ?? emptyStyle),
        ...effectiveTokens,
        colorScheme: resolvedMode,
    };

    const contextValue: ThemeContextValue = useMemo<ThemeContextValue>(
        () => ({
            mode: currentMode,
            resolvedMode,
            density: resolvedDensity,
            radius: resolvedRadius,
            tokens: effectiveTokens,
            setMode,
        }),
        [currentMode, effectiveTokens, resolvedDensity, resolvedMode, resolvedRadius, setMode],
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            <div
                {...rest}
                className={cx("periodicity-theme", className)}
                data-theme={resolvedMode}
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
