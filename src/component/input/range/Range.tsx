import {
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type CSSProperties,
    type FC,
    type InputHTMLAttributes,
    type Ref,
} from "react";
import cx from "../../foundation/cx";
import useField, { type FieldState } from "../../foundation/useField";
import Surface from "../../surface/Surface";
import "./Range.css";

/**
 * Props for the Range slider.
 * Type: interface.
 * Native input attributes are forwarded to the range `<input>`; `className` and `style` apply to the field root.
 * Fields: value, defaultValue, onChange, min, max, step, label, hint, error, disabled, className, id, format, ref,
 * and native input attributes.
 * @param value - Controlled numeric value.
 * @param defaultValue - Initial value when uncontrolled.
 * @param onChange - Called with the next numeric value.
 * @param min - Lower bound of the range.
 * @param max - Upper bound of the range.
 * @param step - Granularity of the range.
 * @param label - Visible label shown above the slider.
 * @param hint - Supporting text shown below the slider.
 * @param error - Validation message; replaces the hint and marks the slider invalid.
 * @param disabled - Disables the native range input.
 * @param className - Extra classes for the field root.
 * @param id - Id for the native input; generated when omitted.
 * @param format - Formats the displayed numeric value.
 * @param ref - Ref to the underlying input element.
 * @example
 * <Range label="Volume" value={40} onChange={setVolume} format={(value) => `${value}%`} />
 */
export interface RangeProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "value" | "defaultValue" | "onChange" | "type" | "className" | "min" | "max" | "step"
    > {
    value?: number;
    defaultValue?: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    format?: (value: number) => string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Renders a painted slider under a transparent native range input.
 * @param props - Value, change handler, bounds, step, label, hint, error, and value formatter.
 * @example
 * <Range label="Focus" value={3} min={1} max={5} onChange={setFocus} format={(value) => `${value} / 5`} />
 * @returns A range slider element.
 */
const Range: FC<RangeProps> = ({
    value,
    defaultValue = 0,
    onChange,
    min,
    max,
    step,
    label,
    hint,
    error,
    disabled = false,
    className = "",
    style,
    id,
    format,
    ref,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...rest
}: RangeProps) => {
    const field: FieldState = useField({ id, label, hint, error });
    const controlled: boolean = value !== (void 0);
    const [uncontrolledValue, setUncontrolledValue]: [number, (next: number) => void] =
        useState<number>(defaultValue);
    const currentValue: number = controlled ? (value as number) : uncontrolledValue;
    const minimum: number = min ?? 0;
    const maximum: number = max ?? 100;
    const increment: number = step ?? 1;
    const span: number = maximum - minimum;
    const progress: number = span > 0 ? Math.min(Math.max((currentValue - minimum) / span, 0), 1) : 0;
    const percent: number = Math.round(progress * 10000) / 100;
    const displayValue: string = format === (void 0) ? `${currentValue}` : format(currentValue);
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = [
        field.invalid ? field.errorId : hasHint ? field.hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const fillStyle: CSSProperties = { width: `${percent}%` };
    const thumbStyle: CSSProperties = { left: `${percent}%` };

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        const next: number = event.currentTarget.valueAsNumber;

        if (Number.isNaN(next)) {
            return;
        }

        if (!controlled) {
            setUncontrolledValue(next);
        }

        onChange(next);
    };

    return (
        <div
            className={cx("range", disabled && "range--disabled", className)}
            style={style}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            <div className="range__header">
                {label === (void 0) ? (
                    <span className="range__spacer" />
                ) : (
                    <label className="range__label" htmlFor={field.controlId}>
                        {label}
                    </label>
                )}
                <output className="range__value" htmlFor={field.controlId}>
                    {displayValue}
                </output>
            </div>

            <Surface
                className="range__surface"
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                disabled={disabled}
                background={
                    <span className="range__rail">
                        <span className="range__track">
                            <span className="range__fill" style={fillStyle} />
                        </span>
                    </span>
                }
                foreground={
                    <span className="range__rail">
                        <span className="range__thumb" style={thumbStyle} />
                    </span>
                }
            >
                <input
                    {...rest}
                    ref={ref}
                    id={field.controlId}
                    className="range__native"
                    type="range"
                    min={minimum}
                    max={maximum}
                    step={increment}
                    value={currentValue}
                    disabled={disabled}
                    aria-invalid={field.invalid ? true : ariaInvalid}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    aria-valuetext={displayValue}
                    onChange={handleChange}
                />
            </Surface>

            {field.invalid ? (
                <p className="range__error" id={field.errorId} aria-live="polite">
                    {error}
                </p>
            ) : hasHint ? (
                <p className="range__hint" id={field.hintId}>
                    {hint}
                </p>
            ) : null}
        </div>
    );
};

export default Range;
