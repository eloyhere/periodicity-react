import { createElement, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../foundation/cx";
import "./Text.css";

export type TextVariant =
    | "display"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "body"
    | "body-sm"
    | "label"
    | "mono";

export type TextTone = "default" | "soft" | "muted" | "accent" | "danger";

export type TextElement =
    | "p"
    | "span"
    | "div"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "label"
    | "strong"
    | "em"
    | "code";

/**
 * Props for the Text component.
 * Type: interface.
 * Extends the native element attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the rendered element.
 * @param as - Element to render; defaults to `p`.
 * @param variant - Typographic scale.
 * @param tone - Semantic colour.
 * @param truncate - Clips overflow with an ellipsis.
 * @param numeric - Uses tabular figures.
 * @param ref - Ref forwarded to the rendered element.
 * @example
 * <Text as="h2" variant="h2">Today</Text>
 */
export interface TextProps extends HTMLAttributes<HTMLElement> {
    as?: TextElement;
    variant?: TextVariant;
    tone?: TextTone;
    truncate?: boolean;
    numeric?: boolean;
    children?: ReactNode;
    ref?: Ref<HTMLElement>;
}

/**
 * Renders selectable text on the typographic scale.
 * @param props - Element, variant, tone, truncation, numeric figures, and native attributes.
 * @example
 * <Text variant="label" tone="muted">Cycle 04</Text>
 * @returns A text element.
 */
const Text: FC<TextProps> = ({
    as = "p",
    variant = "body",
    tone = "default",
    truncate = false,
    numeric = false,
    className = "",
    children,
    ...rest
}: TextProps) =>
    createElement(
        as,
        {
            ...rest,
            className: cx(
                "text",
                `text--${variant}`,
                `text--tone-${tone}`,
                truncate && "text--truncate",
                numeric && "text--numeric",
                className,
            ),
        },
        children,
    );

export default Text;
