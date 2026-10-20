import type {
    FC,
    HTMLAttributes,
    KeyboardEvent,
    MouseEvent as ReactMouseEvent,
    MouseEventHandler,
    PointerEvent,
    ReactNode,
    Ref,
    RefCallback,
} from "react";
import cx from "../foundation/cx";
import useMergedRef from "../foundation/useMergedRef";
import { useRipple, type RippleHandlers } from "../foundation/useRipple";
import Icon, { type IconName } from "../icon/Icon";
import "./Tag.css";

/**
 * Semantic tone of a tag.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: TagTone = "success";
 */
export type TagTone = "neutral" | "primary" | "success" | "warning" | "danger";

/**
 * Visual treatment of a tag.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: TagVariant = "outlined";
 */
export type TagVariant = "filled" | "outlined";

/**
 * Size of a tag.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: TagSize = "sm";
 */
export type TagSize = "sm" | "md";

/**
 * Props for the Tag component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `title`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the rendered root element.
 * Fields: children, label, tone, variant, size, icon, removable, onRemove, removeLabel, disabled,
 * className, onClick.
 * @example
 * <Tag tone="success" variant="outlined" icon="Check" removable onRemove={removeTag}>
 *     Active
 * </Tag>
 */
export interface TagProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onClick"> {
    children?: ReactNode;
    label?: string;
    tone?: TagTone;
    variant?: TagVariant;
    size?: TagSize;
    icon?: IconName;
    removable?: boolean;
    onRemove?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    removeLabel?: string;
    disabled?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLElement>;
    ref?: Ref<HTMLElement>;
}

/**
 * Renders a compact label with an optional icon, semantic tone, and remove action.
 * @param props - Content, label, tone, variant, size, icon, removal, disabled state, and native attributes.
 * @example
 * <Tag tone="success" variant="outlined" icon="Check" removable onRemove={removeTag}>
 *     Active
 * </Tag>
 * @returns A static, clickable, or removable tag element.
 */
const Tag: FC<TagProps> = ({
    children,
    label,
    tone = "neutral",
    variant = "filled",
    size = "md",
    icon,
    onRemove,
    removable = onRemove !== (void 0),
    removeLabel,
    disabled = false,
    className = "",
    onClick,
    onPointerDown,
    onPointerEnter,
    onKeyDown,
    ref,
    "aria-label": ariaLabel,
    ...rest
}: TagProps) => {
    const mergedRef: RefCallback<HTMLElement> = useMergedRef<HTMLElement>(ref);
    const ripple: RippleHandlers = useRipple({ trigger: "click", disabled });
    const handlePointerDown: (event: PointerEvent<HTMLElement>) => void = (
        event: PointerEvent<HTMLElement>,
    ): void => {
        ripple.onPointerDown(event);
        onPointerDown?.(event);
    };
    const handlePointerEnter: (event: PointerEvent<HTMLElement>) => void = (
        event: PointerEvent<HTMLElement>,
    ): void => {
        ripple.onPointerEnter(event);
        onPointerEnter?.(event);
    };
    const handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void = (
        event: KeyboardEvent<HTMLElement>,
    ): void => {
        ripple.onKeyDown(event);
        onKeyDown?.(event);
    };
    const isClickable: boolean = onClick !== (void 0);
    const canRemove: boolean = removable && onRemove !== (void 0);
    const visibleLabel: ReactNode = children ?? label;
    const childText: string =
        typeof children === "string" ? children : typeof children === "number" ? `${children}` : "";
    const labelText: string = label !== (void 0) && label.length > 0 ? label : childText;
    const accessibleText: string = labelText.length > 0 ? labelText : (ariaLabel ?? "");
    const removeAriaLabel: string =
        removeLabel ?? (accessibleText.length > 0 ? `Remove ${accessibleText}` : "Remove tag");
    const groupLabel: string | undefined = ariaLabel ?? (labelText.length > 0 ? labelText : (void 0));
    const iconSize: number = size === "sm" ? 12 : 14;
    const removeIconSize: number = size === "sm" ? 12 : 13;
    const classes: string = cx(
        "tag",
        `tag--${tone}`,
        `tag--${variant}`,
        `tag--${size}`,
        isClickable && "tag--interactive",
        canRemove && "tag--removable",
        disabled && "tag--disabled",
        className,
    );

    const handleRemove: MouseEventHandler<HTMLButtonElement> = (
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        event.stopPropagation();

        if (disabled) {
            return;
        }

        onRemove?.(event);
    };

    const content: ReactNode = (
        <>
            {icon === (void 0) ? null : <Icon className="tag__icon" name={icon} size={iconSize} />}
            {visibleLabel === (void 0) || visibleLabel === null || visibleLabel === false ? null : (
                <span className="tag__label">{visibleLabel}</span>
            )}
        </>
    );

    const mainContent: ReactNode =
        isClickable && canRemove ? (
            <button type="button" className="tag__main" disabled={disabled} onClick={onClick}>
                {content}
            </button>
        ) : (
            <span className="tag__main">{content}</span>
        );

    const removeButton: ReactNode = canRemove ? (
        <button
            type="button"
            className="tag__remove"
            aria-label={removeAriaLabel}
            disabled={disabled}
            onClick={handleRemove}
        >
            <Icon className="tag__icon" name="Close" size={removeIconSize} />
        </button>
    ) : null;

    if (isClickable && !canRemove) {
        return (
            <button
                ref={mergedRef}
                type="button"
                className={classes}
                disabled={disabled}
                aria-label={ariaLabel}
                onClick={onClick}
                onPointerDown={handlePointerDown}
                onPointerEnter={handlePointerEnter}
                onKeyDown={handleKeyDown}
                {...rest}
            >
                {mainContent}
            </button>
        );
    }

    if (canRemove) {
        return (
            <span
                ref={mergedRef}
                role="group"
                className={classes}
                aria-label={groupLabel}
                aria-disabled={disabled ? true : (void 0)}
                onPointerDown={handlePointerDown}
                onPointerEnter={handlePointerEnter}
                onKeyDown={handleKeyDown}
                {...rest}
            >
                {mainContent}
                {removeButton}
            </span>
        );
    }

    return (
        <span
            ref={mergedRef}
            className={classes}
            aria-disabled={disabled ? true : (void 0)}
            aria-label={ariaLabel}
            onPointerDown={handlePointerDown}
            onPointerEnter={handlePointerEnter}
            onKeyDown={handleKeyDown}
            {...rest}
        >
            {mainContent}
        </span>
    );
};

export default Tag;
