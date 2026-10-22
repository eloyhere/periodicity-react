import { createContext, type Context } from "react";
import type { FontLevel } from "./types";

/**
 * Font metadata inherited by a Font scope and its slot.
 * Type: interface.
 * Fields: level, scale, family, color, weight, lineHeight, letterSpacing, transform, align, fontStyle.
 * @example
 * const value: FontContextValue = { level: "body", scale: 1, family: "var(--font-sans)" };
 */
export interface FontContextValue {
    /** Type-scale step used by the scope's own text. */
    level: FontLevel;
    /** Cumulative scale applied to every type token inside the scope. */
    scale: number;
    /** Resolved family, when the scope or an ancestor set one. */
    family?: string;
    /** Resolved colour, when the scope or an ancestor set one. */
    color?: string;
    /** Resolved weight, when the scope or an ancestor set one. */
    weight?: string;
    /** Resolved line-height, when the scope or an ancestor set one. */
    lineHeight?: string;
    /** Resolved letter-spacing, when the scope or an ancestor set one. */
    letterSpacing?: string;
    /** Resolved text-transform, when the scope or an ancestor set one. */
    transform?: string;
    /** Resolved text-align, when the scope or an ancestor set one. */
    align?: string;
    /** Resolved font-style, when the scope or an ancestor set one. */
    fontStyle?: "italic" | "normal";
}

/**
 * Context shared by nested Font scopes and useFont.
 * Type: constant.
 * @example
 * const value: FontContextValue | null = useContext(FontContext);
 */
export const FontContext: Context<FontContextValue | null> =
    createContext<FontContextValue | null>(null);
