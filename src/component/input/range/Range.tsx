import type { ChangeEvent, ChangeEventHandler, CSSProperties, FC } from "react";
import cx from "../../foundation/cx";
import useField, { type FieldState } from "../../foundation/useField";
import Surface from "../../surface/Surface";
import "./Range.css";

/**
 * Props for the Range slider.
 * Type: interface.
 * Fields: value, onChange, min, max, step, label, hint, error, disabled, className, format.
 * @example
 * <Range label="Volume" value={40} onChange={setVolume} format={(value) => `${value}%`} />
 */
export interface RangeProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    format?: (value: number) => string;
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
    onChange,
    min,
    max,
    step,
    label,
    hint,
    error,
    disabled = false,
    className = "",
    format,
}: RangeProps) => {
    const field: FieldState = useField({ label, hint, error });
    const minimum: number = min ?? 0;
    const maximum: number = max ?? 100;
    const increment: number = step ?? 1;
    const span: number = maximum - minimum;
    const progress: number = span > 0 ? Math.min(Math.max((value - minimum) / span, 0), 1) : 0;
    const percent: number = Math.round(progress * 10000) / 100;
    const displayValue: string = format === (void 0) ? `${value}` : format(value);
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = field.invalid ? field.errorId : hasHint ? field.hintId : "";
    const fillStyle: CSSProperties = { width: `${percent}%` };
    const thumbStyle: CSSProperties = { left: `${percent}%` };

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        const next: number = event.currentTarget.valueAsNumber;

        if (!Number.isNaN(next)) {
            onChange(next);
        }
    };

    return (
        <div
            className={cx("range", className)}
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
                    id={field.controlId}
                    className="range__native"
                    type="range"
                    min={minimum}
                    max={maximum}
                    step={increment}
                    value={value}
                    disabled={disabled}
                    aria-invalid={field.invalid}
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
