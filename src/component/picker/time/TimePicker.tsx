import {
    useEffect,
    useId,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type RefObject,
} from "react";
import cx from "../../foundation/cx";
import Icon from "../../icon/Icon";
import Popover from "../../popover/Popover";
import Surface from "../../surface/Surface";
import { NumberPicker } from "../number";
import PickerField from "../shared/PickerField";
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
 * className, id.
 * @example
 * <TimePicker label="Start time" value={time} onChange={setTime} />
 */
export interface TimePickerProps
    extends Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "type" | "value" | "defaultValue" | "onChange" | "children"
    > {
    value?: string;
    defaultValue?: string;
    onChange: (value: string) => void;
    label: string;
    hint?: string;
    error?: string;
    step?: number;
    placeholder?: string;
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
 * @param props - Time value, label, support text, and change handler.
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
    step,
    placeholder = "Select a time",
    className = "",
    id,
    onClick: onTriggerClick,
    ...rest
}: TimePickerProps) => {
    const generatedId: string = useId();
    const pickerId: string = id ?? generatedId;
    const panelId: string = `${pickerId}-panel`;
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [open, setOpen]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [uncontrolledValue, setUncontrolledValue]: [string, (next: string) => void] = useState<string>(
        defaultValue ?? "",
    );

    // Kept for API compatibility: the wheels always advance by one minute.
    void step;

    const selectedValue: string = value === (void 0) ? uncontrolledValue : value;
    const parsed: TimeParts | void = parseTime(selectedValue);
    const parts: TimeParts = parsed ?? { hour: 0, minute: 0 };
    const hasValue: boolean = parsed !== (void 0);

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

    const commitTime: (next: Partial<TimeParts>) => void = (next: Partial<TimeParts>): void => {
        if (disabled) {
            return;
        }

        const hour: number = Math.min(23, Math.max(0, next.hour ?? parts.hour));
        const minute: number = Math.min(59, Math.max(0, next.minute ?? parts.minute));
        const formatted: string = formatTime(hour, minute);

        if (value === (void 0)) {
            setUncontrolledValue(formatted);
        }

        onChange(formatted);
    };

    const handleTriggerClick: (event: ReactMouseEvent<HTMLButtonElement>) => void = (
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        onTriggerClick?.(event);

        if (disabled || event.defaultPrevented) {
            return;
        }

        setOpen(!open);
    };

    const handlePanelKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.key !== "Escape") {
            return;
        }

        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
    };

    return (
        <span ref={anchorRef} className={cx("time-picker", className)}>
            <PickerField
                label={label}
                hint={hint}
                error={error}
                htmlFor={pickerId}
                disabled={disabled}
            >
                <Surface
                    className="time-picker__ripple"
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <button
                        {...rest}
                        ref={triggerRef}
                        id={pickerId}
                        type="button"
                        className="time-picker__trigger"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-controls={open ? panelId : (void 0)}
                        data-placeholder={hasValue ? (void 0) : "true"}
                        onClick={handleTriggerClick}
                    >
                        <Icon name="Clock" size={16} />
                        <span className="time-picker__value">
                            {hasValue ? formatTime(parts.hour, parts.minute) : placeholder}
                        </span>
                    </button>
                </Surface>
            </PickerField>

            <Popover
                open={open}
                onOpenChange={setOpen}
                anchorRef={anchorRef}
                placement="bottom-start"
                ariaLabel={`${label} picker`}
            >
                <div
                    ref={panelRef}
                    id={panelId}
                    className="time-picker__panel"
                    role="dialog"
                    aria-label={`${label} picker`}
                    onKeyDown={handlePanelKeyDown}
                >
                    <div className="time-picker__wheels">
                        <NumberPicker
                            id={`${pickerId}-hours`}
                            label="Hours"
                            value={parts.hour}
                            min={0}
                            max={23}
                            formatter={pad}
                            disabled={disabled}
                            onChange={(hour: number): void => commitTime({ hour })}
                        />
                        <NumberPicker
                            id={`${pickerId}-minutes`}
                            label="Minutes"
                            value={parts.minute}
                            min={0}
                            max={59}
                            formatter={pad}
                            disabled={disabled}
                            onChange={(minute: number): void => commitTime({ minute })}
                        />
                    </div>
                </div>
            </Popover>
        </span>
    );
};

export default TimePicker;
