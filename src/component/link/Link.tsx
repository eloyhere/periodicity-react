import type {
    AnchorHTMLAttributes,
    CSSProperties,
    FC,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    Ref,
} from "react";
import cx from "../foundation/cx";
import "./Link.css";

/**
 * Visual treatment of a link.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: LinkTone = "accent";
 */
export type LinkTone = "default" | "muted" | "accent" | "inherit";

/**
 * Underline behaviour of a link.
 * Type: type alias.
 * Fields: none.
 * @example
 * const underline: LinkUnderline = "hover";
 */
export type LinkUnderline = "always" | "hover" | "none";

/**
 * Props for an accessible anchor.
 * Type: interface.
 * Fields: href, external, tone, underline, disabled, className, ref, plus native anchor attributes.
 * @example
 * <Link href="/docs" external>Documentation</Link>
 */
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> {
    href: string;
    external?: boolean;
    tone?: LinkTone;
    underline?: LinkUnderline;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
    ref?: Ref<HTMLAnchorElement>;
    children?: ReactNode;
}

/**
 * Renders a native anchor with consistent focus, tone, underline, and external
 * link semantics. Native href, target, rel, and event props remain available.
 * @param props - Destination, tone, underline, external/disabled state, and native anchor attributes.
 * @example
 * <Link href="#install" tone="accent">Install</Link>
 * @returns An anchor element.
 */
const Link: FC<LinkProps> = ({
    href,
    external = false,
    tone = "default",
    underline = "hover",
    disabled = false,
    className = "",
    ref,
    onClick,
    children,
    rel,
    target,
    tabIndex,
    ...rest
}: LinkProps) => {
    const handleClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void = (
        event: ReactMouseEvent<HTMLAnchorElement>,
    ): void => {
        if (disabled) {
            event.preventDefault();
            return;
        }

        onClick?.(event);
    };

    return (
        <a
            {...rest}
            ref={ref}
            href={disabled ? (void 0) : href}
            className={cx(
                "link",
                `link--${tone}`,
                `link--underline-${underline}`,
                disabled && "link--disabled",
                className,
            )}
            rel={external ? (rel ?? "noreferrer noopener") : rel}
            target={external ? (target ?? "_blank") : target}
            aria-disabled={disabled ? "true" : (void 0)}
            tabIndex={disabled ? -1 : tabIndex}
            onClick={handleClick}
        >
            {children}
        </a>
    );
};

export default Link;
