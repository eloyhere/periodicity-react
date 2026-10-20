import type { FC, KeyboardEvent, KeyboardEventHandler, ReactNode } from "react";
import cx from "../foundation/cx";
import Icon, { type IconName } from "../icon/Icon";
import Surface from "../surface/Surface";
import "./Chip.css";

/**
 * Visual variants of a chip.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: ChipVariant = "filter";
 */
export type ChipVariant = "assist" | "filter" | "input";

/**
 * Props for the Chip component.
 * Type: interface.
 * Fields: label, variant, selected, onClick, onRemove, icon, avatar, disabled, className.
 * @example
 * <Chip label="Deep work" variant="filter" selected onClick={toggle} onRemove={remove} />
 */
export interface ChipProps {
    label: string;
    variant?: ChipVariant;
    selected?: boolean;
    onClick?: () => void;
    onRemove?: () => void;
    icon?: IconName;
    avatar?: ReactNode;
    disabled?: boolean;
    className?: string;
}

/**
 * Renders an assist, filter, or input chip on a pill Surface.
 * @param props - Label, variant, selection, activation and removal handlers, leading visual, and disabled state.
 * @example
 * <Chip label="Focus" variant="filter" selected onClick={handleToggle} />
 * @returns A chip element.
 */
const Chip: FC<ChipProps> = ({
    label,
    variant = "assist",
    selected = false,
    onClick,
    onRemove,
    icon,
    avatar,
    disabled = false,
    className = "",
}: ChipProps) => {
    const isFilter: boolean = variant === "filter";
    const isActivatable: boolean = onClick !== (void 0);
    const leading: ReactNode =
        avatar ??
        (icon === (void 0) ? null : <Icon className="chip__icon" name={icon} size={15} aria-hidden="true" />);
    const removeLabel: string = `Remove ${label}`;

    const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
        event: KeyboardEvent<HTMLButtonElement>,
    ): void => {
        if (onRemove === (void 0) || disabled) {
            return;
        }

        if (event.key !== "Delete" && event.key !== "Backspace") {
            return;
        }

        event.preventDefault();
        onRemove();
    };

    const content: ReactNode = (
        <>
            {leading}
            <span className="chip__label">{label}</span>
            {isFilter && selected ? <Icon className="chip__check" name="Check" size={14} aria-hidden="true" /> : null}
        </>
    );

    return (
        <Surface
            className={cx(
                "chip",
                `chip--${variant}`,
                selected && "chip--selected",
                disabled && "chip--disabled",
                className,
            )}
            shape="pill"
            stateLayer={!disabled}
            disabled={disabled}
            ripple={isActivatable ? { layer: "foreground", trigger: ["hover", "click"] } : false}
        >
            {isActivatable ? (
                <button
                    type="button"
                    className="chip__main"
                    aria-pressed={isFilter ? selected : (void 0)}
                    disabled={disabled}
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                >
                    {content}
                </button>
            ) : (
                <span className="chip__main" aria-disabled={disabled ? true : (void 0)}>
                    {content}
                </span>
            )}
            {onRemove === (void 0) ? null : (
                <button
                    type="button"
                    className="chip__remove"
                    aria-label={removeLabel}
                    disabled={disabled}
                    onClick={onRemove}
                >
                    <Icon name="Close" size={13} aria-hidden="true" />
                </button>
            )}
        </Surface>
    );
};

export default Chip;
