import {
    useEffect,
    useId,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import cx from "../../foundation/cx";
import useMergedRef from "../../foundation/useMergedRef";
import Icon from "../../icon/Icon";
import Popover from "../../popover/Popover";
import Surface from "../../surface/Surface";
import { composeEventHandlers } from "../shared/composeEventHandlers";
import type { PickerDataAttributes } from "../shared/native";
import { NumberPicker } from "../number";
import PickerField from "../shared/PickerField";
import { useInternational, type InternationalContextValue } from "../../../international";
import "./TimePicker.css";

/**
 * Parsed 24-hour time.
 * Type: interface.
 * Fields: hour, minute.
 * @example
 * const parts: TimeParts = { hour: 9, minute: 30 };
 */
interface TimeParts {
    hour: number;
    minute: number;
}

/**
 * Props for the Material time picker.
 * Type: interface.
 * Fields: value, defaultValue, onChange, label, hint, error, step, placeholder, disabled,
 * readOnly, required, onOpenChange, popupClassName, className, id, ref, and the native
 * button attributes.
 * The trigger button receives `id`, `style`, `aria-*`, data attributes, and focus, blur,
 * click, and key handlers; callers can cancel the internal toggle with `preventDefault`.
 * `step` sets the minute wheel increment.
 * @example
 * <TimePicker label="Start time" value={time} onChange={setTime} />
 */
export interface TimePickerProps
    extends Omit<
            ButtonHTMLAttributes<HTMLButtonElement>,
            "type" | "value" | "defaultValue" | "onChange" | "children" | "className"
        >,
        PickerDataAttributes {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    label: string;
    hint?: string;
    error?: string;
    step?: number;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    onOpenChange?: (open: boolean) => void;
    popupClassName?: string;
    className?: string;
    ref?: Ref<HTMLButtonElement>;
}

/**
 * Pads a time component to two digits.
 * @param value - Hour or minute value.
 * @example
 * const text: string = pad(9);
 * @returns The zero-padded value.
 */
const pad: (value: number) => string = (value: number): string => `${value}`.padStart(2, "0");

/**
 * Parses a 24-hour time string.
 * @param value - Time in `HH:mm` form, optionally with seconds.
 * @example
 * const parts: TimeParts | void = parseTime("09:30");
 * @returns The parsed parts, or `(void 0)` when the value is not a valid time.
 */
const parseTime: (value: string) => TimeParts | void = (value: string): TimeParts | void => {
    const match: RegExpExecArray | null = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim());

    if (match === null) {
        return (void 0);
    }

    const hour: number = Number(match[1]);
    const minute: number = Number(match[2]);

    if (hour > 23 || minute > 59) {
        return (void 0);
    }

    return { hour, minute };
};

/**
 * Formats a 24-hour time as `HH:mm`.
 * @param hour - Hour from 0 to 23.
 * @param minute - Minute from 0 to 59.
 * @example
 * const value: string = formatTime(9, 30);
 * @returns The zero-padded time.
 */
const formatTime: (hour: number, minute: number) => string = (hour: number, minute: number): string =>
    `${pad(hour)}:${pad(minute)}`;

/**
 * Renders a custom time picker with paired Android-style hour and minute wheels.
 * The value is controlled when `value` is supplied and uncontrolled otherwise.
 * @param props - Time value, label, support text, open state, and change handler.
 * @example
 * <TimePicker label="Start" value="09:30" onChange={setTime} />
 * @returns A time picker.
 */
