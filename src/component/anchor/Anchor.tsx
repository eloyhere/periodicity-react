import type { FC, MouseEvent as ReactMouseEvent, ReactNode, Ref } from "react";
import cx from "../foundation/cx";
import Link, { type LinkProps } from "../link/Link";
import "./Anchor.css";

/**
 * Props for an in-page anchor link.
 * Type: interface.
 * Fields: href, active, onNavigate, className, ref, plus native link attributes.
 * @example
 * <Anchor href="#installation" active>Installation</Anchor>
 */
export interface AnchorProps extends Omit<LinkProps, "href" | "children" | "ref"> {
    href: string;
    active?: boolean;
    onNavigate?: (href: string, event: ReactMouseEvent<HTMLAnchorElement>) => void;
    className?: string;
    ref?: Ref<HTMLAnchorElement>;
    children: ReactNode;
}

/**
 * Renders a section anchor with an active indicator and an optional navigation
 * callback. Native hash navigation remains available when the callback does not
 * prevent the default event.
 * @param props - Destination, active state, navigation callback, and native link attributes.
 * @example
 * <Anchor href="#forms" active>Forms</Anchor>
 * @returns An anchor link for in-page navigation.
 */
const Anchor: FC<AnchorProps> = ({
    href,
    active = false,
    onNavigate,
    className = "",
    ref,
    onClick,
    children,
    ...rest
}: AnchorProps) => {
    const handleClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void = (
        event: ReactMouseEvent<HTMLAnchorElement>,
    ): void => {
        onNavigate?.(href, event);

        if (!event.defaultPrevented) {
            onClick?.(event);
        }
    };

    return (
        <Link
            {...rest}
            ref={ref}
            href={href}
            tone="inherit"
            underline="none"
            className={cx("anchor", active && "anchor--active", className)}
            aria-current={active ? "location" : (void 0)}
            onClick={handleClick}
        >
            <span className="anchor__marker" aria-hidden="true" />
            <span className="anchor__label">{children}</span>
        </Link>
    );
};

export default Anchor;
