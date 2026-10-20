import type {
    FC,
    HTMLAttributes,
    KeyboardEvent,
    PointerEvent,
    ReactNode,
    Ref,
} from "react";
import cx from "../foundation/cx";
import { useRipple, type RippleHandlers } from "../foundation/useRipple";
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
 * Fields: children, className, tone, dot, count, max, disabled, aria-label.
 * @example
 * <Badge tone="mint">On track</Badge>
 * @example
 * <Badge count={128} max={99} aria-label="128 messages" />
 * @example
 * <Badge count={5} tone="accent" disabled />
 */
export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    children?: ReactNode;
    className?: string;
    tone?: BadgeTone;
    dot?: boolean;
    count?: number;
    max?: number;
    disabled?: boolean;
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Renders a label, dot, or capped count badge with a pointer ripple unless disabled.
 * @param props - Content, tone, dot mode, count, cap, disabled state, class name, and native span attributes.
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
    disabled = false,
    "aria-label": ariaLabel,
    onPointerDown,
    onPointerEnter,
    onKeyDown,
    ref,
    ...rest
}: BadgeProps) => {
    const ripple: RippleHandlers = useRipple({ trigger: "click", disabled });
    const hasLabel: boolean = ariaLabel !== (void 0) && ariaLabel.length > 0;
    const isCount: boolean = count !== (void 0);
    const display: ReactNode =
        count !== (void 0)
            ? max !== (void 0) && count > max
                ? `${max}+`
                : `${count}`
            : dot
              ? null
              : children;
    const classes: string = cx(
        "badge",
        `badge--${tone}`,
        dot && "badge--dot",
        isCount && "badge--count",
        disabled && "badge--disabled",
        className,
    );

    return (
        <span
            {...rest}
            ref={ref}
            className={classes}
            role={hasLabel ? "img" : (void 0)}
            aria-label={hasLabel ? ariaLabel : (void 0)}
            aria-disabled={disabled ? "true" : (void 0)}
            aria-hidden={dot && !hasLabel ? true : (void 0)}
            data-disabled={disabled ? "true" : "false"}
            onPointerDown={(event: PointerEvent<HTMLSpanElement>): void => {
                ripple.onPointerDown(event);
                onPointerDown?.(event);
            }}
            onPointerEnter={(event: PointerEvent<HTMLSpanElement>): void => {
                ripple.onPointerEnter(event);
                onPointerEnter?.(event);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLSpanElement>): void => {
                ripple.onKeyDown(event);
                onKeyDown?.(event);
            }}
        >
            {display}
        </span>
    );
};

export default Badge;
