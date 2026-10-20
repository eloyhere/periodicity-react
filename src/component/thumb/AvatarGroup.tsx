import {
    Children,
    cloneElement,
    isValidElement,
    type FC,
    type ReactNode,
} from "react";
import cx from "../foundation/cx";
import Surface from "../surface/Surface";
import Avatar, { type AvatarProps, type AvatarSize } from "./Avatar";
import "./AvatarGroup.css";

/**
 * Props for the AvatarGroup component.
 * Type: interface.
 * Fields: children, max, size, className.
 * @example
 * <AvatarGroup max={3} size="sm">
 *     <Avatar name="Mira Chen" />
 *     <Avatar name="Ada Lovelace" />
 *     <Avatar name="Jonah Reed" />
 * </AvatarGroup>
 */
export interface AvatarGroupProps {
    children: ReactNode;
    max?: number;
    size?: AvatarSize;
    className?: string;
}

/**
 * Stacks avatars in an overlapping row and collapses the remainder into a `+N` chip.
 * @param props - Avatar children, visible maximum, shared size, and class name.
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
    className = "",
}: AvatarGroupProps) => {
    const items: ReactNode[] = Children.toArray(children);
    const limit: number = Math.max(1, max);
    const visible: ReactNode[] = items.slice(0, limit);
    const overflow: number = items.length - visible.length;

    return (
        <span className={cx("avatar-group", `avatar-group--${size}`, className)}>
            {visible.map((child: ReactNode, index: number): ReactNode => (
                <span className="avatar-group__item" key={index}>
                    {isValidElement<AvatarProps>(child) && child.type === Avatar
                        ? cloneElement(child, { size })
                        : child}
                </span>
            ))}
            {overflow > 0 ? (
                <Surface className="avatar-group__more" shape="pill">
                    <span className="avatar-group__more-label" role="img" aria-label={`${overflow} more`}>
                        +{overflow}
                    </span>
                </Surface>
            ) : null}
        </span>
    );
};

export default AvatarGroup;
