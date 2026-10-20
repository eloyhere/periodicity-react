import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../foundation/cx";
import Icon, { type IconName } from "../icon/Icon";
import Text from "../text/Text";
import "./EmptyState.css";

/**
 * Props for the EmptyState component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the empty-state container. `title` remains the
 * empty-state heading rather than a tooltip.
 * Fields: title, description, icon, action, className.
 * @example
 * <EmptyState
 *     title="No rituals yet"
 *     description="Rituals you add will appear here."
 *     action={<Button>New ritual</Button>}
 * />
 */
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "title"> {
    title: string;
    description?: ReactNode;
    icon?: IconName;
    action?: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a centred empty-state message with an optional icon and action slot.
 * @param props - Title, description, icon, action, class name, and native div attributes.
 * @example
 * <EmptyState title="No results" description="Try a different filter." icon="Search" />
 * @returns An empty-state element.
 */
const EmptyState: FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    action,
    className = "",
    ref,
    ...rest
}: EmptyStateProps) => (
    <div ref={ref} className={cx("empty", className)} {...rest}>
        {icon === (void 0) ? null : (
            <span className="empty__icon" aria-hidden="true">
                <Icon name={icon} size={22} />
            </span>
        )}
        <div className="empty__copy">
            <Text as="h3" variant="h3" className="empty__title">
                {title}
            </Text>
            {description === (void 0) || description === null || description === false ? null : (
                <Text as="p" variant="body" tone="muted" className="empty__description">
                    {description}
                </Text>
            )}
        </div>
        {action === (void 0) || action === null || action === false ? null : (
            <div className="empty__action">{action}</div>
        )}
    </div>
);

export default EmptyState;
