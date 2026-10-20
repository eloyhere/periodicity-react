import type { ThemeTokens } from "./ThemeContext";

/**
 * Identifier for a global theme preset.
 * Type: type alias.
 * Fields: none.
 * @example
 * const presetId: ThemePresetId = "milk";
 */
export type ThemePresetId =
    | "accessible"
    | "default"
    | "dark"
    | "milk"
    | "space-gray"
    | "gray"
    | "light-gray"
    | "sky-blue"
    | "pale-blue"
    | "deep-blue"
    | "orange"
    | "yellow"
    | "lemon"
    | "red"
    | "rose"
    | "green"
    | "deep-green"
    | "light-green";

/**
 * Appearance a preset palette is tuned for.
 * Type: type alias.
 * Fields: none.
 * @example
 * const mode: ThemePresetMode = "dark";
 */
export type ThemePresetMode = "light" | "dark";

/**
 * Bilingual display label for a preset.
 * Type: interface.
 * @param zh - Simplified Chinese label for Chinese locales.
 * @param en - British English label for every other locale.
 * @example
 * const label: ThemePresetLabel = { zh: "牛奶白", en: "Milk white" };
 */
export interface ThemePresetLabel {
    readonly zh: string;
    readonly en: string;
}

/**
 * Global theme preset understood by the Theme provider.
 * Type: interface.
 * @param id - Stable identifier used by `theme`, `defaultTheme`, and `setTheme`.
 * @param label - Bilingual display label.
 * @param description - British English summary of the palette intent.
 * @param mode - Light or dark appearance the palette is tuned for.
 * @param tokens - CSS custom property overrides written on the Theme wrapper; empty for the default preset.
 * @example
 * const preset: ThemePreset = getThemePreset("space-gray");
 */
export interface ThemePreset {
    readonly id: ThemePresetId;
    readonly label: ThemePresetLabel;
    readonly description: string;
    readonly mode: ThemePresetMode;
    readonly tokens: ThemeTokens;
}

/**
 * Channel triple used by the colour helpers.
 * Type: interface.
 * @param red - Red channel in the 0-255 range.
 * @param green - Green channel in the 0-255 range.
 * @param blue - Blue channel in the 0-255 range.
 */
interface ColourChannels {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
}

/**
 * Compact palette seed expanded into the full token map of a preset.
 * Type: interface.
 * @param background - Page background colour.
 * @param surface - Raised card and panel colour.
 * @param surfaceStrong - Stronger surface used for chips and nested panels.
 * @param text - Primary text colour.
 * @param textMuted - Secondary and muted text colour.
 * @param textDisabled - Disabled text colour.
 * @param divider - Border and divider colour.
 * @param primary - Primary action and accent colour.
 * @param onPrimary - Text painted on the primary colour.
 * @param primaryContainer - Tinted container behind primary content.
 * @param onPrimaryContainer - Text painted on the primary container.
 * @param accent - Secondary accent hue kept apart from the primary.
 * @param secondary - Supporting hue for secondary actions.
 * @param tertiary - Supporting hue for tertiary content.
 * @param success - Positive status colour.
 * @param warning - Caution status colour.
 * @param error - Negative status colour.
 * @param focusRing - Focus indicator colour.
 * @param inversePaper - Dark paper used by toasts and tooltips.
 * @param overrides - Optional token overrides applied after the derivation.
 */
interface PresetPalette {
    readonly background: string;
    readonly surface: string;
    readonly surfaceStrong: string;
    readonly text: string;
    readonly textMuted: string;
    readonly textDisabled: string;
    readonly divider: string;
    readonly primary: string;
    readonly onPrimary: string;
    readonly primaryContainer: string;
    readonly onPrimaryContainer: string;
    readonly accent: string;
    readonly secondary: string;
    readonly tertiary: string;
    readonly success: string;
    readonly warning: string;
    readonly error: string;
    readonly focusRing: string;
    readonly inversePaper: string;
    readonly overrides?: ThemeTokens;
}

