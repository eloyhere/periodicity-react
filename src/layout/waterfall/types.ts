/**
 * Gap steps shared by the normal and virtual waterfall layouts.
 * Type: type alias.
 * Fields: none.
 * @example
 * const gap: WaterfallGap = "md";
 */
export type WaterfallGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Pixel value of every gap step.
 * Type: constant.
 * Fields: none.
 * The virtual layout needs the numeric value to place cards, while the CSS
 * classes keep using the matching spacing tokens for horizontal gaps.
 * @example
 * const gapPixels: number = WaterfallGapPixels.md;
 */
export const WaterfallGapPixels: Readonly<Record<WaterfallGap, number>> = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
};
