import type { ButtonHTMLAttributes, CSSProperties, FC, ReactNode, Ref } from "react";
import Icon, { type IconName } from "../icon/Icon";
import Surface, { type RippleTrigger } from "../surface/Surface";
import "./Button.css";

export type ButtonVariant = "solid" | "outline" | "ghost" | "quiet";

export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the Button component.
 * Type: interface.
 * Extends the native `button` attributes, so `id`, `aria-*`, `data-*`, `tabIndex`, `title`, and every
 * mouse, pointer, keyboard, and focus handler are forwarded to the control element. `className` and
 * `style` target the surrounding surface so layout and theming apply to the visible shape.
 * @param variant - Visual variant.
 * @param size - Control size.
 * @param prefix - Leading slot; a string is treated as an icon name.
 * @param content - Centre slot. Falls back to `children`.
 * @param suffix - Trailing slot; a string is treated as an icon name.
 * @param icon - Deprecated leading icon alias for `prefix`.
 * @param trailingIcon - Deprecated trailing icon alias for `suffix`.
 * @param rippleTrigger - Event that spawns the foreground ripple.
 * @param ref - Ref forwarded to the underlying `button` element.
 * @example
 * <Button variant="outline" prefix="Plus" content="Add" suffix="ArrowRight" />
 */
export interface ButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "content" | "prefix"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    prefix?: ReactNode;
    content?: ReactNode;
    suffix?: ReactNode;
    /** @deprecated Use `prefix`. */
    icon?: IconName;
    /** @deprecated Use `suffix`. */
    trailingIcon?: IconName;
    rippleTrigger?: RippleTrigger | readonly RippleTrigger[];
    className?: string;
    style?: CSSProperties;
    ref?: Ref<HTMLButtonElement>;
}

/**
 * Renders a button with a foreground ripple.
 * @param props - Variant, size, icons, ripple trigger, class name, style, and native button attributes.
 * @example
 * <Button rippleTrigger="hover">Hover me</Button>
 * @returns A button element.
 */
const renderDecoration: (
    slot: ReactNode,
    legacyIcon: IconName | undefined,
    iconSize: number,
) => ReactNode = (
    slot: ReactNode,
    legacyIcon: IconName | undefined,
    iconSize: number,
): ReactNode => {
    if (typeof slot === "string") {
        return <Icon className="button__icon" name={slot as IconName} size={iconSize} />;
    }

    if (slot === (void 0) || slot === null) {
        return legacyIcon === (void 0) ? null : (
            <Icon className="button__icon" name={legacyIcon} size={iconSize} />
        );
    }

    return slot;
};

const hasSlotContent: (slot: ReactNode) => boolean = (slot: ReactNode): boolean =>
    slot !== (void 0) && slot !== null && slot !== false && slot !== "";

/**
 * Renders a button with prefix, content, and suffix slots.
 * @param props - Variant, size, slots, ripple trigger, class name, style, and native button attributes.
 * @example
 * <Button prefix="Plus" content="Add" suffix="ArrowRight" />
 * @returns A button element.
 */
const Button: FC<ButtonProps> = ({
    variant = "solid",
    size = "md",
    prefix,
    content,
    suffix,
    icon,
    trailingIcon,
    rippleTrigger = ["hover", "click"],
    type = "button",
    className = "",
    style,
    disabled = false,
    ref,
    children,
    ...rest
}: ButtonProps) => {
    const iconSize: number = size === "sm" ? 15 : size === "lg" ? 19 : 17;
    const prefixNode: ReactNode = renderDecoration(prefix, icon, iconSize);
    const suffixNode: ReactNode = renderDecoration(suffix, trailingIcon, iconSize);
    const contentNode: ReactNode = content === (void 0) ? children : content;

    return (
        <Surface
            className={`button button--${variant} button--${size} ${className}`.trim()}
            style={style}
            disabled={disabled}
            ripple={{ layer: "foreground", trigger: rippleTrigger }}
        >
            <button ref={ref} className="button__control" type={type} disabled={disabled} {...rest}>
                {hasSlotContent(prefixNode) ? (
                    <span className="button__slot button__slot--prefix">{prefixNode}</span>
                ) : null}
                {hasSlotContent(contentNode) ? (
                    <span className="button__slot button__slot--content">{contentNode}</span>
                ) : null}
                {hasSlotContent(suffixNode) ? (
                    <span className="button__slot button__slot--suffix">{suffixNode}</span>
                ) : null}
            </button>
        </Surface>
    );
};

export default Button;