/**
 * Preset seed before its token map is derived.
 * Type: interface.
 * @param id - Stable preset identifier.
 * @param label - Bilingual display label.
 * @param description - British English summary of the palette intent.
 * @param mode - Light or dark appearance the palette is tuned for.
 * @param palette - Palette seed, or `null` to keep the provider's built-in palette.
 */
interface ThemePresetSeed {
    readonly id: ThemePresetId;
    readonly label: ThemePresetLabel;
    readonly description: string;
    readonly mode: ThemePresetMode;
    readonly palette: PresetPalette | null;
}

const emptyTokens: ThemeTokens = {};
const HexRadix: number = 16;
const ShortHexLength: number = 3;
const ChannelCeiling: number = 255;
const ChannelFloor: number = 0;
const ChannelWidth: number = 2;
const DarkSoftAlpha: number = 0.22;
const LightSoftAlpha: number = 0.12;
const InverseTintWeight: number = 0.45;
const InverseActionWeight: number = 0.58;
const InverseActionDarkWeight: number = 0.25;

/**
 * Parses a three- or six-digit hex colour into numeric channels.
 * @param colour - Hex colour such as `#1e88e5` or `#fff`.
 * @returns The numeric red, green, and blue channels.
 * @example
 * const channels: ColourChannels = parseColour("#1e88e5");
 */
const parseColour: (colour: string) => ColourChannels = (colour: string): ColourChannels => {
    const value: string = colour.replace("#", "");
    const expanded: string =
        value.length === ShortHexLength
            ? `${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`
            : value;

    return {
        red: parseInt(expanded.slice(0, 2), HexRadix),
        green: parseInt(expanded.slice(2, 4), HexRadix),
        blue: parseInt(expanded.slice(4, 6), HexRadix),
    };
};

/**
 * Clamps a channel and turns it back into a two-digit hex fragment.
 * @param channel - Fractional channel value produced by a colour mix.
 * @returns The two-digit hex fragment.
 * @example
 * const fragment: string = formatChannel(30);
 */
const formatChannel: (channel: number) => string = (channel: number): string =>
    Math.min(ChannelCeiling, Math.max(ChannelFloor, Math.round(channel))).toString(16).padStart(ChannelWidth, "0");

/**
 * Serialises numeric channels back into a six-digit hex colour.
 * @param channels - Numeric red, green, and blue channels.
 * @returns The hex colour string.
 * @example
 * const colour: string = serialiseColour({ red: 30, green: 136, blue: 229 });
 */
const serialiseColour: (channels: ColourChannels) => string = (channels: ColourChannels): string =>
    `#${formatChannel(channels.red)}${formatChannel(channels.green)}${formatChannel(channels.blue)}`;

/**
 * Mixes two hex colours and returns a hex colour.
 * @param from - Colour at weight zero.
 * @param to - Colour at weight one.
 * @param weight - Mix ratio between zero and one.
 * @returns The mixed hex colour.
 * @example
 * const mixed: string = mixColour("#000000", "#ffffff", 0.5);
 */
const mixColour: (from: string, to: string, weight: number) => string = (
    from: string,
    to: string,
    weight: number,
): string => {
    const source: ColourChannels = parseColour(from);
    const target: ColourChannels = parseColour(to);
    const ratio: number = Math.min(1, Math.max(0, weight));

    return serialiseColour({
        red: source.red + (target.red - source.red) * ratio,
        green: source.green + (target.green - source.green) * ratio,
        blue: source.blue + (target.blue - source.blue) * ratio,
    });
};

/**
 * Mixes a hex colour towards white.
 * @param colour - Base hex colour.
 * @param weight - Amount of white mixed in.
 * @returns The lightened hex colour.
 * @example
 * const tint: string = lighten("#1e88e5", 0.3);
 */
const lighten: (colour: string, weight: number) => string = (colour: string, weight: number): string =>
    mixColour(colour, "#ffffff", weight);

/**
 * Mixes a hex colour towards black.
 * @param colour - Base hex colour.
 * @param weight - Amount of black mixed in.
 * @returns The darkened hex colour.
 * @example
 * const shade: string = darken("#1e88e5", 0.3);
 */
