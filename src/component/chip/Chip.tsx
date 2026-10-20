import type {
    FC,
    HTMLAttributes,
    KeyboardEvent,
    KeyboardEventHandler,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    Ref,
} from "react";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
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
 * Extends the native `span` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the chip surface.
 * Fields: label, variant, selected, defaultSelected, onSelectedChange, onClick, onRemove, removeLabel,
 * icon, avatar, disabled, className. `onRemove` receives the originating mouse event when the remove
 * button is pressed and no event when the chip is removed with Delete or Backspace.
 * @example
 * <Chip label="Deep work" variant="filter" selected onClick={toggle} onRemove={remove} />
 */
export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className" | "onClick"> {
    label: string;
    variant?: ChipVariant;
    selected?: boolean;
    defaultSelected?: boolean;
    onSelectedChange?: (selected: boolean) => void;
    onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    onRemove?: (event?: ReactMouseEvent<HTMLButtonElement>) => void;
    removeLabel?: string;
    icon?: IconName;
    avatar?: ReactNode;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders an assist, filter, or input chip on a pill Surface.
 * @param props - Label, variant, selection, activation and removal handlers, leading visual, disabled
 * state, and native span attributes.
 * @example
 * <Chip label="Focus" variant="filter" selected onClick={handleToggle} />
 * @returns A chip element.
 */
const Chip: FC<ChipProps> = ({
    label,
    variant = "assist",
    selected,
    defaultSelected = false,
    onSelectedChange,
    onClick,
    onRemove,
    removeLabel,
    icon,
    avatar,
    disabled = false,
    className = "",
    ref,
    ...rest
}: ChipProps) => {
    const isFilter: boolean = variant === "filter";
    const [isSelected, setSelected]: readonly [boolean, (next: boolean) => void] =
        useControllableState<boolean>({
            value: selected,
            defaultValue: defaultSelected,
            onChange: onSelectedChange,
        });
    const isTogglable: boolean = isFilter && (onSelectedChange !== (void 0) || defaultSelected);
    const isActivatable: boolean = onClick !== (void 0) || isTogglable;
    const leading: ReactNode =
        avatar ??
        (icon === (void 0) ? null : <Icon className="chip__icon" name={icon} size={15} aria-hidden="true" />);
    const resolvedRemoveLabel: string = removeLabel ?? `Remove ${label}`;

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

    const handleClick: (event: ReactMouseEvent<HTMLButtonElement>) => void = (
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        onClick?.(event);

        if (event.defaultPrevented || !isTogglable) {
            return;
        }

        setSelected(!isSelected);
    };

    const content: ReactNode = (
        <>
            {leading}
            <span className="chip__label">{label}</span>
            {isFilter && isSelected ? <Icon className="chip__check" name="Check" size={14} aria-hidden="true" /> : null}
        </>
    );

    return (
        <Surface
            ref={ref}
            className={cx(
                "chip",
                `chip--${variant}`,
                isSelected && "chip--selected",
                disabled && "chip--disabled",
                className,
            )}
            shape="pill"
            stateLayer={!disabled}
            disabled={disabled}
            ripple={isActivatable ? { layer: "foreground", trigger: ["hover", "click"] } : false}
            {...rest}
        >
            {isActivatable ? (
                <button
                    type="button"
                    className="chip__main"
                    aria-pressed={isFilter ? isSelected : (void 0)}
                    disabled={disabled}
                    onClick={handleClick}
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
                    aria-label={resolvedRemoveLabel}
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
