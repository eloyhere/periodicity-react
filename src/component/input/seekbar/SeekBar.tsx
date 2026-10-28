import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type CSSProperties,
    type Dispatch,
    type FC,
    type InputHTMLAttributes,
    type MutableRefObject,
    type PointerEvent as ReactPointerEvent,
    type PointerEventHandler,
    type ReactElement,
    type Ref,
    type SetStateAction,
} from "react";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import useField, { type FieldState } from "../../foundation/useField";
import Surface from "../../surface/Surface";
import "./SeekBar.css";

/**
 * Visual size of a SeekBar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: SeekBarSize = "lg";
 */
export type SeekBarSize = "sm" | "md" | "lg";

/**
 * Semantic tone of the active track and thumb.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: SeekBarTone = "mint";
 */
export type SeekBarTone = "accent" | "neutral" | "mint" | "violet" | "amber" | "danger";

/**
 * Axis along which a SeekBar is laid out and dragged.
 * Type: type alias.
 * Fields: none.
 * @example
 * const direction: SeekBarDirection = "vertical";
 */
export type SeekBarDirection = "horizontal" | "vertical";

/**
 * Props for the Android-style SeekBar.
 * Type: interface.
 * Native input attributes are forwarded to the underlying range input; `className` and `style` apply to the field root.
 * Fields: value, defaultValue, onChange, min, max, step, secondaryValue, ticks, label, showValue, format,
 * hint, error, size, tone, direction, length, disabled, className, id, onSeekStart, onSeekEnd, ref, and native
 * input attributes.
 * @param value - Controlled value.
 * @param defaultValue - Initial value when uncontrolled.
 * @param onChange - Called with the next numeric value.
 * @param min - Lower bound of the range.
 * @param max - Upper bound of the range.
 * @param step - Granularity of the range; values snap to this increment.
 * @param secondaryValue - Buffered value painted behind the active track, mirroring Android's secondary progress.
 * @param ticks - Shows tick marks; `true` derives their count from `step`, a number sets the mark count.
 * @param label - Visible label shown above the slider.
 * @param showValue - Shows the formatted value at the end of the label row.
 * @param format - Formats the displayed value and the accessible value text.
 * @param hint - Supporting text shown below the slider.
 * @param error - Validation message; replaces the hint and marks the slider invalid.
 * @param size - Control size.
 * @param tone - Semantic tone of the active track and thumb.
 * @param direction - Layout axis; horizontal by default, vertical grows from bottom to top.
 * @param length - Length of a vertical track in pixels; ignored when horizontal.
 * @param disabled - Disables the native range input.
 * @param className - Extra classes for the field root.
 * @param id - Id for the native input; generated when omitted.
 * @param onSeekStart - Called when a pointer starts dragging the thumb.
 * @param onSeekEnd - Called with the final value when a pointer stops dragging the thumb.
 * @param ref - Ref to the underlying input element.
 * @example
 * <SeekBar
 *     label="Playback"
 *     value={position}
 *     secondaryValue={72}
 *     onChange={setPosition}
 *     format={(value) => `${value}%`}
 *     showValue
 * />
 */
