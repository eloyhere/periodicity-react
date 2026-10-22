import {
    useId,
    useState,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type KeyboardEventHandler,
    type MouseEvent as ReactMouseEvent,
    type PointerEventHandler,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type Ref,
} from "react";
import Icon from "../icon/Icon";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Rate.css";

/**
 * Size step of the rating control.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: RateSize = "md";
 */
export type RateSize = "sm" | "md" | "lg";

/**
 * Props for the Material rating control.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `title`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the field element. `onChange` keeps its
 * rating-value signature and is not forwarded as a native change listener.
 * Fields: value, defaultValue, onChange, onHoverChange, count, allowHalf, allowClear, readOnly,
 * disabled, size, label, hint, error, className.
 * @example
 * <Rate label="Rating" value={rating} onChange={setRating} />
 */
export interface RateProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "onChange"> {
    value?: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
    onHoverChange?: (value: number | null) => void;
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
    size?: RateSize;
    label?: string;
    hint?: string;
    error?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

const rateSizes: Record<RateSize, number> = {
    sm: 18,
    md: 24,
    lg: 32,
};

/**
 * Renders a five-star Material rating with half-star support.
 * @param props - Value, count, half-step, read-only state, labels, class name, and native div attributes.
 * @example
 * <Rate label="How was it?" defaultValue={4} allowHalf />
 * @returns A rating control.
 */
const Rate: FC<RateProps> = ({
    value,
    defaultValue = 0,
    onChange,
    onHoverChange,
    count = 5,
    allowHalf = false,
    allowClear = true,
    readOnly = false,
    disabled = false,
    size = "md",
    label,
    hint,
    error,
    className = "",
    ref,
    onKeyDown,
    onPointerLeave,
    ...rest
}: RateProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedLabel: string = label ?? t("rating");
    const generatedId: string = useId();
    const labelId: string = `${generatedId}-label`;
    const hintId: string = `${generatedId}-hint`;
    const errorId: string = `${generatedId}-error`;
    const max: number = Math.max(1, Math.floor(count));
    const [rating, setRating]: readonly [
        number,
        (next: number | ((previous: number) => number)) => void,
    ] = useControllableState<number>({
        value,
        defaultValue,
        onChange,
    });
    const [hovered, setHovered]: [number | null, (next: number | null) => void] = useState<
        number | null
    >(null);
    const interactive: boolean = !readOnly && !disabled;
    const shown: number = interactive && hovered !== null ? hovered : rating;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const iconSize: number = rateSizes[size];

    const update: (next: number) => void = (next: number): void => {
        if (!interactive) {
            return;
        }

        setRating(Math.min(max, Math.max(0, next)));
    };

    const showHover: (next: number | null) => void = (next: number | null): void => {
        setHovered(next);
        onHoverChange?.(next);
    };

    const valueAt: (
        index: number,
        event: ReactMouseEvent<HTMLButtonElement> | ReactPointerEvent<HTMLButtonElement>,
    ) => number = (
        index: number,
        event: ReactMouseEvent<HTMLButtonElement> | ReactPointerEvent<HTMLButtonElement>,
    ): number => {
        if (!allowHalf) {
            return index + 1;
        }

        const rect: DOMRect = event.currentTarget.getBoundingClientRect();
        const fraction: number = (event.clientX - rect.left) / rect.width;

        return index + (fraction < 0.5 ? 0.5 : 1);
    };

    const handlePointerMove: (
        index: number,
        event: ReactPointerEvent<HTMLButtonElement>,
    ) => void = (index: number, event: ReactPointerEvent<HTMLButtonElement>): void => {
        if (interactive) {
            showHover(valueAt(index, event));
        }
    };

    const handleClick: (index: number, event: ReactMouseEvent<HTMLButtonElement>) => void = (
        index: number,
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        const next: number = valueAt(index, event);

        if (allowClear && next === rating) {
            update(0);
        } else {
            update(next);
        }
    };

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (interactive) {
            const step: number = allowHalf ? 0.5 : 1;

            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                update(rating + step);
            } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                update(rating - step);
            } else if (event.key === "Home") {
                event.preventDefault();
                update(0);
            } else if (event.key === "End") {
                event.preventDefault();
                update(max);
            }
        }

        onKeyDown?.(event);
    };

    const handlePointerLeave: PointerEventHandler<HTMLDivElement> = (
        event: Parameters<PointerEventHandler<HTMLDivElement>>[0],
    ): void => {
        showHover(null);
        onPointerLeave?.(event);
    };

    const describedBy: string = invalid ? errorId : hint === (void 0) ? "" : hintId;

    return (
        <div
            ref={ref}
            className={cx(
                "rate-field",
                `rate-field--${size}`,
                disabled && "rate-field--disabled",
                readOnly && "rate-field--readonly",
                invalid && "rate-field--invalid",
                className,
            )}
            data-disabled={disabled ? "true" : "false"}
            {...rest}
        >
            <span className="rate-field__label" id={labelId}>
                {resolvedLabel}
            </span>
            <div
                className="rate-field__stars"
                role="radiogroup"
                aria-labelledby={labelId}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                aria-readonly={readOnly ? "true" : (void 0)}
                aria-disabled={disabled ? "true" : (void 0)}
                onKeyDown={handleKeyDown}
                onPointerLeave={handlePointerLeave}
            >
                {Array.from(
                    { length: max },
                    (value: unknown, index: number): number => {
                        void value;
                        return index;
                    },
                ).map(
                    (index: number): ReactNode => {
                        const ratio: number = Math.min(1, Math.max(0, shown - index));
                        const style: CSSProperties = {
                            "--rate-icon-size": `${iconSize}px`,
                        } as CSSProperties;

                        return (
                            <button
                                key={index}
                                type="button"
                                className="rate-field__star"
                                style={style}
                                role="radio"
                                aria-checked={rating === index + 1}
                                aria-label={t(index === 0 ? "rateStar" : "rateStars", {
                                    count: index + 1,
                                })}
                                tabIndex={readOnly ? -1 : index === 0 ? 0 : -1}
                                disabled={disabled}
                                onPointerMove={(
                                    event: ReactPointerEvent<HTMLButtonElement>,
                                ): void => handlePointerMove(index, event)}
                                onClick={(event: ReactMouseEvent<HTMLButtonElement>): void =>
                                    handleClick(index, event)
                                }
                            >
                                <span className="rate-field__star-empty" aria-hidden="true">
                                    <Icon name="Star" size={iconSize} />
                                </span>
                                <span
                                    className="rate-field__star-fill"
                                    style={{ width: `${ratio * 100}%` }}
                                    aria-hidden="true"
                                >
                                    <Icon name="Star" size={iconSize} />
                                </span>
                            </button>
                        );
                    },
                )}
            </div>
            {invalid ? (
                <p className="rate-field__error" id={errorId} role="alert">
                    {error}
                </p>
            ) : hint === (void 0) || hint.length === 0 ? null : (
                <p className="rate-field__hint" id={hintId}>
                    {hint}
                </p>
            )}
        </div>
    );
};

export default Rate;