const darken: (colour: string, weight: number) => string = (colour: string, weight: number): string =>
    mixColour(colour, "#000000", weight);

/**
 * Converts a hex colour into an `rgba()` string.
 * @param colour - Base hex colour.
 * @param alpha - Opacity between zero and one.
 * @returns The translucent colour string.
 * @example
 * const wash: string = translucify("#1e88e5", 0.12);
 */
const translucify: (colour: string, alpha: number) => string = (colour: string, alpha: number): string => {
    const channels: ColourChannels = parseColour(colour);

    return `rgba(${channels.red}, ${channels.green}, ${channels.blue}, ${alpha})`;
};

/**
 * Expands a compact palette seed into the CSS custom properties consumed by components.
 * @param palette - Palette seed for the preset.
 * @param mode - Light or dark appearance the palette is tuned for.
 * @returns The complete token map written on the Theme wrapper.
 * @example
 * const tokens: ThemeTokens = buildPresetTokens(palette, "light");
 */
const buildPresetTokens: (palette: PresetPalette, mode: ThemePresetMode) => ThemeTokens = (
    palette: PresetPalette,
    mode: ThemePresetMode,
): ThemeTokens => {
    const isDark: boolean = mode === "dark";
    const softAlpha: number = isDark ? DarkSoftAlpha : LightSoftAlpha;
    const primaryDark: string = palette.onPrimaryContainer;
    const primaryLight: string = isDark ? darken(palette.primary, 0.16) : lighten(palette.primary, 0.26);
    const accentDark: string = isDark ? lighten(palette.accent, 0.32) : darken(palette.accent, 0.28);
    const accentLight: string = isDark ? darken(palette.accent, 0.16) : lighten(palette.accent, 0.26);
    const primarySoft: string = translucify(palette.primary, softAlpha);
    const secondarySoft: string = translucify(palette.secondary, softAlpha);
    const tertiarySoft: string = translucify(palette.tertiary, softAlpha);
    const warningSoft: string = translucify(palette.warning, softAlpha);
    const dangerSoft: string = translucify(palette.error, softAlpha);
    const successSoft: string = translucify(palette.success, softAlpha);
    const scrim: string = isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.32)";
    const shadow: string = isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.45)";
    const hoverWash: string = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
    const activeWash: string = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
    const controlHighlight: string = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
    const disabledOpacity: string = isDark ? "0.5" : "0.45";
    const inverseAction: string = isDark
        ? lighten(palette.primary, InverseActionDarkWeight)
        : lighten(palette.primary, InverseActionWeight);
    const inverseSuccess: string = isDark ? palette.success : lighten(palette.success, InverseTintWeight);
    const inverseWarning: string = isDark ? palette.warning : lighten(palette.warning, InverseTintWeight);
    const inverseDanger: string = isDark ? palette.error : lighten(palette.error, InverseTintWeight);
    const onSuccess: string = isDark ? "#08130b" : "#ffffff";
    const tooltipPaper: string = translucify(palette.inversePaper, 0.94);
    const tokens: ThemeTokens = {
        "--colourBackground": palette.background,
        "--colourSurface": palette.surface,
        "--colourSurfaceDark": palette.surfaceStrong,
        "--colourTextPrimary": palette.text,
        "--colourTextSecond": palette.textMuted,
        "--colourTextDisabled": palette.textDisabled,
        "--colourDivider": palette.divider,
        "--colourControlHighlight": controlHighlight,
        "--colourScrim": scrim,
        "--colourPrimary": palette.primary,
        "--colourPrimaryDark": primaryDark,
        "--colourPrimaryLight": primaryLight,
        "--colourOnPrimary": palette.onPrimary,
        "--colourPrimaryContainer": palette.primaryContainer,
        "--colourOnPrimaryContainer": palette.onPrimaryContainer,
        "--colourAccent": palette.accent,
        "--colourAccentDark": accentDark,
        "--colourAccentLight": accentLight,
        "--colourSecondary": palette.secondary,
        "--colourTertiary": palette.tertiary,
        "--colourError": palette.error,
        "--colourWarning": palette.warning,
        "--colourSuccess": palette.success,
        "--colourSuccessContainer": successSoft,
        "--colourOnSuccess": onSuccess,
        "--colourOnSuccessContainer": palette.text,
        "--accent-soft": primarySoft,
        "--mint": palette.secondary,
        "--mint-soft": secondarySoft,
        "--violet": palette.tertiary,
        "--violet-soft": tertiarySoft,
        "--amber": palette.warning,
        "--amber-soft": warningSoft,
        "--danger-soft": dangerSoft,
        "--scrim": scrim,
        "--color-shadow": shadow,
        "--color-success": "var(--colourSuccess)",
        "--color-on-success": "var(--colourOnSuccess)",
        "--color-success-container": "var(--colourSuccessContainer)",
        "--color-on-success-container": "var(--colourOnSuccessContainer)",
        "--colourInversePaper": palette.inversePaper,
        "--colourTooltipPaper": tooltipPaper,
        "--colourOnInverse": "#ffffff",
        "--colourOnInverseMuted": "rgba(255, 255, 255, 0.72)",
        "--colourInverseAction": inverseAction,
        "--colourSuccessOnInverse": inverseSuccess,
        "--colourWarningOnInverse": inverseWarning,
        "--colourDangerOnInverse": inverseDanger,
        "--colourHoverWash": hoverWash,
        "--colourActiveWash": activeWash,
        "--focus-ring-color": palette.focusRing,
        "--state-disabled-opacity": disabledOpacity,
    };

    return { ...tokens, ...(palette.overrides ?? emptyTokens) };
};

