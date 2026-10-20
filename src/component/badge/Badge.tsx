import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../foundation/cx";
import "./Badge.css";

/**
 * Semantic tone of a badge.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: BadgeTone = "amber";
 */
export type BadgeTone = "neutral" | "lime" | "accent" | "mint" | "violet" | "amber" | "danger";

/**
 * Props for the Badge component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the rendered element.
 * Fields: children, className, tone, dot, count, max, aria-label.
 * @example
 * <Badge tone="mint">On track</Badge>
 * @example
 * <Badge dot tone="danger" aria-label="Unread notifications" />
 * @example
 * <Badge count={128} max={99} aria-label="128 messages" />
 */
export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    children?: ReactNode;
    className?: string;
    tone?: BadgeTone;
    dot?: boolean;
    count?: number;
    max?: number;
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Renders a label, dot, or capped count badge.
 * @param props - Content, tone, dot mode, count, cap, accessible label, class name, and native span attributes.
 * @example
 * <Badge count={5} tone="accent" />
 * @returns A badge element.
 */
const Badge: FC<BadgeProps> = ({
    children,
    className = "",
    tone = "neutral",
    dot = false,
    count,
    max,
    "aria-label": ariaLabel,
    ref,
    ...rest
}: BadgeProps) => {
    const baseClass: string = cx("badge", `badge--${tone}`, className);
    const hasLabel: boolean = ariaLabel !== (void 0) && ariaLabel.length > 0;

    if (dot) {
        return (
            <span
                ref={ref}
                className={cx(baseClass, "badge--dot")}
                role={hasLabel ? "img" : (void 0)}
                aria-label={hasLabel ? ariaLabel : (void 0)}
                aria-hidden={hasLabel ? (void 0) : true}
                {...rest}
            />
        );
    }

    if (count !== (void 0)) {
        const display: string = max !== (void 0) && count > max ? `${max}+` : `${count}`;

        return (
            <span
                ref={ref}
                className={cx(baseClass, "badge--count")}
                role={hasLabel ? "img" : (void 0)}
                aria-label={hasLabel ? ariaLabel : (void 0)}
                {...rest}
            >
                {display}
            </span>
        );
    }

    return (
        <span
            ref={ref}
            className={baseClass}
            role={hasLabel ? "img" : (void 0)}
            aria-label={hasLabel ? ariaLabel : (void 0)}
            {...rest}
        >
            {children}
        </span>
    );
};

export default Badge;
