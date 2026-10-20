import {
    useRef,
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type CompositionEvent,
    type CompositionEventHandler,
    type FC,
    type FocusEvent,
    type FocusEventHandler,
    type KeyboardEvent,
    type KeyboardEventHandler,
    type MouseEvent,
    type MutableRefObject,
} from "react";
import Icon from "../../icon/Icon";
import cx from "../../foundation/cx";
import useField, { type FieldState } from "../../foundation/useField";
import Surface from "../../surface/Surface";
import "./NumberInput.css";

/**
 * Visual variant of the number field.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: NumberInputVariant = "fill";
 */
export type NumberInputVariant = "outline" | "fill" | "standard";

/**
 * Props for the NumberInput.
 * Type: interface.
 * Fields: label, value, onChange, min, max, step, precision, hint, error, disabled, placeholder, variant, className.
 * @example
 * <NumberInput label="Servings" value={4} min={1} max={12} onChange={setServings} />
 */
export interface NumberInputProps {
    label: string;
    value: number | null;
    onChange: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    hint?: string;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
    variant?: NumberInputVariant;
    className?: string;
}

/**
 * Counts the decimal places used by a number.
 * @param value - Number to inspect.
 * @example
 * const places = countDecimals(0.25);
 * @returns The number of decimal places, or zero for integers.
 */
const countDecimals: (value: number) => number = (value: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    const text: string = `${value}`;
    const decimalIndex: number = text.indexOf(".");

    return decimalIndex === -1 ? 0 : text.length - decimalIndex - 1;
};

/**
 * Rounds a number to the requested number of decimal places.
 * @param value - Number to round.
 * @param places - Decimal places, from zero to twenty.
 * @example
 * const rounded = roundTo(1.2345, 2);
 * @returns The rounded number.
 */
const roundTo: (value: number, places: number) => number = (value: number, places: number): number => {
    const factor: number = 10 ** places;

    return Math.round(value * factor) / factor;
};

/**
 * Clamps a number between optional bounds.
 * @param value - Candidate number.
 * @param minimum - Lower bound, when present.
 * @param maximum - Upper bound, when present.
 * @example
 * const bounded = clampValue(12, 0, 10);
 * @returns The bounded number.
 */
const clampValue: (value: number, minimum: number | void, maximum: number | void) => number = (
    value: number,
    minimum: number | void,
    maximum: number | void,
): number => {
    let next: number = value;

    if (minimum !== (void 0) && next < minimum) {
        next = minimum;
    }

    if (maximum !== (void 0) && next > maximum) {
        next = maximum;
    }

    return next;
};

/**
 * Parses user input into a number, an empty value, or an invalid marker.
 * @param text - Raw input text, with either a dot or a comma as the decimal separator.
 * @example
 * const parsed = parseNumber("1,5");
 * @returns A number, null for empty input, or (void 0) for invalid input.
 */
const parseNumber: (text: string) => number | null | void = (text: string): number | null | void => {
    const trimmed: string = text.trim();

    if (trimmed.length === 0) {
        return null;
    }

    const normalised: string = trimmed.replace(",", ".");

    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(normalised)) {
        return (void 0);
    }

    const parsed: number = Number(normalised);

    return Number.isFinite(parsed) ? parsed : (void 0);
};

/**
 * Formats a numeric value for display.
 * @param value - Value to format, or null for an empty field.
 * @param precision - Decimal places used when formatting.
 * @example
 * const text = formatNumber(1.5, 2);
 * @returns The formatted value, or an empty string for null.
 */
const formatNumber: (value: number | null, precision: number) => string = (
    value: number | null,
    precision: number,
): string => {
    if (value === null) {
        return "";
    }

    return precision > 0 ? value.toFixed(precision) : `${value}`;
};

/**
 * Keeps focus in the field while a stepper button is pressed.
 * @param event - Mouse event from the stepper button.
 * @example
 * <button onMouseDown={preventFocusLoss} />
 * @returns Nothing.
 */
const preventFocusLoss: (event: MouseEvent<HTMLButtonElement>) => void = (
    event: MouseEvent<HTMLButtonElement>,
): void => {
    event.preventDefault();
};

/**
 * Renders a numeric text field with stepper buttons and a floating label.
 * @param props - Value, change handler, bounds, precision, hint, error, and variant.
 * @example
 * <NumberInput label="Guests" value={2} min={1} max={20} onChange={setGuests} />
 * @returns A number input element.
 */