export interface SeekBarProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "size" | "className"
    > {
    value?: number;
    defaultValue?: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    secondaryValue?: number;
    ticks?: boolean | number;
    label?: string;
    showValue?: boolean;
    format?: (value: number) => string;
    hint?: string;
    error?: string;
    size?: SeekBarSize;
    tone?: SeekBarTone;
    direction?: SeekBarDirection;
    length?: number;
    disabled?: boolean;
    className?: string;
    id?: string;
    onSeekStart?: () => void;
    onSeekEnd?: (value: number) => void;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Largest number of tick marks rendered for one slider.
 * Type: number constant.
 * @example
 * const capped: number = Math.min(marks, MaxTickMarks);
 */
const MaxTickMarks: number = 64;

/**
 * Default track length for a vertical SeekBar.
 * Type: number constant.
 * @example
 * const length: number = DefaultVerticalLength;
 */
const DefaultVerticalLength: number = 240;

/**
 * Field-root style that accepts the vertical track length custom property.
 * Type: interface.
 * Fields: `--seekbar-length`.
 * @example
 * const style: SeekBarStyle = { "--seekbar-length": "240px" };
 */
interface SeekBarStyle extends CSSProperties {
    "--seekbar-length"?: string;
}

/**
 * Resolves a finite number or falls back to a default.
 * @param value - Number to inspect.
 * @param fallback - Value used when the input is absent or not finite.
 * @example
 * const step = toFiniteNumber(0.5, 1);
 * @returns A finite number.
 */
const toFiniteNumber: (value: number | void, fallback: number) => number = (
    value: number | void,
    fallback: number,
): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

/**
 * Constrains a number to an inclusive range.
 * @param value - Number to constrain.
 * @param minimum - Lower bound.
 * @param maximum - Upper bound.
 * @example
 * const bounded = clampValue(120, 0, 100);
 * @returns The constrained value.
 */
const clampValue: (value: number, minimum: number, maximum: number) => number = (
    value: number,
    minimum: number,
    maximum: number,
): number => Math.min(Math.max(value, minimum), maximum);

/**
 * Builds the fractions at which tick marks sit along the rail.
 * @param ticks - Tick request; `true` derives the count from the step, a number sets the mark count.
 * @param minimum - Lower bound of the range.
 * @param maximum - Upper bound of the range.
 * @param step - Granularity of the range.
 * @example
 * const percents = buildTickPercents(true, 0, 10, 1);
 * @returns Fractions from zero to one, or an empty list when ticks are off.
 */
const buildTickPercents: (
    ticks: boolean | number | void,
    minimum: number,
    maximum: number,
    step: number,
) => readonly number[] = (
    ticks: boolean | number | void,
    minimum: number,
    maximum: number,
    step: number,
): readonly number[] => {
    if (ticks === (void 0) || ticks === false || ticks === 0) {
        return [];
    }

    const span: number = maximum - minimum;
    const derived: number =
        typeof ticks === "number" && Number.isFinite(ticks)
            ? Math.round(ticks)
            : Math.round(span / step) + 1;
    const count: number = Math.min(Math.max(derived, 2), MaxTickMarks);
    const percents: number[] = [];

    for (let index: number = 0; index < count; index += 1) {
        percents.push(index / (count - 1));
    }

    return percents;
};

/**
 * Renders an Android-style seek bar on a Surface track.
 * A native range input handles keyboard, pointer, form, and screen-reader
 * behaviour beneath the painted rail, thumb, buffer, and tick marks.
 * @param props - Value, bounds, step, buffer, ticks, label, formatting, size, tone, and seek callbacks.
 * @example
 * <SeekBar label="Volume" value={40} onChange={setVolume} format={(value) => `${value}%`} showValue />
 * @returns A seek bar element.
 */
const SeekBar: FC<SeekBarProps> = ({
    value,
    defaultValue,
    onChange,
    min,
    max,
    step,
    secondaryValue,
    ticks = false,
    label,
    showValue = false,
    format,
    hint,
    error,
    size = "md",
    tone = "accent",
    direction = "horizontal",
    length = DefaultVerticalLength,
    disabled = false,
    className = "",
    style,
    id,
    onSeekStart,
    onSeekEnd,
    onPointerDown: callerPointerDown,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ref,
    ...rest
}: SeekBarProps) => {
    const field: FieldState = useField({ id, label, hint, error });
    const minimum: number = toFiniteNumber(min, 0);
    const maximum: number = Math.max(toFiniteNumber(max, 100), minimum + 1);
    const requestedStep: number = toFiniteNumber(step, 1);
    const increment: number = requestedStep > 0 ? requestedStep : 1;
    const vertical: boolean = direction === "vertical";
    const verticalLength: number = Math.max(toFiniteNumber(length, DefaultVerticalLength), 1);
    const initialValue: number = clampValue(toFiniteNumber(defaultValue, minimum), minimum, maximum);
    const [rawValue, setValue]: readonly [number, (next: number) => void] =
        useControllableState<number>({
            value: typeof value === "number" && Number.isFinite(value) ? value : (void 0),
            defaultValue: initialValue,
            onChange,
        });
    const currentValue: number = clampValue(rawValue, minimum, maximum);
    const span: number = maximum - minimum;
    const progress: number = span > 0 ? (currentValue - minimum) / span : 0;
    const hasSecondary: boolean = typeof secondaryValue === "number" && Number.isFinite(secondaryValue);
    const secondaryProgress: number = hasSecondary
        ? clampValue((secondaryValue as number) - minimum, 0, span) / span
        : 0;
    const displayValue: string = format === (void 0) ? `${currentValue}` : format(currentValue);
    const tickPercents: readonly number[] = buildTickPercents(ticks, minimum, maximum, increment);
    const hasLabel: boolean = label !== (void 0) && label.length > 0;
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const hasHeader: boolean = hasLabel || showValue;
    const describedBy: string = [
        field.invalid ? field.errorId : hasHint ? field.hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const fillStyle: CSSProperties = vertical
        ? { height: `${progress * 100}%` }
        : { width: `${progress * 100}%` };
    const secondaryStyle: CSSProperties = vertical
        ? { height: `${secondaryProgress * 100}%` }
        : { width: `${secondaryProgress * 100}%` };
    const thumbStyle: CSSProperties = vertical
        ? { bottom: `${progress * 100}%` }
        : { insetInlineStart: `${progress * 100}%` };
    const rootStyle: SeekBarStyle = vertical
        ? { "--seekbar-length": `${verticalLength}px`, ...style }
        : { ...style };
    const [tracking, setTracking]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [rippleKey, setRippleKey]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const isTrackingRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const valueRef: MutableRefObject<number> = useRef<number>(currentValue);

    /**
     * Restarts the thumb ripple by remounting its animation element.
     * @example
     * triggerRipple();
     * @returns Nothing.
     */
    const triggerRipple: () => void = (): void => {
        setRippleKey((current: number): number => current + 1);
    };

    /**
     * Starts a ripple when a pointer enters the control.
     * @param event - Pointer enter event on the surface.
     * @example
     * <Surface onPointerEnter={handlePointerEnter} />
     * @returns Nothing.
     */
    const handlePointerEnter: PointerEventHandler<HTMLDivElement> = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (!disabled && event.pointerType !== "touch") {
            triggerRipple();
        }
    };

    useEffect((): void => {
        valueRef.current = currentValue;
    }, [currentValue]);

    const handleChange: ChangeEventHandler<HTMLInputElement> = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const next: number = event.currentTarget.valueAsNumber;

        if (!Number.isFinite(next)) {
            return;
        }

        const bounded: number = clampValue(next, minimum, maximum);
        valueRef.current = bounded;
        setValue(bounded);
    };

    const handlePointerDown: PointerEventHandler<HTMLInputElement> = (
        event: ReactPointerEvent<HTMLInputElement>,
    ): void => {
        callerPointerDown?.(event);

        if (disabled || event.defaultPrevented || event.button !== 0) {
            return;
        }

        if (!isTrackingRef.current) {
            isTrackingRef.current = true;
            setTracking(true);
            triggerRipple();
            onSeekStart?.();
        }
    };

    useEffect((): (() => void) => {
        if (!tracking) {
            return (): void => {};
        }

        const stopTracking: () => void = (): void => {
            if (!isTrackingRef.current) {
                return;
            }

            isTrackingRef.current = false;
            setTracking(false);
            onSeekEnd?.(valueRef.current);
        };

        window.addEventListener("pointerup", stopTracking, true);
        window.addEventListener("pointercancel", stopTracking, true);
        window.addEventListener("blur", stopTracking);

        return (): void => {
            window.removeEventListener("pointerup", stopTracking, true);
            window.removeEventListener("pointercancel", stopTracking, true);
            window.removeEventListener("blur", stopTracking);
        };
    }, [tracking, onSeekEnd]);

    return (
        <div
            className={cx(
                "seekbar",
                `seekbar--${direction}`,
                `seekbar--${size}`,
                `seekbar--${tone}`,
                className,
            )}
            style={rootStyle}
            data-direction={direction}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-dragging={tracking ? "true" : "false"}
        >
            {hasHeader ? (
                <div className="seekbar__header">
                    {hasLabel ? (
                        <label className="seekbar__label" htmlFor={field.controlId}>
                            {label}
                        </label>
                    ) : (
                        <span className="seekbar__spacer" />
                    )}
                    {showValue ? (
                        <output className="seekbar__value" htmlFor={field.controlId}>
                            {displayValue}
                        </output>
                    ) : null}
                </div>
            ) : null}

            <Surface
                className="seekbar__surface"
                tone={tone}
                ripple={false}
                disabled={disabled}
                onPointerEnter={handlePointerEnter}
            >
                <span className="seekbar__rail" aria-hidden="true">
                    <span className="seekbar__track" />
                    {hasSecondary ? (
                        <span className="seekbar__secondary" style={secondaryStyle} />
                    ) : null}
                    <span className="seekbar__fill" style={fillStyle} />
                    {tickPercents.map(
                        (fraction: number): ReactElement => (
                            <span
                                key={`tick-${fraction}`}
                                className={cx(
                                    "seekbar__tick",
                                    fraction <= progress && "seekbar__tick--active",
                                )}
                                style={
                                    vertical
                                        ? { bottom: `${fraction * 100}%` }
                                        : { insetInlineStart: `${fraction * 100}%` }
                                }
                            />
                        ),
                    )}
                    <span className="seekbar__thumb" style={thumbStyle} />
                </span>

                <span className="seekbar__ripple-layer" aria-hidden="true">
                    {rippleKey > 0 ? (
                        <span className="seekbar__ripple-rail">
                            <span key={rippleKey} className="seekbar__ripple" style={thumbStyle} />
                        </span>
                    ) : null}
                </span>

                <input
                    {...rest}
                    ref={ref}
                    id={field.controlId}
                    className="seekbar__native"
                    type="range"
                    min={minimum}
                    max={maximum}
                    step={increment}
                    value={currentValue}
                    disabled={disabled}
                    aria-orientation={direction}
                    aria-invalid={field.invalid ? true : ariaInvalid}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    aria-valuetext={displayValue}
                    onPointerDown={handlePointerDown}
                    onChange={handleChange}
                />
            </Surface>

            {field.invalid ? (
                <p className="seekbar__error" id={field.errorId} aria-live="polite">
                    {error}
                </p>
            ) : hasHint ? (
                <p className="seekbar__hint" id={field.hintId}>
                    {hint}
                </p>
            ) : null}
        </div>
    );
};

export default SeekBar;