const TimePicker: FC<TimePickerProps> = ({
    value,
    defaultValue,
    onChange,
    label,
    hint,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    step,
    placeholder,
    className = "",
    id,
    onOpenChange,
    popupClassName,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
    "aria-describedby": ariaDescribedBy,
    ref,
    ...rest
}: TimePickerProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedPlaceholder: string = placeholder ?? t("selectTime");
    const generatedId: string = useId();
    const pickerId: string = id ?? generatedId;
    const panelId: string = `${pickerId}-panel`;
    const hintId: string = `${pickerId}-hint`;
    const errorId: string = `${pickerId}-error`;
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const mergedTriggerRef: RefCallback<HTMLButtonElement> = useMergedRef(triggerRef, ref);
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [open, setOpen]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [uncontrolledValue, setUncontrolledValue]: [string, (next: string) => void] = useState<string>(
        defaultValue ?? "",
    );

    const selectedValue: string = value === (void 0) ? uncontrolledValue : value;
    const parsed: TimeParts | void = parseTime(selectedValue);
    const parts: TimeParts = parsed ?? { hour: 0, minute: 0 };
    const hasValue: boolean = parsed !== (void 0);
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");

    useEffect((): void => {
        if (!open) {
            return;
        }

        const panel: HTMLDivElement | null = panelRef.current;
        const wheel: HTMLElement | null =
            panel?.querySelector<HTMLElement>("[role=spinbutton]") ??
            panel?.querySelector<HTMLElement>(".number-picker__wheel") ??
            null;

        wheel?.focus({ preventScroll: true });
    }, [open]);

    /**
     * Reports an open state change to the caller.
     * @param next - Requested open state.
     * @example
     * requestOpenChange(true);
     * @returns Nothing.
     */
    const requestOpenChange: (next: boolean) => void = (next: boolean): void => {
        if (next === open) {
            return;
        }

        setOpen(next);
        onOpenChange?.(next);
    };

    /**
     * Commits a new time and reports it to the caller.
     * @param next - Partial time to merge with the current value.
     * @example
     * commitTime({ hour: 10 });
     * @returns Nothing.
     */
    const commitTime: (next: Partial<TimeParts>) => void = (next: Partial<TimeParts>): void => {
        if (disabled || readOnly || (value !== (void 0) && onChange === (void 0))) {
            return;
        }

        const hour: number = Math.min(23, Math.max(0, next.hour ?? parts.hour));
        const minute: number = Math.min(59, Math.max(0, next.minute ?? parts.minute));
        const formatted: string = formatTime(hour, minute);

        if (value === (void 0)) {
            setUncontrolledValue(formatted);
        }

        onChange?.(formatted);
    };

    /**
     * Toggles the popup while honouring a cancelled caller event.
     * @param event - Click event from the trigger.
     * @example
     * <button onClick={handleTriggerClick} />
     * @returns Nothing.
     */
    const handleTriggerClick: (event: ReactMouseEvent<HTMLButtonElement>) => void = (): void => {
        if (disabled) {
            return;
        }

        requestOpenChange(!open);
    };

    /**
     * Opens the popup from the keyboard and closes it with Escape.
     * @param event - Keyboard event from the trigger.
     * @example
     * <button onKeyDown={handleTriggerKeyDown} />
     * @returns Nothing.
     */
    const handleTriggerKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void = (
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ): void => {
        if (disabled) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            requestOpenChange(true);
        } else if (event.key === "Escape" && open) {
            event.preventDefault();
            requestOpenChange(false);
        }
    };

    /**
     * Closes the popup with Escape and returns focus to the trigger.
     * @param event - Keyboard event from the panel.
     * @example
     * <div onKeyDown={handlePanelKeyDown} />
     * @returns Nothing.
     */
    const handlePanelKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.key !== "Escape") {
            return;
        }

        event.stopPropagation();
        requestOpenChange(false);
        triggerRef.current?.focus({ preventScroll: true });
    };

    return (
        <span ref={anchorRef} className={cx("time-picker", className)}>
            <PickerField
                label={label}
                hint={hint}
                error={error}
                htmlFor={pickerId}
                hintId={hintId}
                errorId={errorId}
                required={required}
                disabled={disabled}
            >
                <Surface
                    className="time-picker__ripple"
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <button
                        {...rest}
                        ref={mergedTriggerRef}
                        id={pickerId}
                        type="button"
                        className="time-picker__trigger"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-controls={open ? panelId : (void 0)}
                        aria-invalid={invalid ? "true" : (void 0)}
                        aria-readonly={readOnly ? "true" : (void 0)}
                        aria-required={required ? "true" : (void 0)}
                        aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                        data-placeholder={hasValue ? (void 0) : "true"}
                        onClick={composeEventHandlers(onTriggerClick, handleTriggerClick)}
                        onKeyDown={composeEventHandlers(onTriggerKeyDown, handleTriggerKeyDown)}
                    >
                        <Icon name="Clock" size={16} />
                        <span className="time-picker__value">
                            {hasValue ? formatTime(parts.hour, parts.minute) : resolvedPlaceholder}
                        </span>
                    </button>
                </Surface>
            </PickerField>

            <Popover
                open={open}
                onOpenChange={requestOpenChange}
                anchorRef={anchorRef}
                placement="bottom-start"
                className={popupClassName}
                ariaLabel={t("pickerAria", { label })}
            >
                <div
                    ref={panelRef}
                    id={panelId}
                    className="time-picker__panel"
                    role="dialog"
                    aria-label={t("pickerAria", { label })}
                    onKeyDown={handlePanelKeyDown}
                >
                    <div className="time-picker__wheels">
                        <NumberPicker
                            id={`${pickerId}-hours`}
                            label={t("hours")}
                            value={parts.hour}
                            min={0}
                            max={23}
                            formatter={pad}
                            disabled={disabled}
                            readOnly={readOnly}
                            onChange={(hour: number): void => commitTime({ hour })}
                        />
                        <NumberPicker
                            id={`${pickerId}-minutes`}
                            label={t("minutes")}
                            value={parts.minute}
                            min={0}
                            max={59}
                            step={step ?? 1}
                            formatter={pad}
                            disabled={disabled}
                            readOnly={readOnly}
                            onChange={(minute: number): void => commitTime({ minute })}
                        />
                    </div>
                </div>
            </Popover>
        </span>
    );
};

export default TimePicker;
