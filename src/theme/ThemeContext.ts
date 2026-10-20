import { createContext, useContext, type Context } from "react";

/**
 * Theme preference for a subtree.
 * Type: type alias.
 * Fields: none.
 * @example
 * const mode: ThemeMode = "system";
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Appearance after the system preference has been resolved.
 * Type: type alias.
 * Fields: none.
 * @example
 * const appearance: ResolvedThemeMode = "dark";
 */
export type ResolvedThemeMode = "light" | "dark";

/**
 * Control density applied to a subtree.
 * Type: type alias.
 * Fields: none.
 * @example
 * const density: ThemeDensity = "compact";
 */
export type ThemeDensity = "compact" | "regular" | "comfortable";

/**
 * Corner treatment applied to a subtree.
 * Type: type alias.
 * Fields: none.
 * @example
 * const radius: ThemeRadius = "rounded";
 */
export type ThemeRadius = "sharp" | "default" | "rounded" | "pill";

/**
 * CSS custom property accepted by token overrides.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variable: ThemeTokenName = "--accent";
 */
export type ThemeTokenName = `--${string}`;

/**
 * Token overrides applied to the Theme wrapper.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tokens: ThemeTokens = { "--accent": "#d81b60", "--accent-ink": "#ffffff" };
 */
export type ThemeTokens = Readonly<Record<ThemeTokenName, string>>;

/**
 * Controller returned by `useTheme`.
 * Type: interface.
 * @param mode - Requested preference, including `system`.
 * @param resolvedMode - Concrete appearance after resolving `system`.
 * @param density - Effective control density.
 * @param radius - Effective corner treatment.
 * @param tokens - Token overrides visible to this subtree.
 * @param setMode - Requests a new preference from a descendant.
 * @example
 * const { resolvedMode, setMode }: ThemeContextValue = useTheme();
 */
export interface ThemeContextValue {
    mode: ThemeMode;
    resolvedMode: ResolvedThemeMode;
    density: ThemeDensity;
    radius: ThemeRadius;
    tokens: ThemeTokens;
    setMode: (mode: ThemeMode) => void;
}

const noopSetMode: (mode: ThemeMode) => void = (): void => {};
const emptyTokens: ThemeTokens = {};

/**
 * Fallback used when `useTheme` is called outside a Theme provider.
 * Type: constant.
 * Fields: mode, resolvedMode, density, radius, tokens, setMode.
 * @example
 * const fallback: ThemeContextValue = DefaultThemeContext;
 */
export const DefaultThemeContext: ThemeContextValue = {
    mode: "system",
    resolvedMode: "light",
    density: "regular",
    radius: "default",
    tokens: emptyTokens,
    setMode: noopSetMode,
};

/**
 * Context carrying the scoped theme configuration to descendants.
 * @example
 * const theme: ThemeContextValue = useContext(ThemeContext);
 */
export const ThemeContext: Context<ThemeContextValue> =
    createContext<ThemeContextValue>(DefaultThemeContext);

/**
 * Reads the nearest Theme configuration.
 * Type: hook.
 * @example
 * const { mode, resolvedMode, setMode } = useTheme();
 * setMode("dark");
 * @returns The current theme controller, or a sensible default outside a provider.
 */
export const useTheme: () => ThemeContextValue = (): ThemeContextValue =>
    useContext(ThemeContext);
