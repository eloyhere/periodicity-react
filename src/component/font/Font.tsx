import {
    createElement,
    useContext,
    useMemo,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../foundation/cx";
import { FontContext, type FontContextValue } from "./context";
import type {
    FontAlign,
    FontElement,
    FontFamily,
    FontLevel,
    FontLetterSpacing,
    FontLineHeight,
    FontTransform,
    FontWeight,
} from "./types";
import "./Font.css";

export type {
    FontAlign,
    FontElement,
    FontFamily,
    FontLevel,
    FontLetterSpacing,
    FontLineHeight,
    FontTransform,
    FontWeight,
} from "./types";

/**
 * Props for the Font scope.
 * Type: interface.
 * Fields: as, level, scale, family, color, weight, lineHeight, letterSpacing,
 * transform, align, italic, truncate, children, className, style, ref, plus native attributes.
 * @example
 * <Font level="h3" family="mono" color="var(--accent)">
 *     <Text variant="body">Scoped text</Text>
 * </Font>
 */
export interface FontProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
    /** Element rendered around the slot; defaults to `div`. */
    as?: FontElement;
    /** Type-scale step for the scope's own text; defaults to `body`. */
    level?: FontLevel;
    /** Multiplies every type token inside the scope; clamped to at least 1. */
    scale?: number;
    /** Font family token or raw family stack. */
    family?: FontFamily;
    /** CSS colour applied to the scope. */
    color?: string;
    /** Weight token or numeric weight. */
    weight?: FontWeight;
    /** Line-height token or numeric value. */
    lineHeight?: FontLineHeight;
    /** Letter-spacing token or raw CSS length. */
    letterSpacing?: FontLetterSpacing;
    /** Text transform. */
    transform?: FontTransform;
    /** Text alignment. */
    align?: FontAlign;
    /** Sets `font-style: italic`; `false` resets an inherited italic style. */
    italic?: boolean;
    /** Clips overflow with an ellipsis. */
    truncate?: boolean;
    children?: ReactNode;
    ref?: Ref<HTMLElement>;
}

type FontVariable =
    | "--font-family-current"
    | "--font-size-current"
    | "--font-color-current"
    | "--font-weight-current"
    | "--font-leading-current"
    | "--font-tracking-current"
    | "--font-transform-current"
    | "--font-align-current"
    | "--font-style-current"
    | "--font-scale";

type FontStyle = CSSProperties &
    Partial<Record<FontVariable, string>> &
    Partial<Record<`--type-${string}`, string>>;

const TypeTokens: readonly string[] = [
    "display",
    "h1",
    "h2",
    "h3",
    "h4",
    "body-lg",
    "body",
    "body-sm",
    "label",
    "label-sm",
    "mono",
];

const FamilyTokens: Readonly<Record<string, string>> = {
    sans: "var(--font-sans)",
    display: "var(--font-display)",
    mono: "var(--font-mono)",
};

const WeightTokens: Readonly<Record<string, string>> = {
    regular: "var(--weight-regular)",
    medium: "var(--weight-medium)",
    semibold: "var(--weight-semibold)",
    bold: "var(--weight-bold)",
};

const LineHeightTokens: Readonly<Record<string, string>> = {
    tight: "var(--leading-tight)",
    snug: "var(--leading-snug)",
    normal: "var(--leading-normal)",
    relaxed: "var(--leading-relaxed)",
};

const LetterSpacingTokens: Readonly<Record<string, string>> = {
    tight: "var(--tracking-tight)",
    normal: "var(--tracking-normal)",
    wide: "var(--tracking-wide)",
    widest: "var(--tracking-widest)",
};

/**
 * Resolves a family token while leaving raw family stacks untouched.
 * @param family - Family token or raw CSS family stack.
 * @example
 * const family = resolveFamily("mono");
 * @returns A CSS family value or undefined.
 */
const resolveFamily: (family: FontFamily | undefined) => string | undefined = (
    family: FontFamily | undefined,
): string | undefined => {
    if (family === (void 0)) {
        return (void 0);
    }

    return FamilyTokens[family] ?? family;
};

/**
 * Resolves a weight token or numeric weight.
 * @param weight - Weight token or number.
 * @example
 * const weight = resolveWeight("semibold");
 * @returns A CSS font-weight value or undefined.
 */
const resolveWeight: (weight: FontWeight | undefined) => string | undefined = (
    weight: FontWeight | undefined,
): string | undefined => {
    if (weight === (void 0)) {
        return (void 0);
    }

    return typeof weight === "number" ? `${weight}` : (WeightTokens[weight] ?? weight);
};

/**
 * Resolves a line-height token or numeric value.
 * @param lineHeight - Line-height token or number.
 * @example
 * const leading = resolveLineHeight("snug");
 * @returns A CSS line-height value or undefined.
 */
const resolveLineHeight: (lineHeight: FontLineHeight | undefined) => string | undefined = (
    lineHeight: FontLineHeight | undefined,
): string | undefined => {
    if (lineHeight === (void 0)) {
        return (void 0);
    }

    return typeof lineHeight === "number"
        ? `${lineHeight}`
        : (LineHeightTokens[lineHeight] ?? lineHeight);
};

