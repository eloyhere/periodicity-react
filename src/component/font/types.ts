/**
 * Typography hierarchy used by the Font scope.
 * Type: type alias.
 * Values: display, h1, h2, h3, h4, body, body-sm, label, mono.
 * @example
 * const level: FontLevel = "body";
 */
export type FontLevel = "display" | "h1" | "h2" | "h3" | "h4" | "body" | "body-sm" | "label" | "mono";

/**
 * Font family token or a raw CSS family stack.
 * Type: type alias.
 * @example
 * const family: FontFamily = "mono";
 */
export type FontFamily = "sans" | "display" | "mono" | (string & {});

/**
 * Font weight token or a numeric weight.
 * Type: type alias.
 * @example
 * const weight: FontWeight = "semibold";
 */
export type FontWeight = "regular" | "medium" | "semibold" | "bold" | number;

/**
 * Line-height token or a unitless/relative value.
 * Type: type alias.
 * @example
 * const leading: FontLineHeight = "snug";
 */
export type FontLineHeight = "tight" | "snug" | "normal" | "relaxed" | number;

/**
 * Letter-spacing token or a raw CSS length.
 * Type: type alias.
 * @example
 * const tracking: FontLetterSpacing = "wide";
 */
export type FontLetterSpacing = "tight" | "normal" | "wide" | "widest" | string;

/**
 * Text-transform value accepted by Font.
 * Type: type alias.
 * @example
 * const transform: FontTransform = "uppercase";
 */
export type FontTransform = "none" | "uppercase" | "lowercase" | "capitalize";

/**
 * Text alignment value accepted by Font.
 * Type: type alias.
 * @example
 * const align: FontAlign = "center";
 */
export type FontAlign = "start" | "center" | "end" | "justify";

/**
 * Element rendered by the Font scope.
 * Type: type alias.
 * @example
 * const element: FontElement = "span";
 */
export type FontElement = "div" | "span" | "section" | "article" | "p" | "label" | "strong" | "em";
