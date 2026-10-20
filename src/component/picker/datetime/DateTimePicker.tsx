import {
    useId,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type ChangeEvent,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Icon from "../../icon/Icon";
import Popover from "../../popover/Popover";
import Surface from "../../surface/Surface";
import Button from "../../button/Button";
import useControllableState from "../../foundation/useControllableState";
import useMergedRef from "../../foundation/useMergedRef";
import { composeEventHandlers } from "../shared/composeEventHandlers";
import type { PickerDataAttributes } from "../shared/native";
import PickerField from "../shared/PickerField";
import "./DateTimePicker.css";

interface DateTimeParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}

/**
 * Props for the input-friendly date-time picker.
 * Type: interface.
 * Fields: value, defaultValue, onChange, label, hint, error, disabled, readOnly, required,
 * placeholder, step, onOpenChange, popupClassName, id, className, ref, and the native
 * button attributes.
 * The trigger button receives `id`, `style`, `aria-*`, data attributes, and focus, blur,
 * click, and key handlers; callers can cancel the internal toggle with `preventDefault`.
 * `step` sets the minute input increment.
 * @example
 * <DateTimePicker label="Starts at" value={value} onChange={setValue} />
 */
export interface DateTimePickerProps
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
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    placeholder?: string;
    id?: string;
    className?: string;
    step?: number;
    onOpenChange?: (open: boolean) => void;
    popupClassName?: string;
    ref?: Ref<HTMLButtonElement>;
}

const pad: (value: number) => string = (value: number): string =>
    `${value}`.padStart(2, "0");

const daysInMonth: (year: number, month: number) => number = (
    year: number,
    month: number,
): number => new Date(year, month, 0).getDate();

/**
 * Parses an ISO date-time, falling back to the current local time.
 * @param value - ISO local date-time.
 * @example
 * const parts = parseDateTime("2026-10-20T09:30");
 * @returns Date and time parts.
 */
const parseDateTime: (value: string) => DateTimeParts = (value: string): DateTimeParts => {
    const match: RegExpMatchArray | null = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );
    const now: Date = new Date();

    if (match === null) {
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            minute: now.getMinutes(),
        };
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
    };
};

const toValue: (parts: DateTimeParts) => string = (parts: DateTimeParts): string =>
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;

/**
 * Renders a custom date-time picker whose year and month are editable inputs.
 * The value is controlled when `value` is supplied and uncontrolled otherwise.
 * @param props - Value, label, support text, open state, and change handler.
 * @example
 * <DateTimePicker label="Starts at" value="2026-10-20T09:30" onChange={setValue} />
 * @returns A date-time picker.
 */
