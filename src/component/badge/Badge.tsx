import type { AriaAttributes, FC, ReactNode } from "react";
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
 * Fields: children, className, tone, dot, count, max, aria-label.
 * @example
 * <Badge tone="mint">On track</Badge>
 * @example
 * <Badge dot tone="danger" aria-label="Unread notifications" />
 * @example
 * <Badge count={128} max={99} aria-label="128 messages" />
 */
export interface BadgeProps extends Pick<AriaAttributes, "aria-label"> {
    children?: ReactNode;
    className?: string;
    tone?: BadgeTone;
    dot?: boolean;
    count?: number;
    max?: number;
}

/**
 * Renders a label, dot, or capped count badge.
 * @param props - Content, tone, dot mode, count, cap, accessible label, and class name.
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
}: BadgeProps) => {
    const baseClass: string = cx("badge", `badge--${tone}`, className);
    const hasLabel: boolean = ariaLabel !== (void 0) && ariaLabel.length > 0;

    if (dot) {
        return (
            <span
                className={cx(baseClass, "badge--dot")}
                role={hasLabel ? "img" : (void 0)}
                aria-label={hasLabel ? ariaLabel : (void 0)}
                aria-hidden={hasLabel ? (void 0) : true}
            />
        );
    }

    if (count !== (void 0)) {
        const display: string = max !== (void 0) && count > max ? `${max}+` : `${count}`;

        return (
            <span
                className={cx(baseClass, "badge--count")}
                role={hasLabel ? "img" : (void 0)}
                aria-label={hasLabel ? ariaLabel : (void 0)}
            >
                {display}
            </span>
        );
    }

    return (
        <span
            className={baseClass}
            role={hasLabel ? "img" : (void 0)}
            aria-label={hasLabel ? ariaLabel : (void 0)}
        >
            {children}
        </span>
    );
};

export default Badge;