/**
 * Turns a preset seed into the public preset record.
 * @param seed - Metadata plus palette seed for one preset.
 * @returns The complete preset record.
 * @example
 * const preset: ThemePreset = buildThemePreset(seed);
 */
const buildThemePreset: (seed: ThemePresetSeed) => ThemePreset = (seed: ThemePresetSeed): ThemePreset => {
    const tokens: ThemeTokens =
        seed.palette === null ? emptyTokens : buildPresetTokens(seed.palette, seed.mode);

    return {
        id: seed.id,
        label: seed.label,
        description: seed.description,
        mode: seed.mode,
        tokens,
    };
};

/**
 * Identifier of the preset that keeps the provider's built-in palette.
 * Type: constant.
 * Fields: none.
 * @example
 * const fallbackId: ThemePresetId = DefaultThemePresetId;
 */
export const DefaultThemePresetId: ThemePresetId = "default";

/**
 * Seed of the default preset, which deliberately carries no palette.
 * Type: constant.
 * Fields: none.
 */
const defaultSeed: ThemePresetSeed = {
    id: DefaultThemePresetId,
    label: { zh: "默认", en: "Default" },
    description: "The built-in Material palette; an unselected provider keeps following the system mode.",
    mode: "light",
    palette: null,
};

/**
 * Default preset record used as the lookup fallback.
 * Type: constant.
 * Fields: none.
 */
const defaultThemePreset: ThemePreset = buildThemePreset(defaultSeed);