/**
 * Resolves a letter-spacing token or raw CSS length.
 * @param letterSpacing - Letter-spacing token or string.
 * @example
 * const tracking = resolveLetterSpacing("wide");
 * @returns A CSS letter-spacing value or undefined.
 */
const resolveLetterSpacing: (letterSpacing: FontLetterSpacing | undefined) => string | undefined = (
    letterSpacing: FontLetterSpacing | undefined,
): string | undefined => {
    if (letterSpacing === (void 0)) {
        return (void 0);
    }

    return LetterSpacingTokens[letterSpacing] ?? letterSpacing;
};

/**
 * Applies a Font scope to a slot of components.
 * The scope sets the type hierarchy as CSS variables; descendants consume them
 * and can opt into the family, colour, weight, leading, tracking, and transform
 * variables one component at a time.
 * @param props - Element, hierarchy level, scale, font metadata, and native attributes.
 * @example
 * <Font level="h3" family="mono">
 *     <Text variant="body">Scoped text</Text>
 * </Font>
 * @returns A Font scope element.
 */
const Font: FC<FontProps> = ({
    as = "div",
    level,
    scale,
    family,
    color,
    weight,
    lineHeight,
    letterSpacing,
    transform,
    align,
    italic,
    truncate = false,
    className = "",
    style,
    children,
    ref,
    ...rest
}: FontProps) => {
    const parent: FontContextValue | null = useContext(FontContext);
    const resolvedLevel: FontLevel = level ?? parent?.level ?? "body";
    const parentScale: number = parent?.scale ?? 1;
    const ownScale: number = scale === (void 0) || !Number.isFinite(scale) ? 1 : scale;
    const resolvedScale: number = Math.max(1, parentScale * Math.max(1, ownScale));
    const resolvedFamily: string | undefined =
        family === (void 0) ? parent?.family : resolveFamily(family);
    const resolvedColor: string | undefined = color ?? parent?.color;
    const resolvedWeight: string | undefined =
        weight === (void 0) ? parent?.weight : resolveWeight(weight);
    const resolvedLineHeight: string | undefined =
        lineHeight === (void 0) ? parent?.lineHeight : resolveLineHeight(lineHeight);
    const resolvedLetterSpacing: string | undefined =
        letterSpacing === (void 0) ? parent?.letterSpacing : resolveLetterSpacing(letterSpacing);
    const resolvedTransform: string | undefined = transform ?? parent?.transform;
    const resolvedAlign: string | undefined = align ?? parent?.align;
    const resolvedFontStyle: "italic" | "normal" | undefined =
        italic === (void 0) ? parent?.fontStyle : italic ? "italic" : "normal";

    const contextValue: FontContextValue = useMemo(
        (): FontContextValue => ({
            level: resolvedLevel,
            scale: resolvedScale,
            family: resolvedFamily,
            color: resolvedColor,
            weight: resolvedWeight,
            lineHeight: resolvedLineHeight,
            letterSpacing: resolvedLetterSpacing,
            transform: resolvedTransform,
            align: resolvedAlign,
            fontStyle: resolvedFontStyle,
        }),
        [
            resolvedLevel,
            resolvedScale,
            resolvedFamily,
            resolvedColor,
            resolvedWeight,
            resolvedLineHeight,
            resolvedLetterSpacing,
            resolvedTransform,
            resolvedAlign,
            resolvedFontStyle,
        ],
    );

    const fontStyle: FontStyle = useMemo((): FontStyle => {
        const next: FontStyle = {
            "--font-size-current": `var(--type-${resolvedLevel})`,
            "--font-scale": `${resolvedScale}`,
        };

        for (const token of TypeTokens) {
            next[`--type-${token}`] = `calc(var(--type-base-${token}) * ${resolvedScale})`;
        }

        if (resolvedFamily !== (void 0)) {
            next["--font-family-current"] = resolvedFamily;
        }

        if (resolvedColor !== (void 0)) {
            next["--font-color-current"] = resolvedColor;
        }

        if (resolvedWeight !== (void 0)) {
            next["--font-weight-current"] = resolvedWeight;
        }

        if (resolvedLineHeight !== (void 0)) {
            next["--font-leading-current"] = resolvedLineHeight;
        }

        if (resolvedLetterSpacing !== (void 0)) {
            next["--font-tracking-current"] = resolvedLetterSpacing;
        }

        if (resolvedTransform !== (void 0)) {
            next["--font-transform-current"] = resolvedTransform;
        }

        if (resolvedAlign !== (void 0)) {
            next["--font-align-current"] = resolvedAlign;
        }

        if (resolvedFontStyle !== (void 0)) {
            next["--font-style-current"] = resolvedFontStyle;
        }

        return next;
    }, [
        resolvedLevel,
        resolvedScale,
        resolvedFamily,
        resolvedColor,
        resolvedWeight,
        resolvedLineHeight,
        resolvedLetterSpacing,
        resolvedTransform,
        resolvedAlign,
        resolvedFontStyle,
    ]);

    return (
        <FontContext.Provider value={contextValue}>
            {createElement(
                as,
                {
                    ...rest,
                    ref,
                    className: cx(
                        "font",
                        `font--level-${resolvedLevel}`,
                        truncate && "font--truncate",
                        className,
                    ),
                    style: { ...fontStyle, ...style },
                },
                children,
            )}
        </FontContext.Provider>
    );
};

export default Font;