const NumberInput: FC<NumberInputProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    precision,
    hint,
    error,
    disabled = false,
    placeholder,
    variant = "outline",
    className = "",
}: NumberInputProps) => {
    const field: FieldState = useField({ label, hint, error });
    const [draft, setDraft]: [string | null, (next: string | null) => void] = useState<string | null>(null);
    const composingRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const resolvedPrecision: number = Math.min(Math.max(precision ?? countDecimals(step), 0), 20);
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = field.invalid ? field.errorId : hasHint ? field.hintId : "";
    const displayValue: string = draft ?? formatNumber(value, resolvedPrecision);
    const atMinimum: boolean = disabled || (value !== null && min !== (void 0) && value <= min);
    const atMaximum: boolean = disabled || (value !== null && max !== (void 0) && value >= max);

    const normalise: (candidate: number) => number = (candidate: number): number =>
        clampValue(roundTo(candidate, resolvedPrecision), min, max);

    const commitText: (text: string) => void = (text: string): void => {
        const parsed: number | null | void = parseNumber(text);

        if (parsed === null) {
            onChange(null);
            return;
        }

        if (parsed === (void 0)) {
            return;
        }

        onChange(normalise(parsed));
    };

    const applyStep: (direction: number) => void = (direction: number): void => {
        if (disabled) {
            return;
        }

        const parsedDraft: number | null | void = draft === null ? (void 0) : parseNumber(draft);
        const base: number = typeof parsedDraft === "number" ? parsedDraft : (value ?? min ?? 0);
        const next: number = normalise(base + direction * step);

        setDraft(null);
        onChange(next);
    };

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        const text: string = event.currentTarget.value;

        setDraft(text);

        if (!composingRef.current) {
            commitText(text);
        }
    };

    const handleBlur: FocusEventHandler<HTMLInputElement> = (event: FocusEvent<HTMLInputElement>): void => {
        if (composingRef.current || draft === null) {
            return;
        }

        const parsed: number | null | void = parseNumber(event.currentTarget.value);

        setDraft(null);

        if (parsed === null) {
            onChange(null);
            return;
        }

        if (parsed === (void 0)) {
            return;
        }

        onChange(normalise(parsed));
    };

    const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (composingRef.current || event.nativeEvent.isComposing) {
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            applyStep(1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            applyStep(-1);
        }
    };

    const handleCompositionStart: CompositionEventHandler<HTMLInputElement> = (): void => {
        composingRef.current = true;
    };

    const handleCompositionEnd: CompositionEventHandler<HTMLInputElement> = (
        event: CompositionEvent<HTMLInputElement>,
    ): void => {
        const text: string = event.currentTarget.value;

        composingRef.current = false;
        setDraft(text);
        commitText(text);
    };

    const handleDecrease: () => void = (): void => {
        applyStep(-1);
    };

    const handleIncrease: () => void = (): void => {
        applyStep(1);
    };

    return (
        <div
            className={cx(
                "number-field",
                `number-field--${variant}`,
                field.invalid && "number-field--invalid",
                className,
            )}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            <div className="number-field__control">
                <Surface
                    className="number-field__surface"
                    background={<span className="number-field__background" />}
                    foreground={<span className="number-field__edge" />}
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <div className="number-field__row">
                        <input
                            id={field.controlId}
                            className="number-field__input"
                            type="text"
                            inputMode="decimal"
                            role="spinbutton"
                            autoComplete="off"
                            value={displayValue}
                            placeholder={placeholder === (void 0) || placeholder.length === 0 ? " " : placeholder}
                            disabled={disabled}
                            aria-invalid={field.invalid}
                            aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                            aria-valuemin={min}
                            aria-valuemax={max}
                            aria-valuenow={value === null ? (void 0) : value}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                        />

                        <span className="number-field__steps">
                            <button
                                type="button"
                                className="number-field__step"
                                aria-label="Decrease value"
                                disabled={atMinimum}
                                onMouseDown={preventFocusLoss}
                                onClick={handleDecrease}
                            >
                                <Icon name="Subtract" size={14} />
                            </button>
                            <button
                                type="button"
                                className="number-field__step"
                                aria-label="Increase value"
                                disabled={atMaximum}
                                onMouseDown={preventFocusLoss}
                                onClick={handleIncrease}
                            >
                                <Icon name="Plus" size={14} />
                            </button>
                        </span>
                    </div>
                </Surface>

                <label className="number-field__label" htmlFor={field.controlId}>
                    {label}
                </label>
            </div>

            {field.invalid ? (
                <p className="number-field__error" id={field.errorId} aria-live="polite">
                    {error}
                </p>
            ) : hasHint ? (
                <p className="number-field__hint" id={field.hintId}>
                    {hint}
                </p>
            ) : null}
        </div>
    );
};

export default NumberInput;
