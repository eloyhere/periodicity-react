import { Children, cloneElement, isValidElement, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../foundation/cx";
import Surface from "../surface/Surface";
import Avatar, { type AvatarProps, type AvatarSize } from "./Avatar";
import "./AvatarGroup.css";

/**
 * Props for the AvatarGroup component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `title`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the group element.
 * Fields: children, max, size, moreLabel, className.
 * @example
 * <AvatarGroup max={3} size="sm">
 *     <Avatar name="Mira Chen" />
 *     <Avatar name="Ada Lovelace" />
 *     <Avatar name="Jonah Reed" />
 * </AvatarGroup>
 */
export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    children: ReactNode;
    max?: number;
    size?: AvatarSize;
    moreLabel?: (overflow: number) => string;
    className?: string;
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Stacks avatars in an overlapping row and collapses the remainder into a `+N` chip.
 * @param props - Avatar children, visible maximum, shared size, overflow labeller, class name, and
 * native span attributes.
 * @example
 * <AvatarGroup max={2} size="sm">
 *     <Avatar name="Mira Chen" />
 *     <Avatar name="Ada Lovelace" />
 *     <Avatar name="Jonah Reed" />
 * </AvatarGroup>
 * @returns An avatar group element.
 */
const AvatarGroup: FC<AvatarGroupProps> = ({
    children,
    max = 4,
    size = "md",
    moreLabel,
    className = "",
    ref,
    ...rest
}: AvatarGroupProps) => {
    const items: ReactNode[] = Children.toArray(children);
    const limit: number = Math.max(1, max);
    const visible: ReactNode[] = items.slice(0, limit);
    const overflow: number = items.length - visible.length;
    const overflowText: string =
        moreLabel === (void 0) ? `${overflow} more` : moreLabel(overflow);

    return (
        <span ref={ref} className={cx("avatar-group", `avatar-group--${size}`, className)} {...rest}>
            {visible.map((child: ReactNode, index: number): ReactNode => (
                <span className="avatar-group__item" key={index}>
                    {isValidElement<AvatarProps>(child) && child.type === Avatar
                        ? cloneElement(child, { size })
                        : child}
                </span>
            ))}
            {overflow > 0 ? (
                <Surface className="avatar-group__more" shape="pill">
                    <span className="avatar-group__more-label" role="img" aria-label={overflowText}>
                        +{overflow}
                    </span>
                </Surface>
            ) : null}
        </span>
    );
};

export default AvatarGroup;
