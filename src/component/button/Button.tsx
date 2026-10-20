import type { ButtonHTMLAttributes, FC } from "react";
import Icon, { type IconName } from "../icon/Icon";
import Surface, { type RippleTrigger } from "../surface/Surface";
import "./Button.css";

export type ButtonVariant = "solid" | "outline" | "ghost" | "quiet";

export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the Button component.
 * Type: interface.
 * @param variant - Visual variant.
 * @param size - Control size.
 * @param icon - Optional leading icon.
 * @param trailingIcon - Optional trailing icon.
 * @param rippleTrigger - Event that spawns the foreground ripple.
 * @example
 * <Button variant="outline" icon="Plus" rippleTrigger="click">Add</Button>
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconName;
    trailingIcon?: IconName;
    rippleTrigger?: RippleTrigger | readonly RippleTrigger[];
}

/**
 * Renders a button with a foreground ripple.
 * @param props - Variant, size, icons, ripple trigger, and native button attributes.
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
    children,
    ...rest
}: ButtonProps) => {
    const iconSize: number = size === "sm" ? 15 : size === "lg" ? 19 : 17;

    return (
        <Surface
            className={`button button--${variant} button--${size} ${className}`.trim()}
            ripple={{ layer: "foreground", trigger: rippleTrigger }}
        >
            <button className="button__control" type={type} {...rest}>
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
