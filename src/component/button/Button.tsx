import type { ButtonHTMLAttributes, CSSProperties, FC, Ref } from "react";
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
 * @param icon - Optional leading icon.
 * @param trailingIcon - Optional trailing icon.
 * @param rippleTrigger - Event that spawns the foreground ripple.
 * @param ref - Ref forwarded to the underlying `button` element.
 * @example
 * <Button variant="outline" icon="Plus" rippleTrigger="click">Add</Button>
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconName;
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
const Button: FC<ButtonProps> = ({
    variant = "solid",
    size = "md",
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

    return (
        <Surface
            className={`button button--${variant} button--${size} ${className}`.trim()}
            style={style}
            disabled={disabled}
            ripple={{ layer: "foreground", trigger: rippleTrigger }}
        >
            <button ref={ref} className="button__control" type={type} disabled={disabled} {...rest}>
                {icon ? <Icon className="button__icon" name={icon} size={iconSize} /> : null}
                <span className="button__label">{children}</span>
                {trailingIcon ? (
                    <Icon className="button__icon" name={trailingIcon} size={iconSize} />
                ) : null}
            </button>
        </Surface>
    );
};

export default Button;