const presetSeeds: readonly ThemePresetSeed[] = [
    {
        id: "accessible",
        label: { zh: "高对比度", en: "High contrast" },
        description: "High-contrast light palette with AAA text, strong borders, and a 3px focus ring.",
        mode: "light",
        palette: {
            background: "#ffffff",
            surface: "#ffffff",
            surfaceStrong: "#f2f2f2",
            text: "#000000",
            textMuted: "#1f1f1f",
            textDisabled: "#595959",
            divider: "#4d4d4d",
            primary: "#0b3d91",
            onPrimary: "#ffffff",
            primaryContainer: "#e3ecff",
            onPrimaryContainer: "#002171",
            accent: "#8f004d",
            secondary: "#00695c",
            tertiary: "#4a148c",
            success: "#1b5e20",
            warning: "#7a4100",
            error: "#b00020",
            focusRing: "#0b3d91",
            inversePaper: "#000000",
            overrides: {
                "--focus-ring-width": "3px",
                "--focus-ring-offset": "3px",
                "--colourControlHighlight": "rgba(0, 0, 0, 0.24)",
                "--colourHoverWash": "rgba(0, 0, 0, 0.12)",
                "--colourActiveWash": "rgba(0, 0, 0, 0.2)",
                "--state-disabled-opacity": "0.62",
                "--scrim": "rgba(0, 0, 0, 0.72)",
                "--colourScrim": "rgba(0, 0, 0, 0.72)",
                "--colourTooltipPaper": "#000000",
            },
        },
    },
    defaultSeed,
    {
        id: "dark",
        label: { zh: "深色", en: "Dark" },
        description: "A genuinely dark Material palette with a near-black background and a cool blue accent.",
        mode: "dark",
        palette: {
            background: "#121212",
            surface: "#1e1e1e",
            surfaceStrong: "#272727",
            text: "#e0e0e0",
            textMuted: "#a8a8a8",
            textDisabled: "#7a7a7a",
            divider: "#3a3a3a",
            primary: "#90caf9",
            onPrimary: "#102027",
            primaryContainer: "#1e3a5f",
            onPrimaryContainer: "#d6ecff",
            accent: "#f48fb1",
            secondary: "#80cbc4",
            tertiary: "#ce93d8",
            success: "#a5d6a7",
            warning: "#ffcc80",
            error: "#f2b8b5",
            focusRing: "#90caf9",
            inversePaper: "#323232",
        },
    },
    {
        id: "milk",
        label: { zh: "牛奶白", en: "Milk white" },
        description: "Warm milk-white surfaces with a soft mocha primary and low-glare text.",
        mode: "light",
        palette: {
            background: "#fdfaf3",
            surface: "#ffffff",
            surfaceStrong: "#f6efe3",
            text: "#33291f",
            textMuted: "#665647",
            textDisabled: "#93806c",
            divider: "#e3d7c6",
            primary: "#8a5a2b",
            onPrimary: "#fffaf0",
            primaryContainer: "#f6e6d4",
            onPrimaryContainer: "#4a2d12",
            accent: "#b3541e",
            secondary: "#64713f",
            tertiary: "#8a5f6d",
            success: "#3d7a45",
            warning: "#9a6200",
            error: "#a83a2c",
            focusRing: "#8a5a2b",
            inversePaper: "#3a2f25",
        },
    },
    {
        id: "space-gray",
        label: { zh: "深空灰", en: "Space grey" },
        description: "Deep space grey with a near-black blue cast and a soft periwinkle primary.",
        mode: "dark",
        palette: {
            background: "#0f1115",
            surface: "#171a20",
            surfaceStrong: "#1f232b",
            text: "#e6eaf0",
            textMuted: "#a7b0bd",
            textDisabled: "#78818f",
            divider: "#2f343d",
            primary: "#9ec5ff",
            onPrimary: "#0a1220",
            primaryContainer: "#1c2b45",
            onPrimaryContainer: "#d7e6ff",
            accent: "#ff9ec4",
            secondary: "#8fd3c6",
            tertiary: "#b9a7ff",
            success: "#a5d6a7",
            warning: "#ffcf8a",
            error: "#ffb4ab",
            focusRing: "#9ec5ff",
            inversePaper: "#2a2f38",
        },
    },
    {
        id: "gray",
        label: { zh: "灰色", en: "Grey" },
        description: "Graphite grey surfaces with a monochrome steel primary and a lavender accent.",
        mode: "dark",
        palette: {
            background: "#26272b",
            surface: "#2e2f34",
            surfaceStrong: "#37383e",
            text: "#f0f1f3",
            textMuted: "#babdc4",
            textDisabled: "#8b8e96",
            divider: "#484a51",
            primary: "#c9d1d9",
            onPrimary: "#1b1c1f",
            primaryContainer: "#3a3d44",
            onPrimaryContainer: "#e8ebef",
            accent: "#c4a7e7",
            secondary: "#a8c7b0",
            tertiary: "#d9b8a6",
            success: "#a5d6a7",
            warning: "#ffd08a",
            error: "#ffb4ab",
            focusRing: "#c9d1d9",
            inversePaper: "#3a3b40",
        },
    },
    {
        id: "light-gray",
        label: { zh: "浅灰色", en: "Light grey" },
        description: "Soft neutral light grey surfaces with a slate primary and an indigo accent.",
        mode: "light",
        palette: {
            background: "#f2f2f3",
            surface: "#ffffff",
            surfaceStrong: "#e9e9ec",
            text: "#1f2023",
            textMuted: "#56585e",
            textDisabled: "#878990",
            divider: "#d2d3d8",
            primary: "#4b5563",
            onPrimary: "#ffffff",
            primaryContainer: "#e5e7eb",
            onPrimaryContainer: "#111827",
            accent: "#5b4bc4",
            secondary: "#3f6f5a",
            tertiary: "#7a4a63",
            success: "#2e7d32",
            warning: "#9a5b00",
            error: "#b3261e",
            focusRing: "#111827",
            inversePaper: "#303136",
        },
    },
    {
        id: "sky-blue",
        label: { zh: "天蓝色", en: "Sky blue" },
        description: "Airy sky-blue surfaces with a clear azure primary and a warm coral accent.",
        mode: "light",
        palette: {
            background: "#eef7ff",
            surface: "#ffffff",
            surfaceStrong: "#e3f2fd",
            text: "#0b1f2e",
            textMuted: "#44647a",
            textDisabled: "#6d8ba0",
            divider: "#cfe4f5",
            primary: "#016b9e",
            onPrimary: "#ffffff",
            primaryContainer: "#d9efff",
            onPrimaryContainer: "#013a63",
            accent: "#bc4f22",
            secondary: "#00796b",
            tertiary: "#5e60ce",
            success: "#2e7d32",
            warning: "#9a5b00",
            error: "#c62828",
            focusRing: "#01579b",
            inversePaper: "#0b2a3f",
        },
    },
    {
        id: "pale-blue",
        label: { zh: "淡蓝色", en: "Pale blue" },
        description: "Muted pale-blue surfaces with a dusty navy primary and a quiet violet accent.",
        mode: "light",
        palette: {
            background: "#f5f8fc",
            surface: "#fbfdff",
            surfaceStrong: "#e8eef7",
            text: "#1c2530",
            textMuted: "#52606f",
            textDisabled: "#7d8b9a",
            divider: "#d8e1ec",
            primary: "#3f5f8f",
            onPrimary: "#ffffff",
            primaryContainer: "#e4ecf7",
            onPrimaryContainer: "#1f3453",
            accent: "#8a6db1",
            secondary: "#4f7264",
            tertiary: "#8a6a4f",
            success: "#3f7350",
            warning: "#8a5f1f",
            error: "#a13f3f",
            focusRing: "#2b4468",
            inversePaper: "#232d3a",
        },
    },
    {
        id: "deep-blue",
        label: { zh: "深蓝色", en: "Deep blue" },
        description: "Deep navy surfaces with an azure primary and a warm gold accent.",
        mode: "dark",
        palette: {
            background: "#071426",
            surface: "#0d1e35",
            surfaceStrong: "#13273f",
            text: "#e8f1ff",
            textMuted: "#a9bdd6",
            textDisabled: "#7589a2",
            divider: "#24374f",
            primary: "#6fb3ff",
            onPrimary: "#04101f",
            primaryContainer: "#12365c",
            onPrimaryContainer: "#d8ebff",
            accent: "#ffcf70",
            secondary: "#5ad1c0",
            tertiary: "#b7a4ff",
            success: "#8ee0a1",
            warning: "#ffb86b",
            error: "#ffb4ab",
            focusRing: "#7fc4ff",
            inversePaper: "#16273d",
        },
    },
    {
        id: "orange",
        label: { zh: "橙色", en: "Orange" },
        description: "Warm amber surfaces with a burnt-orange primary and a mulberry accent.",
        mode: "light",
        palette: {
            background: "#fff6ee",
            surface: "#ffffff",
            surfaceStrong: "#ffead9",
            text: "#2d1a0d",
            textMuted: "#66432b",
            textDisabled: "#9a7b66",
            divider: "#f2d8c4",
            primary: "#b34700",
            onPrimary: "#fff8f2",
            primaryContainer: "#ffe3cc",
            onPrimaryContainer: "#5a2500",
            accent: "#a23b53",
            secondary: "#5b7a3f",
            tertiary: "#6d5a99",
            success: "#2f7d32",
            warning: "#8a5300",
            error: "#b3261e",
            focusRing: "#8a3600",
            inversePaper: "#3a2416",
        },
    },
    {
        id: "yellow",
        label: { zh: "黄色", en: "Yellow" },
        description: "Golden light surfaces with a dark gold primary and an amber accent.",
        mode: "light",
        palette: {
            background: "#fffdf2",
            surface: "#fffef7",
            surfaceStrong: "#fff7d6",
            text: "#2b2405",
            textMuted: "#5f5426",
            textDisabled: "#8f8455",
            divider: "#efe3b8",
            primary: "#8a6d00",
            onPrimary: "#fffdf2",
            primaryContainer: "#fff3bf",
            onPrimaryContainer: "#4a3a00",
            accent: "#b45309",
            secondary: "#6b7a1f",
            tertiary: "#9a6b1f",
            success: "#3f6f2a",
            warning: "#9a5b00",
            error: "#a12a1f",
            focusRing: "#5c4800",
            inversePaper: "#2f2a12",
        },
    },
    {
        id: "lemon",
        label: { zh: "柠檬黄", en: "Lemon yellow" },
        description: "Bright lemon-tinted surfaces with an olive-lime primary and an ochre accent.",
        mode: "light",
        palette: {
            background: "#fffef0",
            surface: "#fffff8",
            surfaceStrong: "#fbf6c8",
            text: "#262400",
            textMuted: "#5c5718",
            textDisabled: "#8a854f",
            divider: "#eee79a",
            primary: "#6b7000",
            onPrimary: "#fffef0",
            primaryContainer: "#f7f3a8",
            onPrimaryContainer: "#3d3f00",
            accent: "#9a6b00",
            secondary: "#4f7a1f",
            tertiary: "#8a5f1f",
            success: "#3f7a2e",
            warning: "#9a6200",
            error: "#a4271c",
            focusRing: "#494d00",
            inversePaper: "#2a2a10",
        },
    },
    {
        id: "red",
        label: { zh: "红色", en: "Red" },
        description: "Soft red-tinted surfaces with a strong crimson primary and a plum accent.",
        mode: "light",
        palette: {
            background: "#fff5f4",
            surface: "#ffffff",
            surfaceStrong: "#ffe3e0",
            text: "#2b1210",
            textMuted: "#6b423d",
            textDisabled: "#a5837e",
            divider: "#f3d2ce",
            primary: "#b3261e",
            onPrimary: "#ffffff",
            primaryContainer: "#ffdad6",
            onPrimaryContainer: "#601410",
            accent: "#a4275c",
            secondary: "#5f6f52",
            tertiary: "#7a4e8a",
            success: "#2e6b32",
            warning: "#9a5a00",
            error: "#b3261e",
            focusRing: "#8c1d18",
            inversePaper: "#3a1512",
        },
    },
    {
        id: "rose",
        label: { zh: "玫瑰红", en: "Rose red" },
        description: "Blush-rose surfaces with a raspberry-rose primary and a plum accent.",
        mode: "light",
        palette: {
            background: "#fff5f8",
            surface: "#ffffff",
            surfaceStrong: "#ffe4ec",
            text: "#2c121a",
            textMuted: "#6d4352",
            textDisabled: "#a98491",
            divider: "#f4d3dd",
            primary: "#b81d5b",
            onPrimary: "#ffffff",
            primaryContainer: "#ffd9e5",
            onPrimaryContainer: "#6b0f38",
            accent: "#8e44ad",
            secondary: "#557060",
            tertiary: "#9a5a4a",
            success: "#3f7a4a",
            warning: "#9a6200",
            error: "#a4271c",
            focusRing: "#8c1245",
            inversePaper: "#3a1420",
        },
    },
    {
        id: "green",
        label: { zh: "绿色", en: "Green" },
        description: "Fresh green surfaces with a forest-green primary and a teal accent.",
        mode: "light",
        palette: {
            background: "#f2fbf4",
            surface: "#ffffff",
            surfaceStrong: "#e0f4e5",
            text: "#10241a",
            textMuted: "#456354",
            textDisabled: "#74917f",
            divider: "#cfe8d8",
            primary: "#2e7d32",
            onPrimary: "#ffffff",
            primaryContainer: "#d9f2dd",
            onPrimaryContainer: "#14532d",
            accent: "#00695c",
            secondary: "#55732f",
            tertiary: "#4c6f8a",
            success: "#2e7d32",
            warning: "#9a6200",
            error: "#b3261e",
            focusRing: "#1b5e20",
            inversePaper: "#14301f",
        },
    },
    {
        id: "deep-green",
        label: { zh: "深绿色", en: "Deep green" },
        description: "Deep forest surfaces with a mint primary and a warm gold accent.",
        mode: "dark",
        palette: {
            background: "#07140f",
            surface: "#0d1f17",
            surfaceStrong: "#10271d",
            text: "#e6f5ec",
            textMuted: "#a5c4b2",
            textDisabled: "#708c7c",
            divider: "#24382e",
            primary: "#7fd8a4",
            onPrimary: "#04140c",
            primaryContainer: "#14402c",
            onPrimaryContainer: "#d3f9e0",
            accent: "#e3c567",
            secondary: "#8fd3c6",
            tertiary: "#a8c79a",
            success: "#9be8b4",
            warning: "#ffd166",
            error: "#ffb4ab",
            focusRing: "#7fd8a4",
            inversePaper: "#163025",
        },
    },
    {
        id: "light-green",
        label: { zh: "浅绿色", en: "Light green" },
        description: "Light mint surfaces with an olive-green primary and a teal accent.",
        mode: "light",
        palette: {
            background: "#f3fcf5",
            surface: "#ffffff",
            surfaceStrong: "#e2f6e7",
            text: "#12251a",
            textMuted: "#4a6a58",
            textDisabled: "#718f7e",
            divider: "#d3ecd9",
            primary: "#4a7a24",
            onPrimary: "#ffffff",
            primaryContainer: "#ddf3cf",
            onPrimaryContainer: "#274d0c",
            accent: "#00897b",
            secondary: "#5f6f3c",
            tertiary: "#7d5a8c",
            success: "#3f7a2e",
            warning: "#9a6200",
            error: "#a4271c",
            focusRing: "#33691e",
            inversePaper: "#1c3523",
        },
    },
];

/**
 * Ordered catalogue of the global theme presets.
 * Type: constant.
 * Fields: none.
 * @example
 * themePresets.map((preset: ThemePreset): string => preset.label.en);
 */
export const themePresets: readonly ThemePreset[] = presetSeeds.map(
    (seed: ThemePresetSeed): ThemePreset => buildThemePreset(seed),
);

/**
 * Looks up a preset by identifier and falls back to the default preset.
 * Type: constant.
 * Fields: none.
 * @param id - Preset identifier to resolve.
 * @returns The matching preset, or the default preset when the identifier is unknown.
 * @example
 * const preset: ThemePreset = getThemePreset("accessible");
 */
export const getThemePreset: (id: ThemePresetId) => ThemePreset = (id: ThemePresetId): ThemePreset =>
    themePresets.find((preset: ThemePreset): boolean => preset.id === id) ?? defaultThemePreset;