const DateTimePicker: FC<DateTimePickerProps> = ({
    value,
    defaultValue,
    onChange,
    label,
    hint,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    placeholder = "Select date and time",
    id,
    className = "",
    step,
    onOpenChange,
    popupClassName,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
    "aria-describedby": ariaDescribedBy,
    ref,
    ...rest
}: DateTimePickerProps) => {
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const panelId: string = `${inputId}-panel`;
    const hintId: string = `${inputId}-hint`;
    const errorId: string = `${inputId}-error`;
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const mergedTriggerRef: RefCallback<HTMLButtonElement> = useMergedRef(triggerRef, ref);
    const [open, setOpen]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [selectedValue, setSelectedValue]: readonly [string, (next: string) => void] =
        useControllableState<string>({
            value,
            defaultValue: defaultValue ?? "",
            onChange,
        });
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");
    const parts: DateTimeParts = parseDateTime(selectedValue);

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
     * Commits a partial date-time and reports the ISO local value.
     * @param next - Partial date-time to merge with the current value.
     * @example
     * commit({ day: 21 });
     * @returns Nothing.
     */
    const commit: (next: Partial<DateTimeParts>) => void = (
        next: Partial<DateTimeParts>,
    ): void => {
        if (disabled || readOnly || (value !== (void 0) && onChange === (void 0))) {
            return;
        }

        const year: number = Math.min(2100, Math.max(1900, next.year ?? parts.year));
        const month: number = Math.min(12, Math.max(1, next.month ?? parts.month));
        const day: number = Math.min(
            daysInMonth(year, month),
            Math.max(1, next.day ?? parts.day),
        );
        const hour: number = Math.min(23, Math.max(0, next.hour ?? parts.hour));
        const minute: number = Math.min(59, Math.max(0, next.minute ?? parts.minute));

        setSelectedValue(toValue({ year, month, day, hour, minute }));
    };

    /**
     * Toggles the popup while honouring a cancelled caller event.
     * @example
     * <button onClick={handleTriggerClick} />
     * @returns Nothing.
     */
    const handleTriggerClick: () => void = (): void => {
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

    const firstWeekday: number = new Date(parts.year, parts.month - 1, 1).getDay();
    const dayCount: number = daysInMonth(parts.year, parts.month);
    const cells: Array<number | null> = [
        ...Array.from({ length: firstWeekday }, (): null => null),
        ...Array.from(
            { length: dayCount },
            (value: unknown, index: number): number => {
                void value;
                return index + 1;
            },
        ),
    ];

    const displayValue: string =
        selectedValue.length === 0
            ? placeholder
            : `${parts.year}/${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;

    return (
        <span ref={anchorRef} className={`date-time-picker ${className}`.trim()}>
            <PickerField
                label={label}
                hint={hint}
                error={error}
                htmlFor={inputId}
                hintId={hintId}
                errorId={errorId}
                required={required}
                disabled={disabled}
            >
                <Surface
                    className="date-time-picker__ripple"
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <button
                        {...rest}
                        ref={mergedTriggerRef}
                        id={inputId}
                        type="button"
                        className="date-time-picker__trigger"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-controls={open ? panelId : (void 0)}
                        aria-invalid={invalid ? "true" : (void 0)}
                        aria-readonly={readOnly ? "true" : (void 0)}
                        aria-required={required ? "true" : (void 0)}
                        aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                        onClick={composeEventHandlers(onTriggerClick, handleTriggerClick)}
                        onKeyDown={composeEventHandlers(onTriggerKeyDown, handleTriggerKeyDown)}
                    >
                        <Icon name="Calendar" size={16} />
                        {displayValue}
                    </button>
                </Surface>
            </PickerField>

            <Popover
                open={open}
                onOpenChange={requestOpenChange}
                anchorRef={anchorRef}
                placement="bottom-start"
                className={popupClassName}
                ariaLabel={`${label} picker`}
            >
                <div
                    id={panelId}
                    className="date-time-picker__panel"
                    role="dialog"
                    aria-label={`${label} picker`}
                    onKeyDown={handlePanelKeyDown}
                >
                    <div className="date-time-picker__header">
                        <label>
                            Year
                            <input
                                type="number"
                                min={1900}
                                max={2100}
                                value={parts.year}
                                readOnly={readOnly}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ year: Number(event.target.value) })
                                }
                            />
                        </label>
                        <label>
                            Month
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={parts.month}
                                readOnly={readOnly}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ month: Number(event.target.value) })
                                }
                            />
                        </label>
                    </div>

                    <div className="date-time-picker__weekdays" aria-hidden="true">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                            (weekday: string): ReactNode => (
                                <span key={weekday}>{weekday}</span>
                            ),
                        )}
                    </div>

                    <div className="date-time-picker__days" role="grid" aria-label="Days">
                        {cells.map(
                            (day: number | null, index: number): ReactNode =>
                                day === null ? (
                                    <span
                                        key={`empty-${index}`}
                                        className="date-time-picker__blank"
                                    />
                                ) : (
                                    <button
                                        key={day}
                                        type="button"
                                        className={
                                            day === parts.day
                                                ? "date-time-picker__day date-time-picker__day--selected"
                                                : "date-time-picker__day"
                                        }
                                        aria-pressed={day === parts.day}
                                        disabled={readOnly}
                                        onClick={(): void => commit({ day })}
                                    >
                                        {day}
                                    </button>
                                ),
                        )}
                    </div>

                    <div className="date-time-picker__time">
                        <label>
                            Hour
                            <input
                                type="number"
                                min={0}
                                max={23}
                                value={parts.hour}
                                readOnly={readOnly}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ hour: Number(event.target.value) })
                                }
                            />
                        </label>
                        <label>
                            Minute
                            <input
                                type="number"
                                min={0}
                                max={59}
                                step={step ?? 5}
                                value={parts.minute}
                                readOnly={readOnly}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ minute: Number(event.target.value) })
                                }
                            />
                        </label>
                    </div>

                    <footer className="date-time-picker__footer">
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={readOnly}
                            onClick={(): void => {
                                if (readOnly || disabled) {
                                    return;
                                }

                                setSelectedValue("");
                                requestOpenChange(false);
                            }}
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            onClick={(): void => {
                                commit({});
                                requestOpenChange(false);
                            }}
                        >
                            Apply
                        </Button>
                    </footer>
                </div>
            </Popover>
        </span>
    );
};

export default DateTimePicker;
